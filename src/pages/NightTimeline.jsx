import React, { useState, useEffect } from 'react';
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
    ShieldCheck
} from 'lucide-react';
import { API_URL, BASE_URL } from '../config';
import { EVENT_LABELS } from '../services/yamnetClassifier';
import EventDetailDrawer from '../components/EventDetailDrawer';
import AudioPlayerBar from '../components/AudioPlayerBar';

export default function NightTimeline() {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [nightData, setNightData] = useState(null);
    const [healthConnectSession, setHealthConnectSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('all');
    const [selectedEvent, setSelectedEvent] = useState(null);

    // Audio playback state
    const [activePlayingSession, setActivePlayingSession] = useState(null);
    const [activeAudioSource, setActiveAudioSource] = useState(null);

    const fetchNightData = async (dateStr) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');

            // 1. Fetch legacy / acoustic night data
            const res = await axios.get(`${API_URL}/sessions/night/${dateStr}`, {
                headers: { Authorization: `Bearer ${token}` }
            }).catch(() => ({ data: null }));
            setNightData(res.data);

            // 2. Fetch Google Health Connect correlated session
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
        setSelectedDate(d.toISOString().slice(0, 10));
    };

    const events = nightData?.events || [];
    const filteredEvents = events.filter(e => filterType === 'all' || e.eventType === filterType);

    // Convert events into scatter plot format (x = minutes from 00:00 to 24:00 or relative time, y = dB intensity)
    const scatterData = filteredEvents.map(e => {
        const d = new Date(e.detectedAt || e.createdAt);
        const hours = d.getHours();
        const mins = d.getMinutes();
        const timeInHours = hours + (mins / 60);

        const meta = EVENT_LABELS[e.eventType] || EVENT_LABELS.unknown;

        return {
            x: Number(timeInHours.toFixed(2)),
            y: e.intensityDb || 55,
            confidence: e.confidence || 80,
            duration: e.duration || 15,
            type: e.eventType,
            typeName: meta.es,
            color: meta.color,
            timeStr: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            rawEvent: e
        };
    });

    // Format Health Connect time series for combined Recharts chart
    const healthChartData = (healthConnectSession?.heartRateSeries || []).map(h => {
        const d = new Date(h.timestamp);
        const timeLabel = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Match respiratory rate at approximate same time
        const respMatch = (healthConnectSession?.respiratoryRateSeries || []).find(r => {
            return Math.abs(new Date(r.timestamp) - d) < 10 * 60 * 1000;
        });

        // Match SpO2
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
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.get(`${API_URL}/sessions/${session._id}/audio`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            let url = res.data.audioUrl;
            if (!url && res.data.audioBase64) {
                let b64 = res.data.audioBase64;
                if (!b64.startsWith('data:')) b64 = `data:audio/m4a;base64,${b64}`;
                url = b64;
            } else if (!url && res.data.streamUrl) {
                url = `${BASE_URL}${res.data.streamUrl}`;
            }

            setActivePlayingSession(session);
            setActiveAudioSource(url || null);
        } catch {
            setActivePlayingSession(session);
            setActiveAudioSource(null);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', paddingBottom: activePlayingSession ? '100px' : '2rem' }}>
            {/* Header & Date Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'white', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
                        Línea de Tiempo Nocturna
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Correlación de eventos acústicos y biométricos de Google Health Connect
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
                            onChange={(e) => setSelectedDate(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: '600', fontSize: '0.9rem', outline: 'none', cursor: 'pointer' }}
                        />
                    </div>

                    <button onClick={() => changeDate(1)} className="icon-btn" title="Día siguiente">
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* GOOGLE HEALTH CONNECT MULTI-METRIC SUMMARY CARDS */}
            {healthConnectSession && (
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

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                        gap: '1rem'
                    }}>
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
                                <Activity size={14} /> Saturación SpO₂
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
                                <ResponsiveContainer width="100%" height="100%">
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
                                                            <div style={{ color: '#ef4444', fontSize: '0.85rem' }}>❤️ Pulso: {payload[0]?.value} bpm</div>
                                                            {payload[1] && <div style={{ color: '#10b981', fontSize: '0.85rem' }}>🫁 Respiración: {payload[1]?.value} rpm</div>}
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
                        {nightData?.totalEvents || 0}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {Math.round((nightData?.totalDurationSeconds || 0) / 60)} min
                    </div>
                </div>

                {Object.entries(EVENT_LABELS).filter(([k]) => k !== 'unknown').map(([typeKey, meta]) => {
                    const count = nightData?.eventBreakdown?.[typeKey] || 0;
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
                            Cada punto representa una grabación de audio activada por ruido nocturno
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
                            Todos
                        </button>
                        {Object.entries(EVENT_LABELS).filter(([k]) => k !== 'unknown').map(([k, meta]) => (
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
                                {meta.es}
                            </button>
                        ))}
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
                        <ResponsiveContainer width="100%" height="100%">
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
                                                        ▶ Clic para reproducir audio
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
                            <th>Hora</th>
                            <th>Tipo de Evento</th>
                            <th>Intensidad</th>
                            <th>Duración</th>
                            <th>Acción</th>
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
                            filteredEvents.map(event => {
                                const d = new Date(event.detectedAt || event.createdAt);
                                const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                                const meta = EVENT_LABELS[event.eventType] || EVENT_LABELS.unknown;

                                return (
                                    <tr
                                        key={event._id}
                                        onClick={() => setSelectedEvent(event)}
                                        style={{ cursor: 'pointer', background: selectedEvent?._id === event._id ? 'rgba(255,255,255,0.05)' : 'transparent' }}
                                    >
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
                                        <td style={{ color: '#F59E0B' }}>{event.intensityDb || 55} dB</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{event.duration || 15}s</td>
                                        <td>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    playSessionAudio(event);
                                                }}
                                                className="icon-btn"
                                                title="Reproducir audio"
                                                style={{ color: 'var(--accent-primary)' }}
                                            >
                                                <Play size={16} />
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
