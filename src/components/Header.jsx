import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Moon, Wifi, WifiOff, Bell, User } from 'lucide-react';

export default function Header() {
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'white' }}>
                    Centro de Monitoreo Acústico Nocturno
                </h2>
                <span className={`badge ${isOnline ? 'email' : 'google'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem' }}>
                    {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                    {isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <NavLink
                    to="/monitor"
                    className="btn btn-primary"
                    style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', gap: '0.4rem', textDecoration: 'none' }}
                >
                    <Moon size={14} />
                    <span>Modo Noche</span>
                </NavLink>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '600', fontSize: '0.85rem', color: 'white' }}>
                            {user.email ? user.email.split('@')[0] : 'Usuario'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                            {user.role === 'admin' ? 'Administrador' : 'Monitoreo Personal'}
                        </div>
                    </div>

                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '1rem',
                        color: 'white',
                        boxShadow: '0 2px 10px rgba(99, 102, 241, 0.3)'
                    }}>
                        {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                    </div>
                </div>
            </div>
        </header>
    );
}
