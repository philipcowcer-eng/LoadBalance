import React, { useState, useEffect } from 'react';

const UserManagementModal = ({ onClose, API_BASE }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/api/auth/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to load users');
            const data = await response.json();
            setUsers(data);
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/api/auth/users/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role: newRole })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to update role');
            }

            setMessage({ type: 'success', text: 'User role updated successfully' });
            fetchUsers(); // Refresh list
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/api/auth/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                // Try parsing JSON if possible
                try {
                    const errorJson = JSON.parse(errorText);
                    throw new Error(errorJson.detail || 'Failed to delete user');
                } catch {
                    throw new Error('Failed to delete user');
                }
            }

            setMessage({ type: 'success', text: 'User deleted successfully' });
            fetchUsers(); // Refresh list
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        }
    };

    return (
        <div className="modal-overlay active" style={{ zIndex: 2000 }}>
            <div className="modal" style={{ width: '800px', maxWidth: '90%' }}>
                <div className="modal-header">
                    <h3>User Management</h3>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    {message && (
                        <div style={{
                            padding: '1rem',
                            borderRadius: '8px',
                            marginBottom: '1.5rem',
                            background: message.type === 'success' ? '#DCFCE7' : '#FEE2E2',
                            color: message.type === 'success' ? '#166534' : '#991B1B',
                            border: `1px solid ${message.type === 'success' ? '#BBF7D0' : '#FECACA'}`
                        }}>
                            {message.text}
                        </div>
                    )}

                    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                <tr>
                                    <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' }}>Username</th>
                                    <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' }}>Created</th>
                                    <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' }}>Role</th>
                                    <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Loading users...</td></tr>
                                ) : users.length === 0 ? (
                                    <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>No users found.</td></tr>
                                ) : users.map((u) => (
                                    <tr key={u.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                        <td style={{ padding: '1rem', fontWeight: '500', color: '#1E293B' }}>{u.username}</td>
                                        <td style={{ padding: '1rem', color: '#475569' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <select
                                                value={u.role}
                                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                style={{
                                                    padding: '0.5rem',
                                                    borderRadius: '6px',
                                                    border: '1px solid #E2E8F0',
                                                    fontSize: '0.875rem',
                                                    background: u.role === 'admin' ? '#FEF2F2' : 'white',
                                                    color: u.role === 'admin' ? '#991B1B' : '#1E293B',
                                                    fontWeight: u.role === 'admin' ? 600 : 400
                                                }}
                                            >
                                                <option value="admin">Admin</option>
                                                <option value="resource_manager">Resource Manager</option>
                                                <option value="project_manager">Project Manager</option>
                                                <option value="engineer">Engineer</option>
                                                <option value="viewer">Viewer</option>
                                            </select>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <button
                                                onClick={() => handleDeleteUser(u.id)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#EF4444',
                                                    cursor: 'pointer',
                                                    padding: '0.5rem',
                                                    borderRadius: '4px'
                                                }}
                                                title="Delete User"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="3 6 5 6 21 6"></polyline>
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default UserManagementModal;
