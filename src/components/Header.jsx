import React from 'react';

export default function Header() {
    const user = JSON.parse(localStorage.getItem('adminUser') || '{}');

    return (
        <header className="top-header">
            <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Admin Console</h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{user.email || 'Admin'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{user.role || 'Superuser'}</div>
                </div>
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '1.2rem'
                }}>
                    {user.email ? user.email.charAt(0).toUpperCase() : 'A'}
                </div>
            </div>
        </header>
    );
}
