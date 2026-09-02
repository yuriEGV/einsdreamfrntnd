import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, ChevronLeft, ChevronRight, Filter, Play, Volume2, Clock, AlertCircle, Loader2, Sparkles, Moon } from 'lucide-react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { API_URL } from '../config';
import { EVENT_LABELS } from '../services/yamnetClassifier';
import EventDetailDrawer from '../components/EventDetailDrawer';

export default function NightTimeline() {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [nightData, setNightData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [filterType, setFilterType] = useState('all');

    const fetchNightData = async (dateStr) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.get(`${API_URL}/sessions/night/${dateStr}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNightData(res.data);
        } catch (err) {
            console.error('Error fetching night session:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNightData(selectedDate);
    }, [selectedDate]);

    const changeDate = (days) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + days);
        setSelectedDate(d.toISOString().slice(0, 10));
    };

    const events = nightData?.events || [];
    const filteredEvents = filterType === 'all'
        ? events
        : events.filter(e => e.eventType === filterType);

    // Prepare Recharts Scatter plot points (Hour of night vs Intensity dB)
    const scatterData = filteredEvents.map((e, index) => {
        const d = new Date(e.detectedAt || e.createdAt);
        let hourFraction = d.getHours() + (d.getMinutes() / 60) + (d.getSeconds() / 3600);
        // Adjust for night wrap-around: 20:00 -> 20, 23:00 -> 23, 00:00 -> 24, 07:00 -> 31
        if (hourFraction < 12) hourFraction += 24;

        const meta = EVENT_LABELS[e.eventType] || EVENT_LABELS.unknown;

        return {
            id: e._id || index,
            rawEvent: e,
            x: hourFraction,
            y: e.intensityDb || 55,
            color: meta.color,
            name: meta.es,
            timeStr: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            confidence: e.confidence || 80
        };
    });

    const formatHourTick = (val) => {
        let hour = Math.floor(val) % 24;
        return `${hour.toString().padStart(2, '0')}:00`;
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Page Header & Date Navigation */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                        <Moon size={28} color="#818CF8" />
                        <h1 style={{ fontSize: '1.8rem', fontWeight: '700' }}>
                            Línea de Tiempo Nocturna
                        </h1>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                        Explora los eventos sonoros ocurridos durante toda la noche de un vistazo
                    </p>
                </div>

                {/* Date Picker Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.4rem 0.6rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                    <button onClick={() => changeDate(-1)} className="icon-btn" title="Noche anterior">
                        <ChevronLeft size={18} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 0.5rem' }}>
                        <Calendar size={16} color="#818CF8" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        />
                    </div>
                    <button onClick={() => changeDate(1)} className="icon-btn" title="Noche siguiente">
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* Night Summary Breakdown Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <div className="glass-card" style={{ padding: '1.25rem' }}>
                    <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '600' }}>
                        Total Eventos
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: 'white', marginTop: '0.25rem' }}>
                        {nightData?.totalEvents || 0}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {nightData?.totalDurationSeconds ? `${Math.round(nightData.totalDurationSeconds / 60)} min audio` : '0 min'}
                    </div>
                </div>

                {Object.entries(EVENT_LABELS).filter(([k]) => k !== 'unknown').map(([typeKey, meta]) => {
                    const count = nightData?.eventBreakdown?.[typeKey] || 0;
                    return (
                        <div
                            key={typeKey}
                            className="glass-card"
                            onClick={() => setFilterType(filterType === typeKey ? 'all' : typeKey)}
                            style={{
                                padding: '1.25rem',
                                cursor: 'pointer',
                                border: filterType === typeKey ? `2px solid ${meta.color}` : '1px solid var(--border-color)',
                                background: filterType === typeKey ? `${meta.color}15` : 'var(--bg-secondary)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '600' }}>
                                    {meta.es}
                                </span>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: meta.color }} />
                            </div>
                            <div style={{ fontSize: '1.8rem', fontWeight: '700', color: count > 0 ? meta.color : 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                                {count}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                {count === 1 ? '1 evento' : `${count} eventos`}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Interactive Timeline Visualizer Card */}
            <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'white' }}>
                            Dispersión Sonora de la Noche (21:00 → 09:00)
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            Haz clic en cualquier punto para escuchar el audio con pre-roll y ver detalles
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => setFilterType('all')}
                            className={`badge ${filterType === 'all' ? 'admin' : 'user'}`}
                            style={{ cursor: 'pointer', border: 'none', padding: '0.4rem 0.8rem' }}
                        >
                            Todos ({events.length})
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '240px', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                        <Loader2 className="spinner" size={24} />
                        <span>Cargando eventos de la noche...</span>
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-tertiary)' }}>
                        <Moon size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                        <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                            No hay grabaciones nocturnas registradas para el {selectedDate}
                        </div>
                        <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                            Inicia el monitoreo desde la app móvil o el modo nocturno web
                        </p>
                    </div>
                ) : (
                    <div style={{ width: '100%', height: '260px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                                <XAxis
                                    type="number"
                                    dataKey="x"
                                    domain={[21, 33]}
                                    tickFormatter={formatHourTick}
                                    stroke="var(--text-tertiary)"
                                    tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
                                    name="Hora"
                                />
                                <YAxis
                                    type="number"
                                    dataKey="y"
                                    domain={[35, 95]}
                                    stroke="var(--text-tertiary)"
                                    tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
                                    unit=" dB"
                                    name="Intensidad"
                                />
                                <Tooltip
                                    cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.2)' }}
                                    content={({ payload }) => {
                                        if (payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div style={{
                                                    background: 'rgba(22, 26, 35, 0.95)',
                                                    border: `1px solid ${data.color}`,
                                                    borderRadius: '0.5rem',
                                                    padding: '0.75rem',
                                                    boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                                                    fontSize: '0.85rem'
                                                }}>
                                                    <div style={{ fontWeight: '700', color: data.color }}>
                                                        {data.name} ({data.confidence}% confianza)
                                                    </div>
                                                    <div style={{ color: 'white', marginTop: '0.2rem' }}>
                                                        Hora: {data.timeStr}
                                                    </div>
                                                    <div style={{ color: '#F59E0B' }}>
                                                        Intensidad: {data.y} dB
                                                    </div>
                                                    <div style={{ color: '#818CF8', fontSize: '0.75rem', marginTop: '0.3rem' }}>
                                                        ▶ Clic para escuchar y comentar
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Scatter
                                    data={scatterData}
                                    onClick={(node) => setSelectedEvent(node.rawEvent)}
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

                            return (
                                <tr
                                    key={session._id}
                                    onClick={() => setSelectedEvent(session)}
                                    style={{
                                        cursor: 'pointer',
                                        background: selectedEvent?._id === session._id ? 'rgba(99, 102, 241, 0.1)' : 'transparent'
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
                                            onClick={(e) => { e.stopPropagation(); setSelectedEvent(session); }}
                                            className="btn btn-secondary"
                                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', gap: '0.35rem' }}
                                        >
                                            <Play size={14} />
                                            <span>Escuchar</span>
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
        </div>
    );
}
