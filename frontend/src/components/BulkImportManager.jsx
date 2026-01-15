import React, { useState } from 'react';

const BulkImportManager = ({ API_BASE }) => {
    const [activeTab, setActiveTab] = useState('engineers');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setResult(null);
        setError(null);
    };

    const handleUpload = async () => {
        if (!file) {
            setError("Please select a CSV file first.");
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('resourceManager_token');
            const endpoint = activeTab === 'engineers' ? '/api/import/engineers' : '/api/import/projects';

            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(errText || `Upload failed: ${response.statusText}`);
            }

            const data = await response.json();
            setResult(data);
        } catch (err) {
            console.error("Import error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1E293B', marginBottom: '1.5rem' }}>Data Management & Import</h2>

            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #E2E8F0' }}>
                    <button
                        onClick={() => { setActiveTab('engineers'); setFile(null); setResult(null); setError(null); }}
                        style={{
                            padding: '0.75rem 1rem',
                            borderBottom: activeTab === 'engineers' ? '2px solid #2563EB' : 'none',
                            color: activeTab === 'engineers' ? '#2563EB' : '#64748B',
                            fontWeight: 600,
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'engineers' ? '2px solid #2563EB' : '2px solid transparent',
                            cursor: 'pointer'
                        }}
                    >
                        Import Engineers
                    </button>
                    <button
                        onClick={() => { setActiveTab('projects'); setFile(null); setResult(null); setError(null); }}
                        style={{
                            padding: '0.75rem 1rem',
                            borderBottom: activeTab === 'projects' ? '2px solid #2563EB' : 'none',
                            color: activeTab === 'projects' ? '#2563EB' : '#64748B',
                            fontWeight: 600,
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'projects' ? '2px solid #2563EB' : '2px solid transparent',
                            cursor: 'pointer'
                        }}
                    >
                        Import Projects
                    </button>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ color: '#475569', marginBottom: '1rem', fontSize: '0.875rem' }}>
                        {activeTab === 'engineers'
                            ? "Upload a CSV with columns: name, role, total_capacity, ktlo_tax"
                            : "Upload a CSV with columns: name, priority, start_date, target_end_date, workflow_status, business_justification"
                        }
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            style={{ fontSize: '0.875rem' }}
                        />
                        <button
                            onClick={handleUpload}
                            disabled={!file || loading}
                            style={{
                                background: loading || !file ? '#94A3B8' : '#2563EB',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '0.5rem 1rem',
                                fontWeight: 600,
                                cursor: loading || !file ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? 'Importing...' : 'Upload & Import'}
                        </button>
                    </div>
                </div>

                {/* Status Messages */}
                {error && (
                    <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '1rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.875rem' }}>
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {result && (
                    <div style={{ background: '#F0FDF4', color: '#166534', padding: '1rem', borderRadius: '6px', fontSize: '0.875rem' }}>
                        <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Import Complete</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{ background: 'white', padding: '0.5rem', borderRadius: '4px', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>IMPORTED</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{result.imported}</div>
                            </div>
                            <div style={{ background: 'white', padding: '0.5rem', borderRadius: '4px', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>SKIPPED</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F59E0B' }}>{result.skipped}</div>
                            </div>
                            <div style={{ background: 'white', padding: '0.5rem', borderRadius: '4px', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>ERRORS</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#EF4444' }}>{result.errors.length}</div>
                            </div>
                        </div>

                        {result.errors.length > 0 && (
                            <div style={{ background: 'white', padding: '0.75rem', borderRadius: '4px', border: '1px solid #DCFCE7' }}>
                                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Error Log:</div>
                                <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#DC2626' }}>
                                    {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BulkImportManager;
