import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Play, Pause, Trash2, Headphones, Filter, Calendar, Loader2 } from 'lucide-react';
import { API_URL, BASE_URL } from '../config';
import { EVENT_LABELS } from '../services/yamnetClassifier';
import EventDetailDrawer from '../components/EventDetailDrawer';
import AudioPlayerBar from '../components/AudioPlayerBar';

export default function AudioSessionsList() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('all');
    const [filterDate, setFilterDate] = useState('');
    const [selectedEvent, setSelectedEvent] = useState(null);

    // Active playing session for AudioPlayerBar
    const [activePlayingSession, setActivePlayingSession] = useState(null);
    const [activeAudioSource, setActiveAudioSource] = useState(null);
    const [loadingAudioId, setLoadingAudioId] = useState(null);

    const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
    const isAdmin = user.role === 'admin';

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const endpoint = isAdmin ? `${API_URL}/admin/sessions` : `${API_URL}/sessions/me`;
            const res = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = Array.isArray(res.data) ? res.data : (res.data.sessions || []);
            setSessions(data);
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

        if (activePlayingSession?._id === session._id) {
            setActivePlayingSession(null);
            setActiveAudioSource(null);
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

            setActivePlayingSession(session);
            setActiveAudioSource(url || null);
        } catch (err) {
            console.warn('Could not get remote audio URL, playing with acoustic audio synthesizer:', err.message);
            setActivePlayingSession(session);
            setActiveAudioSource(null);
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
            if (activePlayingSession?._id === sessionId) {
                setActivePlayingSession(null);
            }
        } catch (error) {
            alert('Error eliminando sesión: ' + (error.response?.data?.message || error.message));
        }
    };

    const filteredSessions = sessions.filter(s => {
        if (filterType !== 'all' && s.eventType !== filterType) return false;
        if (filterDate) {
            const sDate = new Date(s.detectedAt || s.createdAt).toISOString().slice(0, 10);
            if (sDate !== filterDate) return false;
        }
        return true;
    });

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', paddingBottom: activePlayingSession ? '100px' : '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'white', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
                        Grabaciones de Eventos Acústicos
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Registro histórico con pre-roll, clasificación IA y métricas de intensidad
                    </p>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.4rem 0.8rem' }}>
                        <Calendar size={15} style={{ color: 'var(--text-tertiary)', marginRight: '0.5rem' }} />
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '0.85rem', outline: 'none' }}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.4rem 0.8rem' }}>
                        <Filter size={15} style={{ color: 'var(--text-tertiary)', marginRight: '0.5rem' }} />
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
                        >
                            <option value="all" style={{ background: '#161A23' }}>Todos los tipos</option>
                            {Object.entries(EVENT_LABELS).map(([k, v]) => (
                                <option key={k} value={k} style={{ background: '#161A23' }}>{v.es}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Sessions Table */}
            <div className="table-container">
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <Loader2 size={32} className="spinner" style={{ margin: '0 auto 1rem' }} />
                        <div>Cargando grabaciones...</div>
                    </div>
                ) : filteredSessions.length === 0 ? (
                    <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
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
                                const isCurrentPlaying = activePlayingSession?._id === session._id;

                                return (
                                    <tr
                                        key={session._id}
                                        onClick={() => setSelectedEvent(session)}
                                        style={{ cursor: 'pointer', background: isCurrentPlaying ? 'rgba(99,102,241,0.12)' : 'transparent' }}
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
                                            {session.deviceModel || 'Huawei / Android'}
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
