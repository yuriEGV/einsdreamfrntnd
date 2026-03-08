import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await axios.post(`${API_URL}/auth/login`, {
                email,
                password
            });

            const { token, user } = response.data;

            localStorage.setItem('adminToken', token);
            localStorage.setItem('adminUser', JSON.stringify(user));
            navigate('/');

        } catch (err) {
            setError(err.response?.data?.message || 'Error de conexión');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1.8rem', fontWeight: '700' }}>Admin Login</h2>

                {error && (
                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--error)', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <input
                        type="email"
                        className="auth-input"
                        placeholder="Admin Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <input
                        type="password"
                        className="auth-input"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', fontSize: '1.1rem', padding: '0.8rem' }}>
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
}
