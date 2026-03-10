import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { API_URL } from '../config';

export default function AudioSessionsList() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                const response = await axios.get(`${API_URL}/admin/sessions`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSessions(response.data);
            } catch (error) {
                console.error('Error fetching sessions', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSessions();
    }, []);

    if (loading) {
        return <div className="loader-container"><div className="spinner"></div></div>;
    }

    return (
        <div style={{ flex: 1, paddingBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', padding: '2rem' }}>Recoding Sessions (MVP)</h1>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>User Email</th>
                            <th>Duration (s)</th>
                            <th>Event Type</th>
                            <th>Device</th>
                            <th>Date</th>
                            <th>Path / Key</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sessions.map(s => (
                            <tr key={s._id}>
                                <td style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>{s._id.substring(0, 8)}...</td>
                                <td style={{ fontWeight: 500 }}>{s.userId?.email || 'Unknown User'}</td>
                                <td>{s.duration} s</td>
                                <td>
                                    <span className={`badge`} style={{ background: 'rgba(99,102,241,0.2)', color: '#818CF8' }}>
                                        {s.eventType}
                                    </span>
                                </td>
                                <td>{s.deviceModel || 'N/A'}</td>
                                <td>{new Date(s.createdAt).toLocaleString()}</td>
                                <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                                    {s.s3Key}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
