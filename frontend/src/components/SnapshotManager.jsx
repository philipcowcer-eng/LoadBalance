import React, { useState, useEffect } from 'react';

const SnapshotManager = ({ API_BASE }) => {
    const [snapshots, setSnapshots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchSnapshots();
    }, []);

    const fetchSnapshots = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/api/snapshots/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to load snapshots');
            const data = await response.json();
            setSnapshots(data);
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    const createSnapshot = async () => {
        try {
            setActionLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/api/snapshots/create`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to create snapshot');
            setMessage({ type: 'success', text: 'Snapshot created successfully.' });
            fetchSnapshots();
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setActionLoading(false);
        }
    };

    const restoreSnapshot = async (filename) => {
        if (!window.confirm(`Are you absolutely sure? This will OVERWRITE your current database with data from ${filename}.`)) return;

        try {
            setActionLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/api/snapshots/restore/${filename}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to restore snapshot');
            const data = await response.json();
            setMessage({ type: 'success', text: data.message });
            fetchSnapshots();
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1E293B' }}>Database Snapshots</h2>
                    <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Create and restore backups to safeguard your project data.</p>
                </div>
                <button
                    onClick={createSnapshot}
                    disabled={actionLoading}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: '#2563EB',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: actionLoading ? 'not-allowed' : 'pointer',
                        opacity: actionLoading ? 0.7 : 1,
                        boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
                    }}
                >
                    {actionLoading ? 'Processing...' : '📸 Create New Snapshot'}
                </button>
            </div>

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
                            <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' }}>File Name</th>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' }}>Created</th>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' }}>Size</th>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>Loading snapshots...</td></tr>
                        ) : snapshots.length === 0 ? (
                            <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>No snapshots created yet.</td></tr>
                        ) : snapshots.map((s) => (
                            <tr key={s.filename} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                <td style={{ padding: '1rem', fontWeight: '500', color: '#1E293B' }}>{s.filename}</td>
                                <td style={{ padding: '1rem', color: '#475569' }}>{new Date(s.created_at).toLocaleString()}</td>
                                <td style={{ padding: '1rem', color: '#64748B' }}>{s.size_kb} KB</td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <button
                                        onClick={() => restoreSnapshot(s.filename)}
                                        disabled={actionLoading}
                                        style={{
                                            padding: '0.4rem 0.8rem',
                                            background: 'white',
                                            color: '#991B1B',
                                            border: '1px solid #FEE2E2',
                                            borderRadius: '6px',
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold',
                                            cursor: actionLoading ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        Restore
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#FFF7ED', border: '1px solid #FFEDD5', borderRadius: '12px' }}>
                <h3 style={{ color: '#9A3412', fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.5rem' }}>⚠️ Warning: Snapshot Restore</h3>
                <p style={{ color: '#C2410C', fontSize: '0.875rem' }}>
                    Restoring a snapshot will replace the entire database. A safety backup of your CURRENT state is automatically created before every restore, just in case.
                </p>
            </div>
        </div>
    );
};

export default SnapshotManager;
