import React, { useState } from 'react';
import axios from 'axios';
import { X, ShieldCheck, MessageSquare, Clock, Zap, Activity, Smartphone, Info } from 'lucide-react';
import { API_URL } from '../config';
import { EVENT_LABELS } from '../services/yamnetClassifier';

export default function EventDetailDrawer({ event, onClose, onCommentAdded }) {
    const [commentText, setCommentText] = useState('');
    const [savingComment, setSavingComment] = useState(false);
    const [comments, setComments] = useState(event?.comments || []);

    if (!event) return null;

    const eventKey = event.type || event.eventType || 'unknown';
    const meta = EVENT_LABELS[eventKey] || EVENT_LABELS.unknown;

    // Robust time formatting (EinsDream 3.0 Telemetry)
    const formatEventTime = (ev) => {
        if (ev.timeLabel) return ev.timeLabel;
        const ts = ev.timestamp || ev.detectedAt || ev.createdAt;
        if (ts) {
            const d = new Date(ts);
            if (!isNaN(d.getTime())) {
                return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            }
        }
        if (ev.offsetMs !== undefined) {
            const totalSecs = Math.floor(ev.offsetMs / 1000);
            const hrs = Math.floor(totalSecs / 3600);
            const mins = Math.floor((totalSecs % 3600) / 60);
            const secs = totalSecs % 60;
            return `+${hrs > 0 ? `${hrs}h ` : ''}${mins}m ${secs}s`;
        }
        return 'Hora Registrada';
    };

    const formatEventDate = (ev) => {
        const ts = ev.timestamp || ev.detectedAt || ev.createdAt;
        if (ts) {
            const d = new Date(ts);
            if (!isNaN(d.getTime())) {
                return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            }
        }
        return 'Sesión Nocturna Sincronizada';
    };

    const detectedTime = formatEventTime(event);
    const detectedDate = formatEventDate(event);
    const eventNum = event.eventNumber ? `#${event.eventNumber}` : '';

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        setSavingComment(true);
        try {
            const token = localStorage.getItem('adminToken');
            const targetId = event._id || event.id;
            if (targetId) {
                const res = await axios.post(`${API_URL}/sessions/${targetId}/comments`, {
                    text: commentText
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.comments) {
                    setComments(res.data.comments);
                    if (onCommentAdded) onCommentAdded(res.data.comments);
                }
            } else {
                setComments(prev => [...prev, { text: commentText, createdAt: new Date(), author: 'Usuario' }]);
            }
            setCommentText('');
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
            zIndex: 1000,
            boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideInRight 0.25s ease-out'
        }}>
            {/* Header */}
            <div style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(0,0,0,0.2)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: meta.color }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        DETALLE DEL EVENTO NOCTURNO {eventNum}
                    </span>
                </div>
                <button
                    onClick={onClose}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.2rem' }}
                >
                    <X size={20} />
                </button>
            </div>

            {/* Content Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                {/* Event Hero Card */}
                <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', marginBottom: '1.25rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{
                        display: 'inline-block',
                        padding: '0.35rem 0.9rem',
                        borderRadius: '2rem',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        backgroundColor: `${meta.color}22`,
                        color: meta.color,
                        border: `1px solid ${meta.color}55`,
                        marginBottom: '0.75rem'
                    }}>
                        {eventNum ? `${eventNum} · ` : ''}{meta.es}
                    </div>

                    <div style={{ fontSize: '2rem', fontWeight: '800', color: 'white', letterSpacing: '-0.02em' }}>
                        {detectedTime}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: '0.25rem', textTransform: 'capitalize' }}>
                        {detectedDate}
                    </div>
                </div>

                {/* Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div className="glass-card" style={{ padding: '0.9rem' }}>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '700' }}>
                            Tipo de Sonido
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '700', color: meta.color, marginTop: '0.2rem' }}>
                            {meta.es}
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '0.9rem' }}>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '700' }}>
                            Intensidad Acústica
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#F59E0B', marginTop: '0.2rem' }}>
                            {event.peakDb ? `${event.peakDb} dB` : (event.intensityDb ? `${event.intensityDb} dB` : '55 dB')}
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '0.9rem' }}>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '700' }}>
                            Duración Estimada
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'white', marginTop: '0.2rem' }}>
                            {event.duration || 5} s
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '0.9rem' }}>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '700' }}>
                            Offset en la Noche
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#38bdf8', marginTop: '0.2rem' }}>
                            {event.offsetMs !== undefined ? `${Math.round(event.offsetMs / 60000)} min` : '--'}
                        </div>
                    </div>
                </div>

                {/* EinsDream 3.0 Local Audio Architecture Notice */}
                <div style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '12px',
                    padding: '1.1rem',
                    marginBottom: '1.5rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                        <ShieldCheck size={18} color="#10b981" />
                        <span style={{ color: '#10b981', fontWeight: '700', fontSize: '0.85rem' }}>
                            Audio 100% Privado en Móvil (EinsDream 3.0)
                        </span>
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: '1.35', margin: 0 }}>
                        El archivo de audio (.m4a) reside únicamente en el almacenamiento interno de tu teléfono. Puedes escuchar este evento exacto tocando el marcador en la barra de tiempo de la app móvil.
                    </p>
                </div>

                {/* Comments / Observations Section */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <MessageSquare size={16} color="#818CF8" />
                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                            NOTAS CLÍNICAS Y OBSERVACIONES
                        </span>
                    </div>

                    <form onSubmit={handleAddComment} style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                className="glass-input"
                                placeholder="Ej: Episodio de ronquido tras cena pesada..."
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
                                Sin notas aún para este evento.
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
