import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Settings, X, Check } from 'lucide-react';

import { API_URL } from '../config';

export default function UsersList() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newUser, setNewUser] = useState({ email: '', password: '', phone: '', role: 'user' });
    const [editingUser, setEditingUser] = useState(null);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(`${API_URL}/admin/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('adminToken');
            await axios.post(`${API_URL}/admin/users`, newUser, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowModal(false);
            setNewUser({ email: '', password: '', phone: '', role: 'user' });
            fetchUsers();
        } catch (error) {
            alert('Error creating user: ' + error.response?.data?.message || error.message);
        }
    };

    const handleUpdateUser = async (id, updates) => {
        try {
            const token = localStorage.getItem('adminToken');
            await axios.put(`${API_URL}/admin/users/${id}`, updates, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEditingUser(null);
            fetchUsers();
        } catch (error) {
            alert('Error updating user');
        }
    };

    if (loading) {
        return <div className="loader-container"><div className="spinner"></div></div>;
    }

    return (
        <div style={{ flex: 1, padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>Registered Users</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem' }}
                >
                    <Plus size={20} /> Add User
                </button>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Role</th>
                            <th>Services</th>
                            <th>Sensors</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u._id}>
                                <td style={{ fontWeight: 500 }}>{u.email}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{u.phone || 'N/A'}</td>
                                <td><span className={`badge ${u.role}`}>{u.role}</span></td>
                                <td>
                                    {(u.services || []).length > 0 ?
                                        u.services.map(s => <div key={s.name} style={{ fontSize: '0.75rem' }}>• {s.name}</div>) :
                                        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>No services</span>
                                    }
                                </td>
                                <td>
                                    {(u.sensors || []).length > 0 ?
                                        u.sensors.map((s, i) => <div key={i} style={{ fontSize: '0.75rem' }}>• {s.type}</div>) :
                                        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>Standard Mic</span>
                                    }
                                </td>
                                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <button onClick={() => setEditingUser(u)} className="icon-btn">
                                        <Settings size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass-card" style={{ maxWidth: '400px', width: '90%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h3>Create New User</h3>
                            <button onClick={() => setShowModal(false)}><X /></button>
                        </div>
                        <form onSubmit={handleCreateUser}>
                            <div className="input-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    required
                                    className="glass-input"
                                    value={newUser.email}
                                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    required
                                    className="glass-input"
                                    value={newUser.password}
                                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                    depth={0} />
                            </div>
                            <div className="input-group">
                                <label>Phone</label>
                                <input
                                    type="text"
                                    className="glass-input"
                                    value={newUser.phone}
                                    onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
                                />
                            </div>
                            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Create User</button>
                        </form>
                    </div>
                </div>
            )}

            {editingUser && (
                <div className="modal-overlay">
                    <div className="modal-content glass-card" style={{ maxWidth: '450px', width: '90%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h3>Edit User: {editingUser.email}</h3>
                            <button onClick={() => setEditingUser(null)}><X /></button>
                        </div>

                        <div className="input-group">
                            <label>Role</label>
                            <select
                                className="glass-input"
                                value={editingUser.role}
                                onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                            >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        <div style={{ marginTop: '1rem' }}>
                            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Add Service</h4>
                            <button
                                className="btn-secondary"
                                style={{ fontSize: '0.8rem' }}
                                onClick={() => {
                                    const name = prompt('Service name? (e.g. Premium Sleep Analysis)');
                                    if (name) {
                                        const services = [...(editingUser.services || []), { name, status: 'active', startDate: new Date() }];
                                        setEditingUser({ ...editingUser, services });
                                    }
                                }}
                            >
                                + Add Service
                            </button>
                        </div>

                        <div style={{ marginTop: '1rem' }}>
                            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Add External Sensor</h4>
                            <button
                                className="btn-secondary"
                                style={{ fontSize: '0.8rem' }}
                                onClick={() => {
                                    const type = prompt('Sensor type? (e.g. Heart Rate Monitor)');
                                    if (type) {
                                        const sensors = [...(editingUser.sensors || []), { type, model: 'Ext-01', external: true }];
                                        setEditingUser({ ...editingUser, sensors });
                                    }
                                }}
                            >
                                + Add Sensor
                            </button>
                        </div>

                        <button
                            className="btn-primary"
                            style={{ width: '100%', marginTop: '2rem' }}
                            onClick={() => handleUpdateUser(editingUser._id, editingUser)}
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
