import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Smartphone, Menu, X } from 'lucide-react';
import { BASE_URL } from '../config';

export default function Header({ onToggleSidebar, sidebarOpen }) {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const user = JSON.parse(localStorage.getItem('adminUser') || '{}');

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <header className="top-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {/* Mobile Hamburger Toggle Button */}
                <button
                    type="button"
                    className="sidebar-toggle-btn"
                    onClick={onToggleSidebar}
                    aria-label={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
                    title={sidebarOpen ? "Cerrar menú" : "Abrir menú de navegación"}
                >
                    {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>

                <div>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'white', margin: 0 }}>
                        Einsdream
                    </h2>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', display: 'block' }}>
                        Centro de Control
                    </span>
                </div>

                <span className={`badge ${isOnline ? 'email' : 'google'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.68rem', padding: '0.15rem 0.5rem' }}>
                    {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
                    {isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <a
                    href={`${BASE_URL}/download/apk`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem', gap: '0.35rem', textDecoration: 'none' }}
                >
                    <Smartphone size={13} color="#818CF8" />
                    <span>APK</span>
                </a>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div className="header-user-info" style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '600', fontSize: '0.8rem', color: 'white', maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user.email ? user.email.split('@')[0] : 'Usuario'}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                            {user.role === 'admin' ? 'Admin' : 'Personal'}
                        </div>
                    </div>

                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        color: 'white',
                        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                        flexShrink: 0
                    }}>
                        {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                    </div>
                </div>
            </div>
        </header>
    );
}