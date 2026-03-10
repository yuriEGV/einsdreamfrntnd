import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Activity, FileAudio, LogOut, Download } from 'lucide-react';

import { BASE_URL } from '../config';

export default function Sidebar() {
    const navigate = useNavigate();
    const userString = localStorage.getItem('adminUser');
    const user = userString ? JSON.parse(userString) : {};
    console.log('APK Download URL Base:', BASE_URL);

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/login');
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <Activity size={28} color="#6366F1" />
                <span>Einsdream</span>
            </div>

            <nav style={{ flex: 1 }}>
                <NavLink
                    to="/"
                    className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                    end
                >
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                </NavLink>

                {user.role === 'admin' && (
                    <>
                        <NavLink
                            to="/users"
                            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                        >
                            <Users size={20} />
                            <span>Users</span>
                        </NavLink>

                        <NavLink
                            to="/sessions"
                            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                        >
                            <FileAudio size={20} />
                            <span>Recordings</span>
                        </NavLink>

                        <NavLink
                            to="/logs"
                            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                        >
                            <Activity size={20} />
                            <span>Login Audit</span>
                        </NavLink>
                    </>
                )}
            </nav>

            <a
                href={import.meta.env.VITE_APK_URL || `${BASE_URL}/public/einsdream-mobile.apk`}
                target="_blank"
                rel="noopener noreferrer"
                className="nav-link"
                style={{ border: 'none', background: 'var(--card-bg)', borderTop: '1px solid var(--border)', width: '100%', cursor: 'pointer', outline: 'none', color: 'var(--accent-primary)', fontWeight: 'bold' }}
            >
                <Download size={20} />
                <span>Get Mobile App</span>
            </a>

            <button className="nav-link" onClick={handleLogout} style={{ border: 'none', background: 'transparent', width: '100%', cursor: 'pointer', outline: 'none' }}>
                <LogOut size={20} />
                <span>Logout</span>
            </button>
        </aside>
    );
}
