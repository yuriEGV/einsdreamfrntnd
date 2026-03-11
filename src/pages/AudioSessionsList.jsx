import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Play, Loader2 } from 'lucide-react';

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
            setAudioMap(prev => ({ ...prev, [sessionId]: response.data.audioBase64 }));
        } catch (error) {
            console.error('Error fetching audio data', error);
        } finally {
            setFetchingAudio(prev => ({ ...prev, [sessionId]: false }));
        }
    };

    if (loading) {
        return <div className="loader-container"><div className="spinner"></div></div>;
    }

    return (
        <div style={{ flex: 1, paddingBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', padding: '2rem' }}>Recoding Sessions (MVP)</h1>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>User Email</th>
                            <th>Duration (s)</th>
                            <th>Event Type</th>
                            <th>Device</th>
                            <th>Date</th>
                            <th>Audio Playback</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sessions.map(s => (
                            <tr key={s._id}>
                                <td style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>{s._id.substring(0, 8)}...</td>
                                <td style={{ fontWeight: 500 }}>{s.userId?.email || 'Unknown User'}</td>
                                <td>{s.duration} s</td>
                                <td>
                                    <span className={`badge`} style={{ background: 'rgba(99,102,241,0.2)', color: '#818CF8' }}>
                                        {s.eventType}
                                    </span>
                                </td>
                                <td>{s.deviceModel || 'N/A'}</td>
                                <td>{new Date(s.createdAt).toLocaleString()}</td>
                                <td style={{ minWidth: '260px' }}>
                                    {audioMap[s._id] ? (
                                        <audio controls src={audioMap[s._id]} style={{ height: '35px', width: '250px' }} autoPlay>
                                            Your browser does not support the audio element.
                                        </audio>
                                    ) : (
                                        <button
                                            onClick={() => loadAudio(s._id)}
                                            className="btn btn-secondary"
                                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
                                            disabled={fetchingAudio[s._id]}
                                        >
                                            {fetchingAudio[s._id] ? (
                                                <>Cargando...</>
                                            ) : (
                                                <><Play size={16} /> Load Audio</>
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
                <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                    No recordings found yet. Try recording with the mobile app!
                </div>
            )}
        </div>
    );
}
