import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Moon,
    Clock,
    FileAudio,
    Activity,
    Settings,
    Users,
    Shield,
    LogOut,
    Download,
    Radio
} from 'lucide-react';
import { BASE_URL } from '../config';

export default function Sidebar() {
    const navigate = useNavigate();
    const userString = localStorage.getItem('adminUser');
    const user = userString ? JSON.parse(userString) : {};

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/login');
    };

    return (
        <aside className="sidebar">
            {/* Brand Logo */}
            <div className="sidebar-logo">
                <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'
                }}>
                    <Moon size={20} color="white" />
                </div>
                <span>Einsdream</span>
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
                >
                    <LayoutDashboard size={18} />
                    <span>Dashboard</span>
                </NavLink>

                <NavLink
                    to="/monitor"
                    className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                    <Moon size={18} />
                    <span>Modo Nocturno</span>
                </NavLink>

                <NavLink
                    to="/timeline"
                    className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                    <Clock size={18} />
                    <span>Línea de Tiempo</span>
                </NavLink>

                <NavLink
                    to="/recordings"
                    className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                    <FileAudio size={18} />
                    <span>Grabaciones</span>
                </NavLink>

                <NavLink
                    to="/diagnostics"
                    className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                    <Activity size={18} />
                    <span>Diagnóstico</span>
                </NavLink>

                <NavLink
                    to="/settings"
                    className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
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
                        >
                            <Users size={18} />
                            <span>Usuarios</span>
                        </NavLink>

                        <NavLink
                            to="/logs"
                            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
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
                style={{
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    width: '100%',
                    color: '#818CF8',
                    fontWeight: '600',
                    marginBottom: '0.5rem'
                }}
            >
                <Download size={18} />
                <span>Descargar APK Android</span>
            </a>

            {/* Logout Button */}
            <button
                className="nav-link"
                onClick={handleLogout}
                style={{ border: 'none', background: 'transparent', width: '100%', cursor: 'pointer', outline: 'none' }}
            >
                <LogOut size={18} />
                <span>Cerrar Sesión</span>
            </button>
        </aside>
    );
}
