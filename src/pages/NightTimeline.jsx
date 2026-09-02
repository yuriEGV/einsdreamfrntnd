import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { Calendar, ChevronLeft, ChevronRight, Play, Clock, Filter, Loader2, Sparkles } from 'lucide-react';
import { API_URL, BASE_URL } from '../config';
import { EVENT_LABELS } from '../services/yamnetClassifier';
import EventDetailDrawer from '../components/EventDetailDrawer';
import AudioPlayerBar from '../components/AudioPlayerBar';

export default function NightTimeline() {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [nightData, setNightData] = useState(null);
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
            const res = await axios.get(`${API_URL}/sessions/night/${dateStr}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNightData(res.data);
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
                        Explora los eventos sonoros ocurridos durante toda la noche de un vistazo
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

            {/* Night Summary KPI Badges */}
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
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'white', marginBottom: '0.2rem' }}>
                            Dispersión Sonora del Día y la Noche
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Haz clic en cualquier punto para escuchar el audio con pre-roll y ver detalles
                        </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="badge info" style={{ fontSize: '0.75rem' }}>
                            {filterType === 'all' ? `Todos (${filteredEvents.length})` : `${EVENT_LABELS[filterType]?.es} (${filteredEvents.length})`}
                        </span>
                        {filterType !== 'all' && (
                            <button onClick={() => setFilterType('all')} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                                Limpiar filtro
                            </button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                        <Loader2 size={30} className="spinner" />
                    </div>
                ) : scatterData.length === 0 ? (
                    <div style={{ height: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                        <Clock size={36} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                        <div style={{ fontSize: '0.95rem', fontWeight: '600' }}>
                            No hay grabaciones registradas para el {selectedDate}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                            Inicia el monitoreo desde la app móvil para ver los puntos en este mapa sonoro
                        </div>
                    </div>
                ) : (
                    <div style={{ width: '100%', height: 260, minWidth: 0 }}>
                        <ResponsiveContainer width="100%" height={260} minWidth={0}>
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
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
                    <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>
                        Registro Secuencial de la Noche ({filteredEvents.length} eventos)
                    </h3>
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th>HORA</th>
                            <th>TIPO DE SONIDO</th>
                            <th>CONFIANZA IA</th>
                            <th>DURACIÓN</th>
                            <th>INTENSIDAD</th>
                            <th>ACCIÓN</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEvents.map((session) => {
                            const meta = EVENT_LABELS[session.eventType] || EVENT_LABELS.unknown;
                            const timeStr = new Date(session.detectedAt || session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                            const isCurrentPlaying = activePlayingSession?._id === session._id;

                            return (
                                <tr
                                    key={session._id}
                                    onClick={() => setSelectedEvent(session)}
                                    style={{
                                        cursor: 'pointer',
                                        background: isCurrentPlaying ? 'rgba(99, 102, 241, 0.12)' : (selectedEvent?._id === session._id ? 'rgba(99, 102, 241, 0.06)' : 'transparent')
                                    }}
                                >
                                    <td style={{ fontWeight: '600', color: 'white' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Clock size={15} color="var(--text-tertiary)" />
                                            <span>{timeStr}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{
                                            padding: '0.25rem 0.65rem',
                                            borderRadius: '1rem',
                                            background: meta.color + '22',
                                            color: meta.color,
                                            fontWeight: '600',
                                            fontSize: '0.8rem'
                                        }}>
                                            {meta.es}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ flex: 1, maxWidth: '60px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                                <div style={{ width: `${session.confidence || 80}%`, height: '100%', background: meta.color }} />
                                            </div>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                {session.confidence || 80}%
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)' }}>
                                        {session.duration || 15} s
                                    </td>
                                    <td>
                                        <span style={{ color: '#F59E0B', fontWeight: '500' }}>
                                            {session.intensityDb || 55} dB
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                playSessionAudio(session);
                                            }}
                                            className="btn btn-secondary"
                                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', gap: '0.35rem' }}
                                        >
                                            <Play size={14} />
                                            <span>{isCurrentPlaying ? 'Reproduciendo' : 'Escuchar'}</span>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Event Detail Inspector Drawer */}
            {selectedEvent && (
                <EventDetailDrawer
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                    onCommentAdded={(sessionId, newComments) => {
                        setNightData(prev => {
                            if (!prev) return prev;
                            return {
                                ...prev,
                                events: prev.events.map(ev => ev._id === sessionId ? { ...ev, comments: newComments } : ev)
                            };
                        });
                    }}
                />
            )}

            {/* Floating Rich Audio Player Bar */}
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
