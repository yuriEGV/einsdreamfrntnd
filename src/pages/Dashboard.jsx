import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, FileAudio, LogIn } from 'lucide-react';

import { API_URL } from '../config';

export default function Dashboard() {
    const [stats, setStats] = useState({ users: 0, sessions: 0, logs: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                const config = { headers: { Authorization: `Bearer ${token}` } };

                const [usersRes, sessionsRes, logsRes] = await Promise.all([
                    axios.get(`${API_URL}/admin/users`, config),
                    axios.get(`${API_URL}/admin/sessions`, config),
                    axios.get(`${API_URL}/admin/logs`, config)
                ]);

                setStats({
                    users: usersRes.data.length,
                    sessions: sessionsRes.data.length,
                    logs: logsRes.data.length
                });

            } catch (error) {
                console.error('Error fetching dashboard stats', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="loader-container">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1.5rem' }}>Overview</h1>

            <div className="dashboard-grid">
                <div className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '0.75rem', borderRadius: '0.75rem', color: 'var(--accent-primary)' }}>
                            <Users size={28} />
                        </div>
                        <span className="stat-label">Total Users</span>
                    </div>
                    <div className="stat-value">{stats.users}</div>
                </div>

                <div className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.75rem', borderRadius: '0.75rem', color: 'var(--success)' }}>
                            <FileAudio size={28} />
                        </div>
                        <span className="stat-label">Recordings</span>
                    </div>
                    <div className="stat-value">{stats.sessions}</div>
                </div>

                <div className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '0.75rem', borderRadius: '0.75rem', color: 'var(--error)' }}>
                            <LogIn size={28} />
                        </div>
                        <span className="stat-label">Total Logins</span>
                    </div>
                    <div className="stat-value">{stats.logs}</div>
                </div>
            </div>
        </div>
    );
}
