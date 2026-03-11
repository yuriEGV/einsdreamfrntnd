import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Play, Loader2, Music, Clock, Smartphone, Calendar, Headphones } from 'lucide-react';

import { API_URL } from '../config';

export default function AudioSessionsList() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [audioMap, setAudioMap] = useState({}); // { sessionId: base64Data }
    const [fetchingAudio, setFetchingAudio] = useState({}); // { sessionId: boolean }

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                const response = await axios.get(`${API_URL}/admin/sessions`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSessions(response.data);
            } catch (error) {
                console.error('Error fetching sessions', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSessions();
    }, []);

    const loadAudio = async (sessionId) => {
        if (audioMap[sessionId] || fetchingAudio[sessionId]) return;

        setFetchingAudio(prev => ({ ...prev, [sessionId]: true }));
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(`${API_URL}/sessions/${sessionId}/audio`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // CRITICAL FIX: Prepend base64 prefix so the browser can play it
            let base64 = response.data.audioBase64;
            if (base64 && !base64.startsWith('data:')) {
                base64 = `data:audio/m4a;base64,${base64}`;
            }

            setAudioMap(prev => ({ ...prev, [sessionId]: base64 }));
        } catch (error) {
            console.error('Error fetching audio data', error);
        } finally {
            setFetchingAudio(prev => ({ ...prev, [sessionId]: false }));
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-indigo-500" size={48} />
            </div>
        );
    }

    return (
        <div className="flex-1 p-6">
            <div className="flex items-center gap-3 mb-8">
                <div style={{ padding: '0.75rem', background: 'rgba(99,102,241,0.1)', borderRadius: '1rem' }}>
                    <Headphones className="text-indigo-500" size={32} />
                </div>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'white' }}>Recording Sessions</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Monitor and playback intelligent voice captures</p>
                </div>
            </div>

            <div className="premium-card" style={{ overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>User Email</th>
                                <th><div className="flex items-center gap-2"><Clock size={14} /> Duration</div></th>
                                <th>Type</th>
                                <th><div className="flex items-center gap-2"><Smartphone size={14} /> Device</div></th>
                                <th><div className="flex items-center gap-2"><Calendar size={14} /> Date</div></th>
                                <th>Audio Playback</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.map((s) => (
                                <tr key={s._id}>
                                    <td style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                                        #{s._id.substring(s._id.length - 6)}
                                    </td>
                                    <td>
                                        <div className="flex flex-col">
                                            <span style={{ fontWeight: 500 }}>{s.userId?.email || 'Unknown'}</span>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>ID: {s.userId?._id?.substring(0, 8)}</span>
                                        </div>
                                    </td>
                                    <td>{s.duration} s</td>
                                    <td>
                                        <span className="badge-premium">
                                            {s.eventType}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{s.deviceModel || 'android'}</td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                        {new Date(s.createdAt).toLocaleString()}
                                    </td>
                                    <td style={{ minWidth: '280px' }}>
                                        {audioMap[s._id] ? (
                                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '1rem' }}>
                                                <audio controls src={audioMap[s._id]} style={{ width: '100%', height: '32px' }} autoPlay>
                                                    Your browser does not support the audio element.
                                                </audio>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => loadAudio(s._id)}
                                                className="btn btn-primary"
                                                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: '0.75rem' }}
                                                disabled={fetchingAudio[s._id]}
                                            >
                                                {fetchingAudio[s._id] ? (
                                                    <Loader2 className="animate-spin" size={16} />
                                                ) : (
                                                    <><Play size={14} fill="white" /> Load Audio</>
                                                )}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {sessions.length === 0 && (
                    <div style={{ padding: '5rem 2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                        <Music size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p>No recording sessions found yet.</p>
                    </div>
                )}

                <div style={{ padding: '1rem', textAlign: 'right', fontSize: '0.65rem', color: 'var(--text-tertiary)', opacity: 0.5 }}>
                    v1.2.0-stable • Build: 2026-03-11_14:58
                </div>
            </div>
        </div>
    );
}
