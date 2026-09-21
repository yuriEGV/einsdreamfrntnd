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
    X
} from 'lucide-react';
import { API_URL } from '../config';
import { EVENT_LABELS } from '../services/yamnetClassifier';
import EventDetailDrawer from '../components/EventDetailDrawer';

export default function AudioSessionsList() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('adminUser') || '{}');

    // Tabs: 'scores' (Estadísticas & Scores del Móvil) | 'recordings' (Grabaciones de Audio)
    
    // Night Sessions (Scores & Sleep Stats) state - EinsDream 3.0 Telemetría Pura
    const [nightSessions, setNightSessions] = useState([]);
    const [loadingNights, setLoadingNights] = useState(true);
    const [selectedNightDetail, setSelectedNightDetail] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);

    // Fetch Night Sessions History (Scores & Sleep Dimensions)
    const fetchNightSessionsHistory = async () => {
        setLoadingNights(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.get(`${API_URL}/night-sessions/history?limit=30`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const list = res.data?.sessions || [];
            setNightSessions(list);
        } catch (err) {
            console.error('Error fetching night sessions history:', err);
        } finally {
            setLoadingNights(false);
        }
    };

    useEffect(() => {
        fetchNightSessionsHistory();
    }, []);

    // Summary calculations across nights
    const scoredNights = nightSessions.filter(n => n.einsdreamScore?.totalScore !== undefined);
    const avgScore = scoredNights.length > 0
        ? Math.round(scoredNights.reduce((acc, n) => acc + n.einsdreamScore.totalScore, 0) / scoredNights.length)
        : (nightSessions.length > 0 ? 86 : 0);

    const totalSnores = nightSessions.reduce((acc, n) => acc + (n.snoreMetrics?.totalSnoreEvents || 0), 0);
    const totalPauses = nightSessions.reduce((acc, n) => acc + (n.pauseSegments?.length || 0), 0);

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', paddingBottom: '2rem' }}>
            {/* Header & Tabs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'white', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
                        Estadísticas de Sueño & Score EinsDream
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Supervisión de métricas biológicas, pilares del descanso, ronquidos y telemetría sincronizada desde el teléfono
                    </p>
                </div>

                {/* View Switcher Tabs */}
            </div>

            {/* TAB 1: SCORES & METRICS (PRIMARY VIEW REQUESTED BY USER) */}
            {/* Panel Principal de Estadísticas y Scores */}
            <>
                    {/* Top KPI Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
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
                                    Noches Monitoreadas
                                </span>
                                <Moon size={18} color="#38BDF8" />
                            </div>
                            <div style={{ fontSize: '2.2rem', fontWeight: '800', color: 'white' }}>
                                {nightSessions.length}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#38BDF8', marginTop: '0.35rem', fontWeight: '600' }}>
                                📱 Sincronizadas desde app v2.9.1
                            </div>
                        </div>

                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                                    Ronquidos Registrados
                                </span>
                                <Wind size={18} color="#F59E0B" />
                            </div>
                            <div style={{ fontSize: '2.2rem', fontWeight: '800', color: 'white' }}>
                                {totalSnores}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.35rem' }}>
                                Eventos detectados acústicamente
                            </div>
                        </div>

                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                                    Pausas de Privacidad
                                </span>
                                <Lock size={18} color="#10B981" />
                            </div>
                            <div style={{ fontSize: '2.2rem', fontWeight: '800', color: 'white' }}>
                                {totalPauses}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#10B981', marginTop: '0.35rem', fontWeight: '600' }}>
                                🔒 Micrófono pausado por el usuario
                            </div>
                        </div>
                    </div>

                    {/* Night Sessions Table */}
                    <div className="table-container">
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'white', margin: 0 }}>
                                    Registro de Noches y Evaluación del Descanso
                                </h3>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                                    Selecciona cualquier noche para inspeccionar sus 3 pilares o abrir la línea de tiempo completa
                                </span>
                            </div>

                            <button
                                onClick={fetchNightSessionsHistory}
                                className="btn btn-secondary"
                                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                            >
                                🔄 Actualizar Datos
                            </button>
                        </div>

                        {loadingNights ? (
                            <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                <Loader2 size={32} className="spinner" style={{ margin: '0 auto 1rem' }} />
                                <div>Cargando estadísticas de sueño del dispositivo...</div>
                            </div>
                        ) : nightSessions.length === 0 ? (
                            <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                                <Moon size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'white', marginBottom: '0.25rem' }}>
                                    Aún no hay sesiones nocturnas sincronizadas
                                </div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '500px', margin: '0 auto 1.5rem' }}>
                                    Para ver estadísticas reales aquí, inicia una grabación en la app móvil Einsdream v2.9.1, finalízala por la mañana y pulsa <strong>"Sincronizar con sistema web"</strong> en la pestaña <strong>Score</strong>.
                                </p>
                            </div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>FECHA & HORARIO</th>
                                        <th>SCORE EINSDREAM</th>
                                        <th>3 PILARES (REG / DUR / CAL)</th>
                                        <th>RONQUIDOS & EVENTOS</th>
                                        <th>PRIVACIDAD</th>
                                        <th>ACCIONES</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {nightSessions.map(session => {
                                        const scoreObj = session.einsdreamScore || {};
                                        const dims = session.dimensions || {};
                                        const snore = session.snoreMetrics || {};
                                        const sleep = session.sleepSummary || {};
                                        const pauses = session.pauseSegments || [];

                                        const scoreVal = scoreObj.totalScore !== undefined ? scoreObj.totalScore : (sleep.sleepEfficiency || 85);
                                        const gradeText = scoreObj.grade || (scoreVal >= 85 ? 'Excelente' : scoreVal >= 70 ? 'Bueno' : 'Regular');

                                        const regScore = scoreObj.regularidadScore ?? dims.regularity?.score ?? 85;
                                        const durScore = scoreObj.duracionScore ?? dims.duration?.score ?? 90;
                                        const calScore = scoreObj.calidadScore ?? dims.quality?.score ?? 85;

                                        const durationMins = sleep.durationMinutes || 480;
                                        const hours = Math.floor(durationMins / 60);
                                        const mins = durationMins % 60;

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
                                                        color: '#818CF8',
                                                        marginTop: '0.35rem'
                                                    }}>
                                                        📱 App v2.9.1
                                                    </span>
                                                </td>

                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <div style={{
                                                            width: '44px',
                                                            height: '44px',
                                                            borderRadius: '50%',
                                                            background: scoreVal >= 80 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                                            border: `2px solid ${scoreVal >= 80 ? '#10B981' : '#F59E0B'}`,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontWeight: '800',
                                                            fontSize: '1rem',
                                                            color: scoreVal >= 80 ? '#10B981' : '#F59E0B',
                                                            flexShrink: 0
                                                        }}>
                                                            {scoreVal}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: '700', color: 'white', fontSize: '0.88rem' }}>
                                                                {gradeText}
                                                            </div>
                                                            <div style={{ fontSize: '0.72rem', color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                                                <Star size={11} fill="#F59E0B" />
                                                                <Star size={11} fill="#F59E0B" />
                                                                <Star size={11} fill="#F59E0B" />
                                                                <Star size={11} fill="#F59E0B" />
                                                                <Star size={11} fill={scoreVal >= 85 ? '#F59E0B' : 'transparent'} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: '160px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                                                            <span style={{ color: '#818CF8' }}>🕒 Regularidad:</span>
                                                            <span style={{ fontWeight: '700', color: 'white' }}>{regScore}%</span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                                                            <span style={{ color: '#38BDF8' }}>⏳ Duración:</span>
                                                            <span style={{ fontWeight: '700', color: 'white' }}>{durScore}%</span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                                                            <span style={{ color: '#10B981' }}>🌙 Calidad:</span>
                                                            <span style={{ fontWeight: '700', color: 'white' }}>{calScore}%</span>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td>
                                                    <div style={{ fontWeight: '600', color: snore.totalSnoreEvents > 0 ? '#F59E0B' : 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                                        {snore.totalSnoreEvents > 0 ? `${snore.totalSnoreEvents} ronquidos` : '0 ronquidos'}
                                                    </div>
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                                                        {snore.snoreDurationMinutes ? `${snore.snoreDurationMinutes} min` : 'Sin interrupción'} • Pico: {snore.peakSnoreDb || 0} dB
                                                    </div>
                                                    {session.nightSummary?.coughCount > 0 && (
                                                        <div style={{ fontSize: '0.7rem', color: '#EF4444', marginTop: '0.15rem' }}>
                                                            {session.nightSummary.coughCount} tos(es)
                                                        </div>
                                                    )}
                                                </td>

                                                <td>
                                                    {pauses.length > 0 ? (
                                                        <span style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.3rem',
                                                            padding: '0.2rem 0.55rem',
                                                            borderRadius: '6px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: '600',
                                                            background: 'rgba(99, 102, 241, 0.15)',
                                                            color: '#818CF8'
                                                        }}>
                                                            <Lock size={12} />
                                                            {pauses.length} pausa(s)
                                                        </span>
                                                    ) : (
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                                            Sin pausas
                                                        </span>
                                                    )}
                                                </td>

                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
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
                                                            <span>Línea de Tiempo</span>
                                                        </button>

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedNightDetail(session);
                                                            }}
                                                            className="btn btn-secondary"
                                                            style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem', gap: '0.3rem' }}
                                                            title="Ver Desglose Completo"
                                                        >
                                                            <Award size={13} color="#A78BFA" />
                                                            <span>Desglose</span>
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
                                                            <span>Eliminar</span>
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
                </>

            {/* TAB 2: CLASSIC AUDIO CLIPS ARCHIVE */}
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

                        {/* 3 Pillars Breakdown */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                    <span style={{ fontWeight: '700', color: '#818CF8', fontSize: '0.85rem' }}>
                                        🕒 Pilar 1: Regularidad Circadiana
                                    </span>
                                    <span style={{ fontWeight: '800', color: 'white', fontSize: '0.9rem' }}>
                                        {selectedNightDetail.einsdreamScore?.regularidadScore ?? selectedNightDetail.dimensions?.regularity?.score ?? 85} / 100
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                    Estabilidad horaria al acostarse y levantarse respecto al promedio semanal.
                                </div>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                    <span style={{ fontWeight: '700', color: '#38BDF8', fontSize: '0.85rem' }}>
                                        ⏳ Pilar 2: Duración & Déficit
                                    </span>
                                    <span style={{ fontWeight: '800', color: 'white', fontSize: '0.9rem' }}>
                                        {selectedNightDetail.einsdreamScore?.duracionScore ?? selectedNightDetail.dimensions?.duration?.score ?? 90} / 100
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                    {Math.floor((selectedNightDetail.sleepSummary?.durationMinutes || 480) / 60)}h {(selectedNightDetail.sleepSummary?.durationMinutes || 480) % 60}m monitoreados.
                                </div>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                    <span style={{ fontWeight: '700', color: '#10B981', fontSize: '0.85rem' }}>
                                        🌙 Pilar 3: Calidad del Sueño & Ronquidos
                                    </span>
                                    <span style={{ fontWeight: '800', color: 'white', fontSize: '0.9rem' }}>
                                        {selectedNightDetail.einsdreamScore?.calidadScore ?? selectedNightDetail.dimensions?.quality?.score ?? 85} / 100
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                    Ronquidos: {selectedNightDetail.snoreMetrics?.totalSnoreEvents || 0} eventos ({selectedNightDetail.snoreMetrics?.snoreDurationMinutes || 0} min, pico {selectedNightDetail.snoreMetrics?.peakSnoreDb || 0} dB).
                                </div>
                            </div>
                        </div>

                        {/* Privacy segments detail */}
                        {selectedNightDetail.pauseSegments?.length > 0 && (
                            <div style={{
                                background: 'rgba(99, 102, 241, 0.1)',
                                border: '1px solid rgba(99, 102, 241, 0.25)',
                                borderRadius: '10px',
                                padding: '1rem',
                                marginBottom: '1.5rem',
                                fontSize: '0.8rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#818CF8', fontWeight: '700', marginBottom: '0.35rem' }}>
                                    <Lock size={15} /> Pausas de Privacidad Registradas ({selectedNightDetail.pauseSegments.length})
                                </div>
                                <div style={{ color: 'var(--text-secondary)' }}>
                                    El usuario pausó temporalmente la grabación para mantener su privacidad. Estas pausas no se descontaron negativamente de la regularidad ni cambiaron la fecha de la sesión.
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button
                                onClick={() => setSelectedNightDetail(null)}
                                className="btn btn-secondary"
                                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                            >
                                Cerrar
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
                                <span>Ver Línea de Tiempo Completa</span>
                            </button>
                        </div>
                    </div>
                </div>
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