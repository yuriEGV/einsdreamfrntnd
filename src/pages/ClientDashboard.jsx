import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Mic, Square, Loader2, CheckCircle2 } from 'lucide-react';

import { API_URL } from '../config';

export default function ClientDashboard() {
    const [sessions, setSessions] = useState([]);
    const [stats, setStats] = useState({ totalRecordings: 0, totalDuration: 0 });
    const [chartData, setChartData] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [uploading, setUploading] = useState(false);

    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);

    const fetchMySessions = async () => {
        const token = localStorage.getItem('adminToken');
        try {
            const response = await axios.get(`${API_URL}/sessions/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = response.data;
            setSessions(data);

            let totalDuration = 0;
            const groupedByDate = {};

            data.forEach(s => {
                totalDuration += s.duration;
                const date = new Date(s.createdAt).toLocaleDateString();
                if (!groupedByDate[date]) {
                    groupedByDate[date] = { date, interruptions: 0, duration: 0 };
                }
                groupedByDate[date].interruptions += 1;
                groupedByDate[date].duration += s.duration;
            });

            setStats({
                totalRecordings: data.length,
                totalDuration: Math.round(totalDuration)
            });

            setChartData(Object.values(groupedByDate).reverse());

        } catch (error) {
            console.error('Error fetching user sessions:', error);
        }
    };

    useEffect(() => {
        fetchMySessions();
    }, []);

    // ----------------- Web Recording Logic -----------------
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                uploadRecording(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            alert('Could not access microphone: ' + err.message);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const uploadRecording = async (blob) => {
        setUploading(true);
        const token = localStorage.getItem('adminToken');
        try {
            const filename = `web_recording_${Date.now()}.webm`;

            // 1. Init upload
            const initRes = await axios.post(`${API_URL} /upload/init`,
                { filename, contentType: 'audio/webm' },
                { headers: { Authorization: `Bearer ${token} ` } }
            );

            const { url, fileKey, provider } = initRes.data;

            // 2. Upload (Assume local for MVP if not S3/GCS)
            if (provider === 'local') {
                const formData = new FormData();
                formData.append('audio', blob, filename);
                const uploadRes = await axios.post(`${API_URL}${url}`, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });
                await saveMetadata(uploadRes.data.fileKey || fileKey, 5); // Dummy duration
            } else {
                await fetch(url, { method: 'PUT', body: blob, headers: { 'Content-Type': 'audio/webm' } });
                await saveMetadata(fileKey, 5);
            }

            fetchMySessions();
        } catch (error) {
            console.error('Upload failed', error);
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const saveMetadata = async (fileKey, duration) => {
        const token = localStorage.getItem('adminToken');
        await axios.post(`${API_URL}/upload/metadata`,
            { s3Key: fileKey, duration, deviceModel: 'Web Browser', eventType: 'voice' },
            { headers: { Authorization: `Bearer ${token}` } }
        );
    };

    const qScore = () => {
        if (chartData.length === 0) return 100;
        const avgInterruptions = stats.totalRecordings / chartData.length;
        return Math.round(Math.max(0, 100 - (avgInterruptions * 5)));
    };

    const score = qScore();
    const qualityText = score > 80 ? 'Excellent' : score > 60 ? 'Good' : score > 40 ? 'Fair' : 'Poor';

    return (
        <div style={{ padding: '2rem', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="page-title" style={{ margin: 0 }}>My Sleep Activity</h1>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    {!isRecording ? (
                        <button onClick={startRecording} className="btn-primary" disabled={uploading}>
                            {uploading ? <Loader2 className="spinner" size={18} /> : <Mic size={18} />}
                            {uploading ? 'Processing...' : 'Start Recording'}
                        </button>
                    ) : (
                        <button onClick={stopRecording} className="btn" style={{ backgroundColor: 'var(--error)', color: 'white' }}>
                            <Square size={18} /> Stop & Save
                        </button>
                    )}
                </div>
            </div>

            {isRecording && (
                <div className="glass-card" style={{ marginBottom: '2rem', border: '1px solid var(--error)', background: 'rgba(239, 68, 68, 0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="pulse" style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--error)' }}></div>
                        <span style={{ fontWeight: 600, color: 'var(--error)' }}>Studio Recording Active...</span>
                    </div>
                </div>
            )}

            <div className="dashboard-grid">
                <div className="stat-card">
                    <p className="stat-label">Total Events</p>
                    <h3 className="stat-value">{stats.totalRecordings}</h3>
                </div>
                <div className="stat-card">
                    <p className="stat-label">Audio Time</p>
                    <h3 className="stat-value">{stats.totalDuration}s</h3>
                </div>
                <div className="stat-card">
                    <p className="stat-label">Sleep Score</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <h3 className="stat-value" style={{ color: score > 70 ? 'var(--success)' : 'var(--warning)' }}>
                            {score}%
                        </h3>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>({qualityText})</span>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid" style={{ marginTop: '2rem' }}>
                <div className="stat-card" style={{ gridColumn: '1 / -1' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontWeight: '500' }}>Nightly Interruptions</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="date" stroke="#94A3B8" />
                                <YAxis stroke="#94A3B8" />
                                <Tooltip contentStyle={{ background: '#1E293B', border: 'none', borderRadius: '8px' }} />
                                <Bar dataKey="interruptions" name="Events" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="table-container" style={{ marginTop: '2rem', marginInline: 0 }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Duration</th>
                            <th>Device</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sessions.map((s) => (
                            <tr key={s._id}>
                                <td>{new Date(s.createdAt).toLocaleString()}</td>
                                <td>{s.duration}s</td>
                                <td>{s.deviceModel || 'Unknown'}</td>
                                <td><CheckCircle2 size={16} color="var(--success)" /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
