import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
    ResponsiveContainer,
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    Cell,
    LineChart,
    Line,
    Legend
} from 'recharts';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Play,
    Clock,
    Filter,
    Loader2,
    Sparkles,
    Heart,
    Activity,
    Moon,
    Wind,
    ShieldCheck,
    Award,
    Lock,
    Volume2,
    CheckCircle2,
    Eye
} from 'lucide-react';
import { API_URL, BASE_URL } from '../config';
import { EVENT_LABELS } from '../services/yamnetClassifier';
import EventDetailDrawer from '../components/EventDetailDrawer';
import AudioPlayerBar from '../components/AudioPlayerBar';

export default function NightTimeline() {
    const [searchParams, setSearchParams] = useSearchParams();
    const dateParam = searchParams.get('date');
    const [selectedDate, setSelectedDate] = useState(dateParam || new Date().toISOString().slice(0, 10));
    const [nightData, setNightData] = useState(null);
    const [healthConnectSession, setHealthConnectSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('all');
    const [selectedEvent, setSelectedEvent] = useState(null);

    // Audio playback state
    const [activePlayingSession, setActivePlayingSession] = useState(null);
    const [activeAudioSource, setActiveAudioSource] = useState(null);
    const [playbackNotice, setPlaybackNotice] = useState(null);

    // If query param changes externally, update selectedDate
    useEffect(() => {
        if (dateParam && dateParam !== selectedDate) {
            setSelectedDate(dateParam);
        }
    }, [dateParam]);

    const fetchNightData = async (dateStr) => {
        setLoading(true);
        setPlaybackNotice(null);
        try {
            const token = localStorage.getItem('adminToken');

            // 1. Fetch legacy / acoustic audio night data
            const res = await axios.get(`${API_URL}/sessions/night/${dateStr}`, {
                headers: { Authorization: `Bearer ${token}` }
            }).catch(() => ({ data: null }));
            setNightData(res.data);

            // 2. Fetch Google Health Connect & mobile synchronized session
            const hcRes = await axios.get(`${API_URL}/night-sessions/date/${dateStr}`, {
                headers: { Authorization: `Bearer ${token}` }
            }).catch(() => ({ data: null }));
            setHealthConnectSession(hcRes.data?.session || null);

        } catch (error) {
            console.error('Error fetching night session:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNightData(selectedDate);
    }, [selectedDate]);

    const changeDate = (deltaDays) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + deltaDays);
        const nextDate = d.toISOString().slice(0, 10);
        setSelectedDate(nextDate);
        setSearchParams({ date: nextDate });
    };

    // Unify events: prefer correlatedEvents from mobile synchronized session if available
    const mobileEvents = (healthConnectSession?.correlatedEvents && healthConnectSession.correlatedEvents.length > 0)
        ? healthConnectSession.correlatedEvents
        : [];
    const legacyEvents = nightData?.events || [];
    const events = mobileEvents.length > 0 ? mobileEvents : legacyEvents;

    // Filter events by selected category
    const filteredEvents = events.filter(e => {
        if (filterType === 'all') return true;
        const normalizedType = (e.eventType === 'speech') ? 'voice' : e.eventType;
        return normalizedType === filterType;
    });

    // Helper to calculate category count with fallbacks
    const getCategoryCount = (typeKey) => {
        const countInEvents = events.filter(e => {
            const normalized = (e.eventType === 'speech') ? 'voice' : e.eventType;
            return normalized === typeKey;
        }).length;

        if (countInEvents > 0) return countInEvents;

        // Fallbacks from mobile metrics
        if (typeKey === 'snore' && healthConnectSession?.snoreMetrics?.totalSnoreEvents) {
            return healthConnectSession.snoreMetrics.totalSnoreEvents;
        }
        if (typeKey === 'cough' && healthConnectSession?.nightSummary?.coughCount) {
            return healthConnectSession.nightSummary.coughCount;
        }
        if (typeKey === 'voice' && healthConnectSession?.nightSummary?.speechCount) {
            return healthConnectSession.nightSummary.speechCount;
        }
        if (nightData?.eventBreakdown?.[typeKey]) {
            return nightData.eventBreakdown[typeKey];
        }
        return 0;
    };

    const totalEventsCount = events.length > 0
        ? events.length
        : (healthConnectSession?.nightSummary?.totalAcousticEvents
           || (healthConnectSession?.snoreMetrics?.totalSnoreEvents || 0)
           || nightData?.totalEvents
           || 0);

    const totalDurationMinutes = healthConnectSession?.sleepSummary?.durationMinutes
        || (nightData?.totalDurationSeconds ? Math.round(nightData.totalDurationSeconds / 60) : 0)
        || (events.length > 0 ? Math.round(events.reduce((acc, curr) => acc + (curr.duration || 15), 0) / 60) : 0);

    // Convert events into scatter plot format (x = hours from 0 to 24, y = dB intensity)
    const scatterData = filteredEvents.map((e, index) => {
        let hours = 0;
        let mins = 0;
        let timeStr = e.timeLabel || '';

        const baseTimestamp = healthConnectSession?.startTime 
            ? new Date(healthConnectSession.startTime).getTime()
            : (nightData?.session?.startTime ? new Date(nightData.session.startTime).getTime() : 0);

        const offsetMs = e.offsetMs !== undefined ? e.offsetMs : (e.offsetSeconds !== undefined ? e.offsetSeconds * 1000 : 0);

        const timestamp = e.detectedAt || e.timestamp || e.createdAt;
        if (timestamp) {
            const d = new Date(timestamp);
            if (!isNaN(d.getTime())) {
                hours = d.getHours();
                mins = d.getMinutes();
                if (!timeStr) timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
        } else if (baseTimestamp > 0 && offsetMs > 0) {
            const d = new Date(baseTimestamp + offsetMs);
            hours = d.getHours();
            mins = d.getMinutes();
            if (!timeStr) timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (offsetMs > 0) {
            const totalSecs = Math.floor(offsetMs / 1000);
            hours = Math.floor(totalSecs / 3600);
            mins = Math.floor((totalSecs % 3600) / 60);
            if (!timeStr) timeStr = `+${hours > 0 ? `${hours}h ` : ''}${mins}m`;
        }

        const timeInHours = hours + (mins / 60);
        const normalizedType = (e.eventType === 'speech') ? 'voice' : (e.eventType || e.type || 'unknown');
        const meta = EVENT_LABELS[normalizedType] || EVENT_LABELS.unknown;

        // Intensity dB
        const intensityVal = e.intensityDb !== undefined && e.intensityDb !== null
            ? (e.intensityDb < 0 ? Math.max(35, Math.min(95, Math.round(95 + e.intensityDb))) : e.intensityDb)
            : (e.peakDb ? Math.max(35, Math.min(95, Math.round(95 + e.peakDb))) : 55);

        const eventNumber = e.eventNumber || (index + 1);

        return {
            x: Number(timeInHours.toFixed(2)),
            y: intensityVal,
            confidence: e.confidence || 85,
            duration: e.duration || 5,
            type: normalizedType,
            typeName: meta.es,
            color: meta.color,
            timeStr: timeStr || '--:--',
            eventNumber,
            rawEvent: { ...e, eventNumber, eventType: normalizedType, _id: e._id || `evt-${index}` }
        };
    });

    // Format Health Connect time series for combined Recharts chart
    const healthChartData = (healthConnectSession?.heartRateSeries || []).map(h => {
        const d = new Date(h.timestamp);
        const timeLabel = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const respMatch = (healthConnectSession?.respiratoryRateSeries || []).find(r => {
            return Math.abs(new Date(r.timestamp) - d) < 10 * 60 * 1000;
        });

        const spo2Match = (healthConnectSession?.oxygenSaturationSeries || []).find(s => {
            return Math.abs(new Date(s.timestamp) - d) < 15 * 60 * 1000;
        });

        return {
            time: timeLabel,
            bpm: h.bpm,
            rpm: respMatch ? respMatch.rpm : null,
            spo2: spo2Match ? spo2Match.percentage : null
        };
    });

    const playSessionAudio = async (session) => {
        setPlaybackNotice(null);
        setSelectedEvent(session);

        // If event has no server audio file (e.g. mobile stats-only sync or telemetry-only)
        if (!session.audioBase64 && !session.audioUrl && !session.storageKey && String(session._id).startsWith('evt-')) {
            setActivePlayingSession(null);
            setActiveAudioSource(null);
            setPlaybackNotice(`Evento "${session.eventType || 'acústico'}" a las ${session.timeStr || ''} registrado como telemetría acústica. El audio original reside de forma privada en el dispositivo móvil.`);
            return;
        }

        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.get(`${API_URL}/sessions/${session._id}/audio`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            let url = null;
            if (res.data?.audioBase64) {
                let b64 = res.data.audioBase64;
                if (!b64.startsWith('data:')) b64 = `data:audio/m4a;base64,${b64}`;
                url = b64;
            } else if (res.data?.audioUrl) {
                url = res.data.audioUrl.startsWith('http')
                    ? res.data.audioUrl
                    : `${BASE_URL}${res.data.audioUrl}`;
            } else if (res.data?.streamUrl) {
                const streamPath = res.data.streamUrl;
                const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
                url = `${BASE_URL}${streamPath}${tokenParam}`;
            }

            if (url) {
                setActivePlayingSession(session);
                setActiveAudioSource(url);
                setPlaybackNotice(null);
            } else {
                setActivePlayingSession(null);
                setActiveAudioSource(null);
                setPlaybackNotice('🔒 Audio 100% privado en el teléfono móvil: Este evento acústico fue clasificado localmente (EinsDream 3.0 Zero-Cloud Audio).');
            }
        } catch {
            setActivePlayingSession(null);
            setActiveAudioSource(null);
            setPlaybackNotice('🔒 Audio 100% privado en el teléfono móvil: Este evento acústico fue clasificado localmente (EinsDream 3.0 Zero-Cloud Audio).');
        }
    };

    const einsScore = healthConnectSession?.einsdreamScore;
    const dimensions = healthConnectSession?.dimensions;
    const snoreMetrics = healthConnectSession?.snoreMetrics;
    const pauseSegments = healthConnectSession?.pauseSegments || [];

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', paddingBottom: activePlayingSession ? '100px' : '2rem' }}>
            {/* Header & Date Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'white', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
                        Línea de Tiempo Nocturna
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Correlación de telemetría acústica, biométrica y evaluación de descanso
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.35rem 0.5rem' }}>
                    <button onClick={() => changeDate(-1)} className="icon-btn" title="Día anterior">
                        <ChevronLeft size={18} />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 0.5rem' }}>
                        <Calendar size={16} color="var(--accent-primary)" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => {
                                setSelectedDate(e.target.value);
                                setSearchParams({ date: e.target.value });
                            }}
                            style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: '600', fontSize: '0.9rem', outline: 'none', cursor: 'pointer' }}
                        />
                    </div>

                    <button onClick={() => changeDate(1)} className="icon-btn" title="Día siguiente">
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* PRIVACY NOTICE / BANNER IF APPLICABLE */}
            {pauseSegments.length > 0 && (
                <div style={{
                    background: 'rgba(99, 102, 241, 0.12)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '12px',
                    padding: '0.85rem 1.25rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    color: '#C7D2FE',
                    fontSize: '0.85rem'
                }}>
                    <Lock size={18} color="#818CF8" style={{ flexShrink: 0 }} />
                    <div>
                        <strong>Privacidad protegida:</strong> Esta noche incluye <strong>{pauseSegments.length} pausa(s) voluntaria(s)</strong> de grabación solicitada(s) por el usuario. El micrófono se detuvo y no se alteró la continuidad de la noche.
                    </div>
                </div>
            )}

            {playbackNotice && (
                <div style={{
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '12px',
                    padding: '0.85rem 1.25rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    color: '#A7F3D0',
                    fontSize: '0.85rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Volume2 size={18} color="#10B981" />
                        <span>{playbackNotice}</span>
                    </div>
                    <button
                        onClick={() => setPlaybackNotice(null)}
                        style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* EINSDREAM SLEEP SCORE & 3 PILLARS CARD */}
            {(einsScore || healthConnectSession?.sleepSummary) && (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)',
                    borderRadius: '16px',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    padding: '1.5rem',
                    marginBottom: '2rem',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.35)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)'
                            }}>
                                <Award size={24} color="white" />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'white', margin: 0 }}>
                                    Einsdream Sleep Score: {einsScore?.totalScore !== undefined ? `${einsScore.totalScore} / 100` : `${healthConnectSession.sleepSummary?.sleepEfficiency || 88}%`}
                                </h2>
                                <span style={{ fontSize: '0.8rem', color: '#C7D2FE' }}>
                                    {einsScore?.grade ? `Calificación: ${einsScore.grade}` : 'Evaluación del descanso nocturno'} • {einsScore?.description || 'Monitoreo activo sincronizado'}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '20px', padding: '0.35rem 0.85rem' }}>
                            <Sparkles size={14} color="#A78BFA" />
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#A78BFA' }}>
                                {healthConnectSession?.syncedFromMobile ? '📱 Sincronizado desde Móvil' : 'Modo Autónomo Einsdream'}
                            </span>
                        </div>
                    </div>

                    {/* 3 Pillars Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: '#818CF8', fontWeight: '700', textTransform: 'uppercase' }}>
                                <Clock size={13} /> 1. Regularidad
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', margin: '0.2rem 0' }}>
                                {einsScore?.regularidadScore ?? dimensions?.regularity?.score ?? 85} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>/ 100</span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                                Horario estable de acostarse
                            </div>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: '#38BDF8', fontWeight: '700', textTransform: 'uppercase' }}>
                                <Moon size={13} /> 2. Duración
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', margin: '0.2rem 0' }}>
                                {einsScore?.duracionScore ?? dimensions?.duration?.score ?? 90} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>/ 100</span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                                {Math.floor(totalDurationMinutes / 60)}h {totalDurationMinutes % 60}m monitoreados
                            </div>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: '#10B981', fontWeight: '700', textTransform: 'uppercase' }}>
                                <Wind size={13} /> 3. Calidad & Ronquidos
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', margin: '0.2rem 0' }}>
                                {einsScore?.calidadScore ?? dimensions?.quality?.score ?? 85} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>/ 100</span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                                {snoreMetrics?.totalSnoreEvents ? `${snoreMetrics.totalSnoreEvents} ronquidos (máx ${snoreMetrics.peakSnoreDb || 0} dB)` : 'Sin interferencia severa'}
                            </div>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: '#F59E0B', fontWeight: '700', textTransform: 'uppercase' }}>
                                <Activity size={13} /> Eficiencia
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', margin: '0.2rem 0' }}>
                                {healthConnectSession?.sleepSummary?.sleepEfficiency || 92}%
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                                {pauseSegments.length > 0 ? `${pauseSegments.length} pausa(s) privada(s)` : 'Descanso continuo'}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* GOOGLE HEALTH CONNECT BIOMETRIC CARDS IF DATA AVAILABLE */}
            {healthConnectSession && healthConnectSession.heartRateSeries?.length > 0 && (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
                    borderRadius: '16px',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    padding: '1.5rem',
                    marginBottom: '2rem',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '0.4rem', borderRadius: '8px' }}>
                                <Heart size={20} color="#ef4444" />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'white', margin: 0 }}>
                                    Google Health Connect
                                </h2>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                    Datos fisiológicos integrados con el audio nocturno
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(16, 185, 129, 0.15)', padding: '0.3rem 0.75rem', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                            <ShieldCheck size={14} color="#10b981" />
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#10b981' }}>
                                Sincronizado en Lote
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#ef4444', fontWeight: '700', textTransform: 'uppercase' }}>
                                <Heart size={14} /> Frecuencia Cardíaca
                            </div>
                            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'white', margin: '0.2rem 0' }}>
                                {healthConnectSession.nightSummary?.avgHeartRate || '--'} <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)' }}>bpm</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                Mín {healthConnectSession.nightSummary?.minHeartRate || '--'} / Máx {healthConnectSession.nightSummary?.maxHeartRate || '--'} bpm
                            </div>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#818cf8', fontWeight: '700', textTransform: 'uppercase' }}>
                                <Moon size={14} /> Sueño Registrado
                            </div>
                            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'white', margin: '0.2rem 0' }}>
                                {Math.floor((healthConnectSession.sleepSummary?.durationMinutes || 0) / 60)}h {(healthConnectSession.sleepSummary?.durationMinutes || 0) % 60}m
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                Eficiencia: {healthConnectSession.sleepSummary?.sleepEfficiency || 92}%
                            </div>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#10b981', fontWeight: '700', textTransform: 'uppercase' }}>
                                <Wind size={14} /> Respiración
                            </div>
                            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'white', margin: '0.2rem 0' }}>
                                {healthConnectSession.nightSummary?.avgRespiratoryRate || '--'} <span style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)' }}>rpm</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                Ritmo basal nocturno
                            </div>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#38bdf8', fontWeight: '700', textTransform: 'uppercase' }}>
                                <Activity size={14} /> Saturación SpO2
                            </div>
                            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'white', margin: '0.2rem 0' }}>
                                {healthConnectSession.nightSummary?.avgOxygenSaturation || 97}%
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                Rango normal en sueño
                            </div>
                        </div>
                    </div>

                    {/* COMBINED PHYSIOLOGICAL CURVE */}
                    {healthChartData.length > 0 && (
                        <div style={{ marginTop: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'white', marginBottom: '1rem' }}>
                                Curva Nocturna: Pulso (bpm) y Frecuencia Respiratoria (rpm)
                            </h3>
                            <div style={{ height: '220px', width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                                    <LineChart data={healthChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="time" stroke="var(--text-tertiary)" tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} />
                                        <YAxis stroke="var(--text-tertiary)" tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} domain={['dataMin - 5', 'dataMax + 5']} />
                                        <Tooltip
                                            content={({ payload, label }) => {
                                                if (payload && payload.length) {
                                                    return (
                                                        <div style={{ background: '#1e293b', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                                                            <div style={{ fontWeight: '700', marginBottom: '0.25rem' }}>{label}</div>
                                                            <div style={{ color: '#ef4444', fontSize: '0.85rem' }}>Pulso: {payload[0]?.value} bpm</div>
                                                            {payload[1] && <div style={{ color: '#10b981', fontSize: '0.85rem' }}>Respiración: {payload[1]?.value} rpm</div>}
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                                        <Line type="monotone" dataKey="bpm" name="Frecuencia Cardíaca (bpm)" stroke="#ef4444" strokeWidth={2} dot={false} />
                                        <Line type="monotone" dataKey="rpm" name="Respiración (rpm)" stroke="#10b981" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Night Summary KPI Badges (Acoustic Events) */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                        Total Eventos
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'white', margin: '0.3rem 0' }}>
                        {totalEventsCount}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {totalDurationMinutes} min
                    </div>
                </div>

                {Object.entries(EVENT_LABELS).filter(([k]) => k !== 'unknown').map(([typeKey, meta]) => {
                    const count = getCategoryCount(typeKey);
                    return (
                        <div
                            key={typeKey}
                            onClick={() => setFilterType(filterType === typeKey ? 'all' : typeKey)}
                            className="glass-card"
                            style={{
                                padding: '1.25rem',
                                textAlign: 'center',
                                cursor: 'pointer',
                                border: filterType === typeKey ? `1px solid ${meta.color}` : '1px solid var(--border-color)',
                                background: filterType === typeKey ? `${meta.color}15` : 'var(--card-bg)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: meta.color }} />
                                <span>{meta.es}</span>
                            </div>
                            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: count > 0 ? meta.color : 'white', margin: '0.3rem 0' }}>
                                {count}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                                {count > 0 ? `${count} eventos` : '0 eventos'}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Scatter Plot Chart */}
            <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'white', margin: 0 }}>
                            Distribución de Eventos Acústicos (24h)
                        </h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                            Cada punto representa una detección acústica clasificada por IA en la noche
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => setFilterType('all')}
                            style={{
                                padding: '0.35rem 0.75rem',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                border: '1px solid var(--border-color)',
                                background: filterType === 'all' ? 'var(--accent-primary)' : 'transparent',
                                color: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            Todos ({events.length})
                        </button>
                        {Object.entries(EVENT_LABELS).filter(([k]) => k !== 'unknown').map(([k, meta]) => {
                            const c = getCategoryCount(k);
                            return (
                                <button
                                    key={k}
                                    onClick={() => setFilterType(filterType === k ? 'all' : k)}
                                    style={{
                                        padding: '0.35rem 0.75rem',
                                        borderRadius: '8px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        border: `1px solid ${meta.color}40`,
                                        background: filterType === k ? `${meta.color}30` : 'transparent',
                                        color: meta.color,
                                        cursor: 'pointer'
                                    }}
                                >
                                    {meta.es} ({c})
                                </button>
                            );
                        })}
                    </div>
                </div>

                {loading ? (
                    <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Loader2 className="animate-spin" size={32} color="var(--accent-primary)" />
                    </div>
                ) : scatterData.length === 0 ? (
                    <div style={{ height: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                        <Moon size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                        <p style={{ margin: 0, fontWeight: '500' }}>No hay eventos sonoros registrados en esta fecha</p>
                    </div>
                ) : (
                    <div style={{ height: '320px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    type="number"
                                    dataKey="x"
                                    domain={[0, 24]}
                                    ticks={[0, 3, 6, 9, 12, 15, 18, 21, 24]}
                                    tickFormatter={(val) => `${val.toString().padStart(2, '0')}:00`}
                                    stroke="var(--text-tertiary)"
                                    tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                                    name="Hora"
                                />
                                <YAxis
                                    type="number"
                                    dataKey="y"
                                    domain={[35, 95]}
                                    unit=" dB"
                                    stroke="var(--text-tertiary)"
                                    tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                                    name="Intensidad"
                                />
                                <Tooltip
                                    cursor={{ strokeDasharray: '3 3' }}
                                    content={({ payload }) => {
                                        if (payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div style={{ background: '#161A23', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                                                    <div style={{ color: data.color, fontWeight: '700', fontSize: '0.9rem' }}>
                                                        {data.typeName} ({data.confidence}%)
                                                    </div>
                                                    <div style={{ color: 'white', marginTop: '0.2rem', fontSize: '0.85rem' }}>
                                                        Hora: {data.timeStr}
                                                    </div>
                                                    <div style={{ color: '#F59E0B', fontSize: '0.85rem' }}>
                                                        Intensidad: {data.y} dB • {data.duration}s
                                                    </div>
                                                    <div style={{ color: '#818CF8', fontSize: '0.75rem', marginTop: '0.3rem', fontWeight: '600' }}>
                                                        ● Clic para inspeccionar evento
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Scatter
                                    data={scatterData}
                                    onClick={(node) => {
                                        setSelectedEvent(node.rawEvent);
                                        playSessionAudio(node.rawEvent);
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {scatterData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                            stroke="#fff"
                                            strokeWidth={selectedEvent?._id === entry.rawEvent._id ? 2 : 0}
                                            r={7}
                                        />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Event List Chronological Table */}
            <div className="table-container" style={{ margin: 0 }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'white' }}>
                        Registro Secuencial de Eventos ({filteredEvents.length} eventos)
                    </h3>
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Hora</th>
                            <th>Tipo de Evento</th>
                            <th>Intensidad</th>
                            <th>Duración</th>
                            <th>Detalle</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEvents.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                    No hay eventos para mostrar con el filtro actual
                                </td>
                            </tr>
                        ) : (
                            filteredEvents.map((event, idx) => {
                                const baseTimestamp = healthConnectSession?.startTime 
                                    ? new Date(healthConnectSession.startTime).getTime()
                                    : (nightData?.session?.startTime ? new Date(nightData.session.startTime).getTime() : 0);

                                const offsetMs = event.offsetMs !== undefined ? event.offsetMs : (event.offsetSeconds !== undefined ? event.offsetSeconds * 1000 : 0);
                                const timestamp = event.detectedAt || event.timestamp || event.createdAt;
                                let timeStr = event.timeLabel || '';

                                if (timestamp) {
                                    const d = new Date(timestamp);
                                    if (!isNaN(d.getTime())) {
                                        timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                                    }
                                } else if (baseTimestamp > 0 && offsetMs > 0) {
                                    const d = new Date(baseTimestamp + offsetMs);
                                    timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                                } else if (offsetMs > 0) {
                                    timeStr = `+${Math.floor(offsetMs / 60000)}m ${Math.floor((offsetMs % 60000) / 1000)}s`;
                                }
                                if (!timeStr) timeStr = '--:--:--';

                                const normalizedType = (event.eventType === 'speech') ? 'voice' : (event.eventType || event.type || 'unknown');
                                const meta = EVENT_LABELS[normalizedType] || EVENT_LABELS.unknown;
                                const eventId = event._id || `evt-${idx}`;
                                const eventNum = event.eventNumber || (idx + 1);

                                return (
                                    <tr
                                        key={eventId}
                                        onClick={() => setSelectedEvent({ ...event, eventNumber: eventNum, eventType: normalizedType, _id: eventId, timeLabel: timeStr })}
                                        style={{ cursor: 'pointer', background: selectedEvent?._id === eventId ? 'rgba(255,255,255,0.05)' : 'transparent' }}
                                    >
                                        <td style={{ fontWeight: '700', color: 'var(--accent-primary)', width: '50px' }}>#{eventNum}</td>
                                        <td style={{ fontWeight: '600', color: 'white' }}>{timeStr}</td>
                                        <td>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.35rem',
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '6px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                background: `${meta.color}20`,
                                                color: meta.color
                                            }}>
                                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: meta.color }} />
                                                {meta.es}
                                            </span>
                                        </td>
                                        <td style={{ color: '#F59E0B' }}>{event.peakDb ? `${event.peakDb} dB` : `${event.intensityDb || 55} dB`}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{event.duration || 5}s</td>
                                        <td>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedEvent({ ...event, eventNumber: eventNum, eventType: normalizedType, _id: eventId, timeLabel: timeStr });
                                                }}
                                                className="icon-btn"
                                                title="Ver detalle del evento"
                                                style={{ color: 'var(--accent-primary)' }}
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Event Detail Drawer */}
            {selectedEvent && (
                <EventDetailDrawer
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                    onPlay={() => playSessionAudio(selectedEvent)}
                />
            )}

            {/* Sticky Audio Player Bar */}
            {activePlayingSession && (
                <AudioPlayerBar
                    session={activePlayingSession}
                    audioSource={activeAudioSource}
                    onClose={() => {
                        setActivePlayingSession(null);
                        setActiveAudioSource(null);
                    }}
                />
            )}
        </div>
    );
}
