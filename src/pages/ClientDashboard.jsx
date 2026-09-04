import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { NavLink } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Moon, Clock, Download, ArrowRight, FileAudio } from 'lucide-react';
import { API_URL, BASE_URL } from '../config';
import { EVENT_LABELS } from '../services/yamnetClassifier';

export default function ClientDashboard() {
    const [stats, setStats] = useState(null);
    const [nightData, setNightData] = useState(null);
    const [loading, setLoading] = useState(true);

    const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
    const todayStr = new Date().toISOString().slice(0, 10);

    const fetchDashboardData = async () => {
        setLoading(true);
        const token = localStorage.getItem('adminToken');
        try {
            const [statsRes, nightRes] = await Promise.all([
                axios.get(`${API_URL}/sessions/stats`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: null })),
                axios.get(`${API_URL}/sessions/night/${todayStr}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: null }))
            ]);

            if (statsRes?.data) setStats(statsRes.data);
            if (nightRes?.data) setNightData(nightRes.data);
        } catch (error) {
            console.error('Error fetching user dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const typeBreakdown = nightData?.eventBreakdown || stats?.byType || {};
    const totalNightEvents = nightData?.totalEvents || stats?.lastNight?.eventsCount || 0;

    // Data for Pie chart
    const pieData = Object.entries(typeBreakdown)
        .filter(([_, count]) => count > 0)
        .map(([typeKey, count]) => ({
            name: EVENT_LABELS[typeKey]?.es || typeKey,
            value: count,
            color: EVENT_LABELS[typeKey]?.color || '#94A3B8'
        }));

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Morning Greeting & Control Center Banner */}
            <div className="glass-card" style={{
                background: 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.25), rgba(22, 26, 35, 0.95))',
                borderRadius: '1.5rem',
                padding: '2.5rem',
                marginBottom: '2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1.5rem',
                border: '1px solid rgba(99, 102, 241, 0.3)'
            }}>
                <div>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.3rem 0.8rem',
                        borderRadius: '2rem',
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: '#818CF8',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        marginBottom: '0.75rem'
                    }}>
                        <Moon size={14} />
                        <span>CENTRO DE CONTROL NOCTURNO</span>
                    </div>

                    <h1 style={{ fontSize: '2.2rem', fontWeight: '800', color: 'white', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
                        Buenos días, {user.email?.split('@')[0] || 'Usuario'}
                    </h1>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '600px', lineHeight: '1.5' }}>
                        Visualiza los eventos acústicos registrados por tu teléfono durante la noche (ronquidos, tos, respiración e interrupciones sonoras).
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <NavLink to="/timeline" className="btn btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem', gap: '0.75rem', textDecoration: 'none' }}>
                        <Clock size={20} />
                        <span>Ver Línea de Tiempo</span>
                    </NavLink>
                    <NavLink to="/recordings" className="btn btn-secondary" style={{ padding: '0.85rem 1.5rem', fontSize: '1rem', gap: '0.75rem', textDecoration: 'none' }}>
                        <FileAudio size={20} />
                        <span>Escuchar Grabaciones</span>
                    </NavLink>
                </div>
            </div>

            {/* Night Summary Card */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                {/* 1. Last Night Snapshot Card */}
                <div className="glass-card" style={{ padding: '1.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                            Resumen de la Última Noche
                        </span>
                        <span className="badge admin">
                            {nightData?.date || todayStr}
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'white' }}>
                            {totalNightEvents}
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            eventos sonoros detectados
                        </div>
                    </div>

                    {/* Breakdown Progress Bars */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        {Object.entries(EVENT_LABELS).filter(([k]) => k !== 'unknown').map(([typeKey, meta]) => {
                            const count = typeBreakdown[typeKey] || 0;
                            const pct = totalNightEvents > 0 ? Math.round((count / totalNightEvents) * 100) : 0;

                            return (
                                <div key={typeKey}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                                        <span style={{ color: count > 0 ? 'white' : 'var(--text-tertiary)', fontWeight: '500' }}>
                                            {meta.es}
                                        </span>
                                        <span style={{ color: count > 0 ? meta.color : 'var(--text-tertiary)', fontWeight: '600' }}>
                                            {count} ({pct}%)
                                        </span>
                                    </div>
                                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ width: `${pct}%`, height: '100%', background: meta.color, transition: 'width 0.4s ease' }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Donut Distribution Chart */}
                <div className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '1rem' }}>
                        Distribución de Patrones Acústicos
                    </span>

                    {pieData.length > 0 ? (
                        <div style={{ width: '100%', height: 220, minWidth: 0 }}>
                            <ResponsiveContainer width="100%" height={220} minWidth={0}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={80}
                                        paddingAngle={4}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        content={({ payload }) => {
                                            if (payload && payload.length) {
                                                const d = payload[0];
                                                return (
                                                    <div style={{ background: '#161A23', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                        <span style={{ color: d.payload.color, fontWeight: '600' }}>{d.name}: </span>
                                                        <span style={{ color: 'white' }}>{d.value} eventos</span>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                            Sin datos registrados aún para esta noche
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                        {pieData.slice(0, 4).map((p, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color }} />
                                <span>{p.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Global Stats & Mobile App Card */}
                <div className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '1rem', display: 'block' }}>
                            Estadísticas Acumuladas
                        </span>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#818CF8' }}>
                                    {stats?.totalRecordings || 0}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Total Grabaciones</div>
                            </div>

                            <div>
                                <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#34D399' }}>
                                    {stats?.totalHours || 0} h
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Audio Analizado</div>
                            </div>
                        </div>
                    </div>

                    <div style={{
                        padding: '1rem',
                        borderRadius: '0.75rem',
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div>
                            <div style={{ fontWeight: '600', color: 'white', fontSize: '0.9rem' }}>App Android Lista</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>v2.1.1 para Monitoreo Continuo</div>
                        </div>
                        <a
                            href={`${BASE_URL}/public/einsdream-mobile-v2.1.1.apk`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', textDecoration: 'none' }}
                        >
                            <Download size={14} />
                            <span>APK</span>
                        </a>
                    </div>
                </div>
            </div>

            {/* 7-Day Trend Chart */}
            <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'white' }}>
                        Tendencia de Eventos (Últimos 7 Días)
                    </h3>
                    <NavLink to="/timeline" style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: '600' }}>
                        <span>Ver Línea de Tiempo Detallada</span>
                        <ArrowRight size={14} />
                    </NavLink>
                </div>

                <div style={{ width: '100%', height: 220, minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height={220} minWidth={0}>
                        <BarChart data={stats?.recentDaysTrend || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="date" stroke="var(--text-tertiary)" tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} />
                            <YAxis stroke="var(--text-tertiary)" tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ background: '#161A23', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                labelStyle={{ color: 'var(--text-secondary)' }}
                            />
                            <Bar dataKey="events" fill="#6366F1" radius={[6, 6, 0, 0]} name="Eventos" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

