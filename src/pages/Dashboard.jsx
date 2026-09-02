import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, FileAudio, LogIn, Activity, Shield, Download, Sparkles, Moon, HardDrive, Smartphone } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { API_URL, BASE_URL } from '../config';
import { EVENT_LABELS } from '../services/yamnetClassifier';

export default function Dashboard() {
    const [stats, setStats] = useState({ users: 0, sessions: 0, logs: 0 });
    const [adminStats, setAdminStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                const config = { headers: { Authorization: `Bearer ${token}` } };

                const [usersRes, sessionsRes, logsRes, adminStatsRes] = await Promise.all([
                    axios.get(`${API_URL}/admin/users`, config),
                    axios.get(`${API_URL}/admin/sessions`, config),
                    axios.get(`${API_URL}/admin/logs`, config),
                    axios.get(`${API_URL}/admin/stats`, config).catch(() => ({ data: null }))
                ]);

                setStats({
                    users: usersRes.data.length,
                    sessions: sessionsRes.data.length,
                    logs: logsRes.data.length
                });

                if (adminStatsRes?.data) {
                    setAdminStats(adminStatsRes.data);
                }
            } catch (error) {
                console.error('Error fetching admin dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const eventBreakdownData = adminStats?.eventBreakdown
        ? Object.entries(adminStats.eventBreakdown).map(([k, count]) => ({
            name: EVENT_LABELS[k]?.es || k,
            count
        }))
        : [];

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '700', color: 'white' }}>
                        Consola de Administración Einsdream 2.0
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                        Supervisión global de usuarios, grabaciones acústicas y telemetría
                    </p>
                </div>

                <a
                    href={`${BASE_URL}/download/apk`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ textDecoration: 'none', gap: '0.5rem' }}
                >
                    <Download size={18} />
                    <span>Descargar APK Móvil</span>
                </a>
            </div>

            {/* Top Stat Cards Grid */}
            <div className="dashboard-grid" style={{ padding: 0, marginBottom: '2rem' }}>
                <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="stat-label">Usuarios Registrados</span>
                        <Users size={22} color="#6366F1" />
                    </div>
                    <div className="stat-value">{stats.users}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Cuentas de usuario activas</div>
                </div>

                <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="stat-label">Sesiones de Audio</span>
                        <FileAudio size={22} color="#8B5CF6" />
                    </div>
                    <div className="stat-value">{stats.sessions}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Eventos de audio registrados</div>
                </div>

                <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="stat-label">Accesos Auditados</span>
                        <LogIn size={22} color="#EC4899" />
                    </div>
                    <div className="stat-value">{stats.logs}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Inicios de sesión registrados</div>
                </div>
            </div>

            {/* Event Type Aggregation Chart */}
            {eventBreakdownData.length > 0 && (
                <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'white', marginBottom: '1.5rem' }}>
                        Distribución Global de Tipos de Eventos Acústicos
                    </h3>
                    <div style={{ width: '100%', height: '260px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={eventBreakdownData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" stroke="var(--text-tertiary)" tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} />
                                <YAxis stroke="var(--text-tertiary)" tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ background: '#161A23', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                />
                                <Bar dataKey="count" fill="#818CF8" radius={[6, 6, 0, 0]} name="Eventos Registrados" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}
