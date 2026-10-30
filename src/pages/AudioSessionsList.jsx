import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Award,
    Star,
    Calendar,
    Moon,
    Clock,
    Wind,
    Activity,
    Heart,
    ShieldCheck,
    Lock,
    Play,
    Pause,
    Trash2,
    Headphones,
    Filter,
    Loader2,
    Sparkles,
    ChevronRight,
    BarChart3,
    Volume2,
    CheckCircle2,
    X,
    FileText,
    AlertCircle,
    RefreshCw
} from 'lucide-react';
import { API_URL } from '../config';
import { EVENT_LABELS } from '../services/yamnetClassifier';
import EventDetailDrawer from '../components/EventDetailDrawer';
import SdrReportModal from '../components/SdrReportModal';

const PATTERN_TAGS = {
    P1: { label: 'P1 · Baja Actividad', bg: 'rgba(16, 185, 129, 0.15)', text: '#34D399', border: 'rgba(16, 185, 129, 0.35)' },
    P2: { label: 'P2 · Actividad Dispersa', bg: 'rgba(56, 189, 248, 0.15)', text: '#38BDF8', border: 'rgba(56, 189, 248, 0.35)' },
    P3: { label: 'P3 · Agrupaciones (Clusters)', bg: 'rgba(245, 158, 11, 0.15)', text: '#FBBF24', border: 'rgba(245, 158, 11, 0.35)' },
    P4: { label: 'P4 · Actividad Frecuente', bg: 'rgba(239, 68, 68, 0.15)', text: '#F87171', border: 'rgba(239, 68, 68, 0.35)' },
    P5: { label: 'P5 · Cobertura Baja/Técnica', bg: 'rgba(148, 163, 184, 0.15)', text: '#94A3B8', border: 'rgba(148, 163, 184, 0.35)' },
    PENDING_REFERENCE: { label: 'En Espera de Historial', bg: 'rgba(129, 140, 248, 0.15)', text: '#A5B4FC', border: 'rgba(129, 140, 248, 0.35)' }
};

export default function AudioSessionsList() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('adminUser') || '{}');

    // Night Sessions (Scores & Sleep Stats) state - EinsDream 3.0 Telemetría Pura
    const [nightSessions, setNightSessions] = useState([]);
    const [loadingNights, setLoadingNights] = useState(true);
    const [selectedNightDetail, setSelectedNightDetail] = useState(null);
    const [selectedSdrReportSession, setSelectedSdrReportSession] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [seedingNormative, setSeedingNormative] = useState(false);
    const [authError, setAuthError] = useState(null);

    // Fetch Night Sessions History (Scores & Sleep Dimensions)
    const fetchNightSessionsHistory = async () => {
        setLoadingNights(true);
        setAuthError(null);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.get(`${API_URL}/night-sessions/history?limit=30`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const list = res.data?.sessions || [];
            setNightSessions(list);
        } catch (err) {
            console.error('Error fetching night sessions history:', err);
            if (err.response?.status === 401) {
                setAuthError('Tu sesión ha expirado o no estás autenticado con credenciales válidas.');
            } else {
                setAuthError(`No se pudo conectar con el servidor: ${err.message || 'Error de red'}`);
            }
        } finally {
            setLoadingNights(false);
        }
    };

    useEffect(() => {
        fetchNightSessionsHistory();
    }, []);

    // Cargar noches de prueba conformes al manual normativo MN-SDR-001
    const handleSeedNormative = async () => {
        setSeedingNormative(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.post(`${API_URL}/night-sessions/seed-normative`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(`✅ ${res.data?.message || 'Noches normativas de prueba cargadas correctamente.'}`);
            await fetchNightSessionsHistory();
        } catch (err) {
            alert(`Error al cargar noches normativas: ${err.response?.data?.message || err.message}`);
        } finally {
            setSeedingNormative(false);
        }
    };

    // Summary calculations across nights
    const scoredNights = nightSessions.filter(n => n.einsdreamScore?.totalScore !== undefined);
    const avgScore = scoredNights.length > 0
        ? Math.round(scoredNights.reduce((acc, n) => acc + n.einsdreamScore.totalScore, 0) / scoredNights.length)
        : (nightSessions.length > 0 ? 86 : 0);

    const totalSnores = nightSessions.reduce((acc, n) => acc + (n.snoreMetrics?.totalSnoreEvents ?? n.snoreMetrics?.snoreEventsCount ?? (n.soundEvents || []).filter(e => e.type === "snore" || e.eventType === "snore").length ?? 0), 0);
    const totalPauses = nightSessions.reduce((acc, n) => acc + (n.pauseSegments?.length || n.pauseIntervals?.length || 0), 0);

    const avgCoverage = nightSessions.length > 0
        ? Math.round(nightSessions.reduce((acc, n) => acc + (n.sdrSnapshot?.coverage_pct || (n.totalDurationMs ? Math.min(100, Math.round(100 - ((n.pauseIntervals || []).reduce((pAcc, p) => pAcc + (p.durationMs || 0), 0) / n.totalDurationMs) * 100)) : 95)), 0) / nightSessions.length)
        : 0;

    return (
        <div style={{ padding: '2rem', maxWidth: '1240px', margin: '0 auto', paddingBottom: '3rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'white', letterSpacing: '-0.02em', margin: 0 }}>
                            Estadísticas de Sueño & Reportes Normativos
                        </h1>
                        <span style={{
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '4px',
                            background: 'rgba(99, 102, 241, 0.2)',
                            color: '#A5B4FC',
                            border: '1px solid rgba(99, 102, 241, 0.4)'
                        }}>
                            MN-SDR-001
                        </span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                        Supervisión de métricas biológicas, clasificación acústica, patrones descriptivos P1-P5 y telemetría móvil sincronizada
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                        onClick={handleSeedNormative}
                        disabled={seedingNormative}
                        className="btn btn-secondary"
                        style={{ padding: '0.55rem 1rem', fontSize: '0.82rem', gap: '0.4rem', color: '#A5B4FC', borderColor: 'rgba(99, 102, 241, 0.4)' }}
                        title="Cargar noches normativas de prueba (§13 del estándar MN-SDR-001)"
                    >
                        {seedingNormative ? <Loader2 size={15} className="spinner" /> : <Sparkles size={15} color="#818CF8" />}
                        <span>Cargar Noches MN-SDR-001</span>
                    </button>

                    <button
                        onClick={fetchNightSessionsHistory}
                        disabled={loadingNights}
                        className="btn btn-primary"
                        style={{ padding: '0.55rem 1rem', fontSize: '0.82rem', gap: '0.4rem' }}
                    >
                        {loadingNights ? <Loader2 size={15} className="spinner" /> : <RefreshCw size={15} />}
                        <span>Actualizar Datos</span>
                    </button>
                </div>
            </div>

            {/* Auth Error Banner if present */}
            {authError && (
                <div style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    borderRadius: '12px',
                    padding: '1rem 1.25rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <AlertCircle size={20} color="#EF4444" />
                        <div>
                            <strong style={{ color: '#F87171', fontSize: '0.9rem' }}>Atención con la conexión:</strong>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{authError}</div>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/login')}
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', color: '#F87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                    >
                        Iniciar Sesión
                    </button>
                </div>
            )}

            {/* Top KPI Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '1.25rem',
                marginBottom: '2rem'
            }}>
                <div className="glass-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                            Score Promedio
                        </span>
                        <Award size={18} color="#818CF8" />
                    </div>
                    <div style={{ fontSize: '2.2rem', fontWeight: '800', color: 'white' }}>
                        {avgScore > 0 ? avgScore : '--'} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>/ 100</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.35rem', color: '#F59E0B', fontSize: '0.8rem', fontWeight: '600' }}>
                        <Star size={14} fill="#F59E0B" />
                        <Star size={14} fill="#F59E0B" />
                        <Star size={14} fill="#F59E0B" />
                        <Star size={14} fill="#F59E0B" />
                        <Star size={14} fill={avgScore >= 85 ? '#F59E0B' : 'transparent'} />
                        <span style={{ color: 'var(--text-tertiary)', marginLeft: '0.25rem', fontSize: '0.75rem' }}>
                            {avgScore >= 80 ? 'Nivel Óptimo' : 'Regular'}
                        </span>
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                            Noches Registradas
                        </span>
                        <Moon size={18} color="#38BDF8" />
                    </div>
                    <div style={{ fontSize: '2.2rem', fontWeight: '800', color: 'white' }}>
                        {nightSessions.length}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#38BDF8', marginTop: '0.35rem', fontWeight: '600' }}>
                        📱 Sincronizadas y Normativas
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                            Cobertura Media (SDR_COV)
                        </span>
                        <ShieldCheck size={18} color="#10B981" />
                    </div>
                    <div style={{ fontSize: '2.2rem', fontWeight: '800', color: 'white' }}>
                        {avgCoverage > 0 ? `${avgCoverage}%` : '--'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: avgCoverage >= 85 ? '#10B981' : '#F59E0B', marginTop: '0.35rem', fontWeight: '600' }}>
                        {avgCoverage >= 85 ? '✅ Monitorización óptima' : 'Validez adecuada'}
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                            Ronquidos Totales
                        </span>
                        <Wind size={18} color="#F59E0B" />
                    </div>
                    <div style={{ fontSize: '2.2rem', fontWeight: '800', color: 'white' }}>
                        {totalSnores}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.35rem' }}>
                        Eventos acústicos detectados
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                            Pausas de Privacidad
                        </span>
                        <Lock size={18} color="#818CF8" />
                    </div>
                    <div style={{ fontSize: '2.2rem', fontWeight: '800', color: 'white' }}>
                        {totalPauses}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#818CF8', marginTop: '0.35rem', fontWeight: '600' }}>
                        🔒 Excluidas de la duración válida
                    </div>
                </div>
            </div>

            {/* Night Sessions Table */}
            <div className="table-container">
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'white', margin: 0 }}>
                            Registro de Noches y Diagnóstico Normativo (MN-SDR-001)
                        </h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                            Inspecciona cualquier noche para ver el informe técnico oficial, agrupaciones acústicas (clusters) y evaluación matutina
                        </span>
                    </div>

                    <button
                        onClick={fetchNightSessionsHistory}
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                    >
                        🔄 Refrescar
                    </button>
                </div>

                {loadingNights ? (
                    <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <Loader2 size={32} className="spinner" style={{ margin: '0 auto 1rem', color: '#818CF8' }} />
                        <div>Cargando estadísticas de sueño y reportes normativos...</div>
                    </div>
                ) : nightSessions.length === 0 ? (
                    <div style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '16px',
                            background: 'rgba(99, 102, 241, 0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.25rem',
                            border: '1px solid rgba(99, 102, 241, 0.25)'
                        }}>
                            <Moon size={32} color="#818CF8" />
                        </div>
                        <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'white', marginBottom: '0.4rem' }}>
                            Aún no hay sesiones nocturnas sincronizadas
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '540px', margin: '0 auto 1.75rem', lineHeight: '1.5' }}>
                            Para ver sesiones reales aquí, graba tu noche en la app móvil EinsDream v2.9.12 y pulsa <strong>"Sincronizar con sistema web"</strong> en la pestaña <strong>Score</strong>.<br />
                            O también puedes cargar de inmediato las noches de prueba estándar para verificar los gráficos e informes.
                        </p>

                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                                onClick={handleSeedNormative}
                                disabled={seedingNormative}
                                className="btn btn-primary"
                                style={{ padding: '0.65rem 1.3rem', fontSize: '0.88rem', gap: '0.45rem' }}
                            >
                                {seedingNormative ? <Loader2 size={16} className="spinner" /> : <Sparkles size={16} />}
                                <span>Cargar Noches de Prueba (MN-SDR-001)</span>
                            </button>

                            <button
                                onClick={fetchNightSessionsHistory}
                                className="btn btn-secondary"
                                style={{ padding: '0.65rem 1.3rem', fontSize: '0.88rem' }}
                            >
                                🔄 Reintentar Conexión
                            </button>
                        </div>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>FECHA & HORARIO</th>
                                <th>SCORE EINSDREAM</th>
                                <th>PATRÓN MN-SDR-001</th>
                                <th>COBERTURA & TASA</th>
                                <th>RONQUIDOS & EVENTOS</th>
                                <th>ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {nightSessions.map(session => {
                                const scoreObj = session.einsdreamScore || {};
                                const dims = session.dimensions || {};
                                const snore = session.snoreMetrics || {};
                                const sleep = session.sleepSummary || {};
                                const pauses = session.pauseSegments || session.pauseIntervals || [];
                                const sdr = session.sdrSnapshot || {};

                                const scoreVal = scoreObj.totalScore !== undefined ? scoreObj.totalScore : (sleep.sleepEfficiency || 85);
                                const gradeText = scoreObj.grade || session.quality || (scoreVal >= 85 ? 'Excelente' : scoreVal >= 70 ? 'Bueno' : (scoreVal >= 55 ? 'Insuficiente' : 'Deficiente'));

                                const durationMins = sleep.durationMinutes || (session.totalDurationMs ? Math.round(session.totalDurationMs / 60000) : 420);
                                const hours = Math.floor(durationMins / 60);
                                const mins = durationMins % 60;

                                const snoreCount = snore.totalSnoreEvents ?? snore.snoreEventsCount ?? session.summary?.snoreCount ?? (session.soundEvents || []).filter(e => e.type === 'snore' || e.eventType === 'snore').length ?? 0;
                                const snoreMins = snore.snoreDurationMinutes ?? snore.totalSnoreMinutes ?? Math.round(snoreCount * 2.5);
                                const maxDb = snore.peakSnoreDb ?? snore.maxDb ?? Math.max(0, ...(session.soundEvents || []).map(e => e.intensityDb || Math.abs(e.peakDb || 0)));

                                const patternCode = sdr.pattern || 'P5';
                                const patternInfo = PATTERN_TAGS[patternCode] || PATTERN_TAGS.P5;
                                const coveragePct = sdr.coverage_pct ?? (session.totalDurationMs ? Math.min(100, Math.round(100 - (pauses.reduce((acc, p) => acc + (p.durationMs || 0), 0) / session.totalDurationMs) * 100)) : 95);
                                const evtRate = sdr.events_per_hour ?? (durationMins > 0 ? (snoreCount / (durationMins / 60)).toFixed(1) : 0);

                                return (
                                    <tr
                                        key={session._id}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => setSelectedNightDetail(session)}
                                    >
                                        <td>
                                            <div style={{ fontWeight: '700', color: 'white', fontSize: '0.95rem' }}>
                                                {session.sessionDate}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.15rem' }}>
                                                ⏱️ {hours}h {mins}m monitoreados
                                            </div>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.3rem',
                                                padding: '0.15rem 0.5rem',
                                                borderRadius: '12px',
                                                fontSize: '0.68rem',
                                                fontWeight: '600',
                                                background: 'rgba(99, 102, 241, 0.15)',
                                                color: '#A5B4FC',
                                                marginTop: '0.35rem'
                                            }}>
                                                📱 EinsDream 3.0
                                            </span>
                                        </td>

                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                {(() => {
                                                    const badgeColor = scoreVal >= 85 ? '#10B981' : (scoreVal >= 70 ? '#34D399' : (scoreVal >= 55 ? '#F59E0B' : '#EF4444'));
                                                    const badgeBg = scoreVal >= 85 ? 'rgba(16, 185, 129, 0.15)' : (scoreVal >= 70 ? 'rgba(52, 211, 153, 0.15)' : (scoreVal >= 55 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)'));
                                                    const starCount = scoreObj.ratingStars || (scoreVal >= 85 ? 5 : (scoreVal >= 70 ? 4 : (scoreVal >= 55 ? 3 : 2)));
                                                    return (
                                                        <>
                                                            <div style={{
                                                                width: '44px',
                                                                height: '44px',
                                                                borderRadius: '50%',
                                                                background: badgeBg,
                                                                border: `2px solid ${badgeColor}`,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontWeight: '800',
                                                                fontSize: '1rem',
                                                                color: badgeColor,
                                                                flexShrink: 0
                                                            }}>
                                                                {scoreVal}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: '700', color: 'white', fontSize: '0.88rem' }}>
                                                                    {gradeText}
                                                                </div>
                                                                <div style={{ fontSize: '0.72rem', color: badgeColor, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                                                    {[1, 2, 3, 4, 5].map(st => (
                                                                        <Star key={st} size={11} fill={st <= starCount ? badgeColor : 'transparent'} stroke={badgeColor} />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </td>

                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    width: 'fit-content',
                                                    padding: '0.25rem 0.6rem',
                                                    borderRadius: '6px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '700',
                                                    background: patternInfo.bg,
                                                    color: patternInfo.text,
                                                    border: `1px solid ${patternInfo.border}`
                                                }}>
                                                    {patternInfo.label}
                                                </span>
                                                <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                                                    Ref: {typeof sdr.reference === 'object' && sdr.reference ? (sdr.reference.type || 'REF-USER') : (sdr.reference || 'REF-USER')}
                                                </span>
                                            </div>
                                        </td>

                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: '700', color: coveragePct >= 85 ? '#10B981' : '#F59E0B' }}>
                                                    <ShieldCheck size={14} />
                                                    <span>{coveragePct}% cobertura</span>
                                                </div>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                                    Tasa: <strong>{evtRate}</strong> evts/h
                                                </div>
                                                {pauses.length > 0 && (
                                                    <div style={{ fontSize: '0.68rem', color: '#818CF8' }}>
                                                        {pauses.length} pausa(s) de privacidad
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        <td>
                                            <div style={{ fontWeight: '600', color: snoreCount > 0 ? '#F59E0B' : 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                                {snoreCount > 0 ? `${snoreCount} ronquidos` : '0 ronquidos'}
                                            </div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                                                {snoreMins > 0 ? `${snoreMins} min` : 'Silencioso'} • Máx: {maxDb} dB
                                            </div>
                                        </td>

                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedSdrReportSession(session);
                                                    }}
                                                    className="btn btn-secondary"
                                                    style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem', gap: '0.3rem', color: '#A5B4FC', borderColor: 'rgba(99, 102, 241, 0.4)' }}
                                                    title="Ver Informe Técnico MN-SDR-001"
                                                >
                                                    <FileText size={13} color="#818CF8" />
                                                    <span>Informe SDR</span>
                                                </button>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/timeline?date=${session.sessionDate}`);
                                                    }}
                                                    className="btn btn-secondary"
                                                    style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem', gap: '0.3rem' }}
                                                    title="Ver Línea de Tiempo"
                                                >
                                                    <Clock size={13} color="var(--accent-primary)" />
                                                    <span>Timeline</span>
                                                </button>

                                                <button
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        if (window.confirm(`¿Eliminar la sesión nocturna del ${session.sessionDate}?`)) {
                                                            try {
                                                                const token = localStorage.getItem('adminToken');
                                                                await axios.delete(`${API_URL}/night-sessions/${session._id}`, {
                                                                    headers: { Authorization: `Bearer ${token}` }
                                                                });
                                                                setNightSessions(prev => prev.filter(s => s._id !== session._id));
                                                            } catch (err) {
                                                                alert('Error al eliminar la sesión nocturna');
                                                            }
                                                        }
                                                    }}
                                                    className="btn btn-secondary"
                                                    style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem', gap: '0.3rem', color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                                                    title="Eliminar Sesión"
                                                >
                                                    <Trash2 size={13} color="#EF4444" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal de Desglose de Score EinsDream Tradicional */}
            {selectedNightDetail && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(5px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '1.5rem'
                }}>
                    <div style={{
                        background: '#161A23',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                        maxWidth: '650px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        padding: '1.75rem',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Award size={20} color="white" />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'white', margin: 0 }}>
                                        Desglose de Score — {selectedNightDetail.sessionDate}
                                    </h3>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                        Evaluación calculada con el algoritmo de 3 pilares Einsdream
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedNightDetail(null)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '0.25rem' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Overall Score Badge */}
                        <div style={{
                            background: 'radial-gradient(circle at center, rgba(99, 102, 241, 0.2), rgba(22, 26, 35, 0.9))',
                            borderRadius: '12px',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            padding: '1.5rem',
                            textAlign: 'center',
                            marginBottom: '1.5rem'
                        }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#818CF8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                EINSDREAM SLEEP SCORE
                            </div>
                            <div style={{ fontSize: '3rem', fontWeight: '900', color: 'white', margin: '0.2rem 0' }}>
                                {selectedNightDetail.einsdreamScore?.totalScore ?? selectedNightDetail.sleepSummary?.sleepEfficiency ?? 88}
                                <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', fontWeight: '500' }}> / 100</span>
                            </div>
                            <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#10B981' }}>
                                {selectedNightDetail.einsdreamScore?.grade || 'Óptimo'} — {selectedNightDetail.einsdreamScore?.description || 'Noche de descanso profundo'}
                            </div>
                        </div>

                        {/* Three Pillars Summary */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '1rem', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>REGULARIDAD</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#818CF8' }}>
                                    {selectedNightDetail.einsdreamScore?.regularidadScore ?? 85}%
                                </div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '1rem', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>DURACIÓN</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#38BDF8' }}>
                                    {selectedNightDetail.einsdreamScore?.duracionScore ?? 90}%
                                </div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '1rem', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>CALIDAD ACÚSTICA</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#10B981' }}>
                                    {selectedNightDetail.einsdreamScore?.calidadScore ?? 85}%
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button
                                onClick={() => {
                                    const s = selectedNightDetail;
                                    setSelectedNightDetail(null);
                                    setSelectedSdrReportSession(s);
                                }}
                                className="btn btn-secondary"
                                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', color: '#A5B4FC', gap: '0.4rem' }}
                            >
                                <FileText size={15} color="#818CF8" />
                                <span>Ver Informe Técnico MN-SDR-001</span>
                            </button>
                            <button
                                onClick={() => {
                                    const date = selectedNightDetail.sessionDate;
                                    setSelectedNightDetail(null);
                                    navigate(`/timeline?date=${date}`);
                                }}
                                className="btn btn-primary"
                                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', gap: '0.4rem' }}
                            >
                                <Clock size={15} />
                                <span>Ver Línea de Tiempo</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SDR Report Modal (MN-SDR-001) */}
            {selectedSdrReportSession && (
                <SdrReportModal
                    sessionIdOrDate={selectedSdrReportSession.sessionId || selectedSdrReportSession.sessionDate}
                    initialReport={selectedSdrReportSession.sdrReport}
                    onClose={() => setSelectedSdrReportSession(null)}
                    onSaved={() => fetchNightSessionsHistory()}
                />
            )}

            {/* Event Detail Inspector Drawer */}
            {selectedEvent && (
                <EventDetailDrawer
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                />
            )}
        </div>
    );
}
