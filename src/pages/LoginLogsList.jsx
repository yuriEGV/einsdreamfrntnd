import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export default function LoginLogsList() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                const response = await axios.get(`${API_URL}/admin/logs`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setLogs(response.data);
            } catch (error) {
                console.error('Error fetching logs', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    if (loading) {
        return <div className="loader-container"><div className="spinner"></div></div>;
    }

    return (
        <div style={{ flex: 1, paddingBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', padding: '2rem' }}>System Audit Logs</h1>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Log ID</th>
                            <th>Timestamp</th>
                            <th>User Email</th>
                            <th>Role</th>
                            <th>Authentication Method</th>
                            <th>IP Address</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map(log => (
                            <tr key={log._id}>
                                <td style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>{log._id.substring(0, 8)}...</td>
                                <td style={{ fontWeight: 500 }}>{new Date(log.timestamp).toLocaleString()}</td>
                                <td>{log.userId?.email || 'N/A'}</td>
                                <td>
                                    {log.userId?.role ? (
                                        <span className={`badge ${log.userId.role}`}>{log.userId.role}</span>
                                    ) : '-'}
                                </td>
                                <td>
                                    {log.loginMethod === 'google' ?
                                        <span className="badge google">Google OAuth</span> :
                                        <span className="badge email">Email/Pass</span>}
                                </td>
                                <td style={{ fontFamily: 'monospace', color: 'var(--text-tertiary)' }}>{log.ipAddress || 'Unknown'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
