import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { X, Play, Pause, Volume2, MessageSquare, Download, Clock, Zap, CheckCircle, Loader2 } from 'lucide-react';
import { API_URL, BASE_URL } from '../config';
import { EVENT_LABELS } from '../services/yamnetClassifier';

export default function EventDetailDrawer({ event, onClose, onCommentAdded }) {
    const [audioUrl, setAudioUrl] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [loadingAudio, setLoadingAudio] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [savingComment, setSavingComment] = useState(false);
    const [comments, setComments] = useState(event?.comments || []);

    const audioRef = useRef(null);

    useEffect(() => {
        if (!event) return;
        setComments(event.comments || []);
        setIsPlaying(false);
        setAudioUrl(null);

        // Fetch audio stream URL or presigned URL
        const fetchAudio = async () => {
            setLoadingAudio(true);
            try {
                const token = localStorage.getItem('adminToken');
                const res = await axios.get(`${API_URL}/sessions/${event._id}/audio`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.data.audioUrl) {
                    setAudioUrl(res.data.audioUrl);
                } else if (res.data.audioBase64) {
                    let b64 = res.data.audioBase64;
                    if (!b64.startsWith('data:')) b64 = `data:audio/m4a;base64,${b64}`;
                    setAudioUrl(b64);
                } else if (res.data.streamUrl) {
                    setAudioUrl(`${BASE_URL}${res.data.streamUrl}`);
                }
            } catch (err) {
                console.warn('Could not load audio for event:', err);
            } finally {
                setLoadingAudio(false);
            }
        };

        fetchAudio();
    }, [event]);

    if (!event) return null;

    const meta = EVENT_LABELS[event.eventType] || EVENT_LABELS.unknown;
    const detectedTime = new Date(event.detectedAt || event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const detectedDate = new Date(event.detectedAt || event.createdAt).toLocaleDateString();

    const handlePlayPause = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.warn('Play error:', e));
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        setSavingComment(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.post(`${API_URL}/sessions/${event._id}/comments`, {
                text: commentText
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setComments(res.data.comments || [...comments, { text: commentText, createdAt: new Date(), author: 'Tú' }]);
            setCommentText('');
            if (onCommentAdded) onCommentAdded(event._id, res.data.comments);
        } catch (err) {
            console.error('Error adding comment:', err);
        } finally {
            setSavingComment(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '420px',
            maxWidth: '100vw',
            background: 'var(--bg-secondary)',
            borderLeft: '1px solid var(--border-color)',
            boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
            zIndex: 150,
            display: 'flex',
            flexDirection: 'column',
            animation: 'fadeIn 0.2s ease'
        }}>
            {/* Drawer Header */}
            <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                        Detalle del Evento Nocturno
                    </span>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white' }}>
                        {meta.es}
                    </h3>
                </div>
                <button onClick={onClose} className="icon-btn" style={{ padding: '0.4rem' }}>
                    <X size={20} />
                </button>
            </div>

            {/* Drawer Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                {/* Event Category Badge & Time */}
                <div style={{
                    padding: '1.25rem',
                    borderRadius: '1rem',
                    background: meta.color + '15',
                    border: `1px solid ${meta.color}33`,
                    marginBottom: '1.5rem',
                    textAlign: 'center'
                }}>
                    <div style={{
                        display: 'inline-flex',
                        padding: '0.35rem 0.85rem',
                        borderRadius: '2rem',
                        background: meta.color + '33',
                        color: meta.color,
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        marginBottom: '0.75rem'
                    }}>
                        {meta.es}
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '700', color: 'white' }}>
                        {detectedTime}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {detectedDate}
                    </div>
                </div>

                {/* Metrics Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <div className="glass-card" style={{ padding: '1rem' }}>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                            Confianza IA
                        </div>
                        <div style={{ fontSize: '1.3rem', fontWeight: '700', color: meta.color, marginTop: '0.2rem' }}>
                            {event.confidence || 82}%
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '1rem' }}>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                            Duración
                        </div>
                        <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'white', marginTop: '0.2rem' }}>
                            {event.duration || 15} s
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '1rem' }}>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                            Intensidad
                        </div>
                        <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#F59E0B', marginTop: '0.2rem' }}>
                            {event.intensityDb || 58} dB*
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '1rem' }}>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                            Pre / Post Roll
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#818CF8', marginTop: '0.2rem' }}>
                            {event.preRollSeconds || 5}s / {event.postRollSeconds || 10}s
                        </div>
                    </div>
                </div>

                {/* Audio Player Card */}
                <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                        REPRODUCCIÓN DE AUDIO
                    </div>

                    {loadingAudio ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                            <Loader2 className="spinner" size={20} />
                            <span>Cargando audio...</span>
                        </div>
                    ) : audioUrl ? (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                                <button
                                    onClick={handlePlayPause}
                                    style={{
                                        width: '50px',
                                        height: '50px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                                        border: 'none',
                                        color: 'white',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 4px 15px rgba(99,102,241,0.4)'
                                    }}
                                >
                                    {isPlaying ? <Pause size={22} /> : <Play size={22} style={{ marginLeft: '3px' }} />}
                                </button>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '600', color: 'white', fontSize: '0.9rem' }}>
                                        {isPlaying ? 'Reproduciendo audio...' : 'Pausado'}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                        Clip de {event.duration || 15} segundos
                                    </div>
                                </div>
                            </div>
                            <audio
                                ref={audioRef}
                                src={audioUrl}
                                onEnded={() => setIsPlaying(false)}
                                style={{ width: '100%', marginTop: '0.5rem' }}
                                controls
                            />
                        </div>
                    ) : (
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', textAlign: 'center', padding: '0.5rem' }}>
                            Audio no disponible en el almacenamiento actual
                        </div>
                    )}
                </div>

                {/* Comments / Observations Section */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <MessageSquare size={16} color="#818CF8" />
                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                            OBSERVACIONES Y COMENTARIOS
                        </span>
                    </div>

                    <form onSubmit={handleAddComment} style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                className="glass-input"
                                placeholder="Ej: Me desperté con dolor de garganta..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                style={{ flex: 1, fontSize: '0.85rem', padding: '0.6rem 0.8rem' }}
                            />
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={savingComment || !commentText.trim()}
                                style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}
                            >
                                {savingComment ? '...' : 'Guardar'}
                            </button>
                        </div>
                    </form>

                    {/* Comments List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {comments.length === 0 ? (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                                Sin notas aún. Agrega una observación para revisar con tu médico o especialista.
                            </div>
                        ) : (
                            comments.map((c, i) => (
                                <div key={i} style={{
                                    padding: '0.75rem',
                                    borderRadius: '0.5rem',
                                    background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid var(--border-color)',
                                    fontSize: '0.85rem'
                                }}>
                                    <div style={{ color: 'white', marginBottom: '0.2rem' }}>{c.text}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                                        {c.author || 'Usuario'} • {new Date(c.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
