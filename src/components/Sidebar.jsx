import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Clock,
    FileAudio,
    Activity,
    Settings,
    Users,
    Shield,
    LogOut,
    Download,
    Moon,
    X
} from 'lucide-react';
import { BASE_URL } from '../config';

export default function Sidebar({ isOpen, onClose }) {
    const navigate = useNavigate();
    const userString = localStorage.getItem('adminUser');
    const user = userString ? JSON.parse(userString) : {};

    const handleLogout = () => {
        if (onClose) onClose();
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/login');
    };

    const handleLinkClick = () => {
        if (onClose) onClose();
    };

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            {/* Brand Logo & Mobile Close Button */}
            <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                        flexShrink: 0
                    }}>
                        <Moon size={20} color="white" />
                    </div>
                    <span style={{ fontSize: '1.35rem', fontWeight: '800' }}>Einsdream</span>
                </div>

                {/* Mobile Close Button (X) */}
                <button
                    type="button"
                    className="sidebar-close-btn"
                    onClick={onClose}
                    aria-label="Cerrar menú"
                    title="Cerrar menú"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Navigation Links */}
            <nav style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 1rem 0.5rem 1rem' }}>
                    CENTRO DE CONTROL
                </div>

                <NavLink
                    to="/"
                    className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                    end
                    onClick={handleLinkClick}
                >
                    <LayoutDashboard size={18} />
                    <span>Dashboard</span>
                </NavLink>

                <NavLink
                    to="/timeline"
                    className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                    onClick={handleLinkClick}
                >
                    <Clock size={18} />
                    <span>Línea de Tiempo</span>
                </NavLink>

                <NavLink
                    to="/recordings"
                    className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                    onClick={handleLinkClick}
                >
                    <FileAudio size={18} />
                    <span>Grabaciones</span>
                </NavLink>

                <NavLink
                    to="/diagnostics"
                    className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                    onClick={handleLinkClick}
                >
                    <Activity size={18} />
                    <span>Estado y Sensores</span>
                </NavLink>

                <NavLink
                    to="/settings"
                    className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                    onClick={handleLinkClick}
                >
                    <Settings size={18} />
                    <span>Configuración</span>
                </NavLink>

                {user.role === 'admin' && (
                    <>
                        <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '1rem 1rem 0.5rem 1rem' }}>
                            ADMINISTRACIÓN
                        </div>

                        <NavLink
                            to="/users"
                            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                            onClick={handleLinkClick}
                        >
                            <Users size={18} />
                            <span>Usuarios</span>
                        </NavLink>

                        <NavLink
                            to="/logs"
                            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                            onClick={handleLinkClick}
                        >
                            <Shield size={18} />
                            <span>Auditoría de Acceso</span>
                        </NavLink>
                    </>
                )}
            </nav>

            {/* APK Download Button */}
            <a
                href={import.meta.env.VITE_APK_URL || `${BASE_URL}/download/apk`}
                target="_blank"
                rel="noopener noreferrer"
                className="nav-link"
                onClick={handleLinkClick}
                style={{
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    width: '100%',
                    color: '#818CF8',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    borderRadius: '0.65rem'
                }}
            >
                <Download size={18} />
                <span>Descargar APK v2.1.0</span>
            </a>

            {/* Logout Button */}
            <button
                type="button"
                className="nav-link"
                onClick={handleLogout}
                style={{ border: 'none', background: 'transparent', width: '100%', cursor: 'pointer', outline: 'none', borderRadius: '0.65rem' }}
            >
                <LogOut size={18} />
                <span>Cerrar Sesión</span>
            </button>
        </aside>
    );
}