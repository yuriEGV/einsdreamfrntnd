import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Play, Pause, Loader2, Music, Clock, Smartphone, Calendar, Headphones, Filter, Volume2, Search, Trash2 } from 'lucide-react';
import { API_URL, BASE_URL } from '../config';
import { EVENT_LABELS } from '../services/yamnetClassifier';
import EventDetailDrawer from '../components/EventDetailDrawer';

export default function AudioSessionsList() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('all');
    const [searchDate, setSearchDate] = useState('');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [playingId, setPlayingId] = useState(null);
    const [audioMap, setAudioMap] = useState({}); // { id: audioUrl }
    const [loadingAudioId, setLoadingAudioId] = useState(null);

    const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
    const isAdmin = user.role === 'admin';

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const endpoint = isAdmin ? `${API_URL}/admin/sessions` : `${API_URL}/sessions/me`;
            const response = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // If response is { sessions: [...] } or array
            const list = Array.isArray(response.data) ? response.data : (response.data.sessions || []);
            setSessions(list);
        } catch (error) {
            console.error('Error fetching sessions', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const playAudio = async (e, session) => {
        e.stopPropagation();

        if (playingId === session._id) {
            setPlayingId(null);
            return;
        }

        if (audioMap[session._id]) {
            setPlayingId(session._id);
            return;
        }

        setLoadingAudioId(session._id);
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

            if (url) {
                setAudioMap(prev => ({ ...prev, [session._id]: url }));
                setPlayingId(session._id);
            }
        } catch (err) {
            console.error('Error fetching audio:', err);
        } finally {
            setLoadingAudioId(null);
        }
    };

    const handleDelete = async (e, sessionId) => {
        e.stopPropagation();
        if (!window.confirm('¿Seguro que deseas eliminar esta grabación?')) return;

        try {
            const token = localStorage.getItem('adminToken');
            await axios.delete(`${API_URL}/admin/sessions/${sessionId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSessions(prev => prev.filter(s => s._id !== sessionId));
        } catch (err) {
            alert('Error al eliminar: ' + err.message);
        }
    };

    const filteredSessions = sessions.filter(s => {
        const matchesType = filterType === 'all' || s.eventType === filterType;
        const matchesDate = !searchDate || (s.detectedAt || s.createdAt || '').startsWith(searchDate);
        return matchesType && matchesDate;
    });

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '700', color: 'white' }}>
                        Grabaciones de Eventos Acústicos
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                        Registro histórico con pre-roll, clasificación IA y métricas de intensidad
                    </p>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                        <Calendar size={16} color="var(--text-tertiary)" />
                        <input
                            type="date"
                            value={searchDate}
                            onChange={(e) => setSearchDate(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '0.85rem', outline: 'none' }}
                        />
                        {searchDate && (
                            <button onClick={() => setSearchDate('')} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>×</button>
                        )}
                    </div>

                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="glass-input"
                        style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                    >
                        <option value="all">Todos los tipos</option>
                        {Object.entries(EVENT_LABELS).map(([k, meta]) => (
                            <option key={k} value={k}>{meta.es}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table Container */}
            <div className="table-container" style={{ margin: 0 }}>
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                        <Loader2 className="spinner" size={24} />
                        <span>Cargando grabaciones...</span>
                    </div>
                ) : filteredSessions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-tertiary)' }}>
                        <Headphones size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                        <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                            No se encontraron grabaciones con los filtros seleccionados
                        </div>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>HORA & FECHA</th>
                                <th>TIPO</th>
                                <th>CONFIANZA</th>
                                <th>DURACIÓN</th>
                                <th>INTENSIDAD</th>
                                <th>DISPOSITIVO</th>
                                <th>AUDIO</th>
                                {isAdmin && <th>ACCIONES</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSessions.map((session) => {
                                const meta = EVENT_LABELS[session.eventType] || EVENT_LABELS.unknown;
                                const dateObj = new Date(session.detectedAt || session.createdAt);
                                const isCurrentPlaying = playingId === session._id;
                                const currentAudioUrl = audioMap[session._id];

                                return (
                                    <tr
                                        key={session._id}
                                        onClick={() => setSelectedEvent(session)}
                                        style={{ cursor: 'pointer', background: selectedEvent?._id === session._id ? 'rgba(99,102,241,0.08)' : 'transparent' }}
                                    >
                                        <td>
                                            <div style={{ fontWeight: '600', color: 'white', fontSize: '0.9rem' }}>
                                                {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                                {dateObj.toLocaleDateString()}
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
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <div style={{ width: '45px', height: '5px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${session.confidence || 80}%`, height: '100%', background: meta.color }} />
                                                </div>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                    {session.confidence || 80}%
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                            {session.duration || 15}s
                                        </td>
                                        <td>
                                            <span style={{ color: '#F59E0B', fontWeight: '500', fontSize: '0.85rem' }}>
                                                {session.intensityDb || 55} dB
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                                            {session.deviceModel || 'Mobile / Web'}
                                        </td>
                                        <td>
                                            <button
                                                onClick={(e) => playAudio(e, session)}
                                                className="btn btn-secondary"
                                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', gap: '0.35rem' }}
                                                disabled={loadingAudioId === session._id}
                                            >
                                                {loadingAudioId === session._id ? (
                                                    <Loader2 size={14} className="spinner" />
                                                ) : isCurrentPlaying ? (
                                                    <Pause size={14} color="#818CF8" />
                                                ) : (
                                                    <Play size={14} />
                                                )}
                                                <span>{isCurrentPlaying ? 'Pausar' : 'Escuchar'}</span>
                                            </button>

                                            {isCurrentPlaying && currentAudioUrl && (
                                                <audio
                                                    src={currentAudioUrl}
                                                    autoPlay
                                                    onEnded={() => setPlayingId(null)}
                                                    style={{ display: 'none' }}
                                                />
                                            )}
                                        </td>
                                        {isAdmin && (
                                            <td>
                                                <button
                                                    onClick={(e) => handleDelete(e, session._id)}
                                                    className="icon-btn"
                                                    title="Eliminar sesión"
                                                    style={{ color: '#EF4444' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

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
