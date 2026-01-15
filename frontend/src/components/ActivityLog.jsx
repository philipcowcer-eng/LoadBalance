import React, { useState, useEffect } from 'react';

const ActivityLog = ({ API_BASE }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('resourceManager_token');
            const response = await fetch(`${API_BASE}/api/audit/logs`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch activity logs');
            const data = await response.ok ? await response.json() : [];
            setLogs(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading activity...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1E293B' }}>System Activity Audit Trail</h2>
                <button
                    onClick={fetchLogs}
                    style={{
                        padding: '0.5rem 1rem',
                        background: '#F1F5F9',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        cursor: 'pointer'
                    }}
                >
                    Refresh Logs
                </button>
            </div>

            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                        <tr>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' }}>Timestamp</th>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' }}>User</th>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' }}>Action</th>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' }}>Resource</th>
                            <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase' }}>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>No activity recorded yet.</td>
                            </tr>
                        ) : logs.map((log) => (
                            <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#475569' }}>
                                    {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                    <span style={{ fontWeight: '600', color: '#1E293B' }}>{log.username}</span>
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold',
                                        background: log.action === 'LOGIN' ? '#DCFCE7' : log.action === 'DELETE' ? '#FEE2E2' : '#E0F2FE',
                                        color: log.action === 'LOGIN' ? '#166534' : log.action === 'DELETE' ? '#991B1B' : '#0369A1'
                                    }}>
                                        {log.action}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#475569' }}>
                                    {log.resource_type} {log.resource_id && <code style={{ fontSize: '0.75rem', color: '#94A3B8' }}>({log.resource_id.substring(0, 8)})</code>}
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#64748B', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {log.details || '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ActivityLog;
