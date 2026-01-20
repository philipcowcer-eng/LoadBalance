import React, { useState, useEffect } from 'react';

// API Base URL (same as App.jsx)
const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:8001' : '';

const ScenarioBuilder = ({ onBack }) => {
    const [scenarios, setScenarios] = useState([]);
    const [activeScenario, setActiveScenario] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAddResourceModal, setShowAddResourceModal] = useState(false);

    // Form States
    const [newScenarioName, setNewScenarioName] = useState('');
    const [newResource, setNewResource] = useState({ name: '', role: 'Network Engineer', capacity: 40 });

    useEffect(() => {
        fetchScenarios();
    }, []);

    const fetchScenarios = async () => {
        try {
            setLoading(true);
            // Retrieve token from storage (make sure key matches AuthContext)
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/scenarios/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setScenarios(data);
            }
        } catch (err) {
            console.error("Failed to load scenarios", err);
        } finally {
            setLoading(false);
        }
    };

    const createScenario = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/scenarios/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: newScenarioName, description: 'Created via Scenario Builder' })
            });
            if (res.ok) {
                setShowCreateModal(false);
                setNewScenarioName('');
                fetchScenarios();
            } else {
                alert("Failed to create scenario");
            }
        } catch (err) {
            console.error(err);
            alert("Error creating scenario");
        }
    };

    const addVirtualResource = async () => {
        if (!activeScenario) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/scenarios/${activeScenario.id}/resources`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newResource.name,
                    role: newResource.role,
                    capacity_hours: parseInt(newResource.capacity)
                })
            });
            if (res.ok) {
                const addedResource = await res.json();
                // Update local state to reflect change immediately (or re-fetch)
                // For now, we mainly need to confirm it worked. 
                // In a real app we'd re-fetch the scenario details to get the updated resource list.
                alert(`Virtual Resource "${addedResource.name}" added!`);
                setShowAddResourceModal(false);
                setNewResource({ name: '', role: 'Network Engineer', capacity: 40 });
            } else {
                const errObj = await res.json();
                alert(`Failed: ${errObj.detail}`);
            }
        } catch (err) {
            console.error(err);
            alert("Error adding resource");
        }
    };

    // --- Views ---

    if (activeScenario) {
        return (
            <div className="workbench-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8FAFC' }}>
                {/* Header */}
                <div style={{ padding: '1rem 2rem', background: 'white', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => setActiveScenario(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>←</button>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0F172A' }}>{activeScenario.name}</h2>
                            <span style={{ fontSize: '0.75rem', color: '#64748B', background: '#FEF3C7', padding: '2px 6px', borderRadius: '4px', border: '1px solid #FCD34D' }}>Sandbox Mode</span>
                        </div>
                    </div>
                    <div>
                        <button className="btn btn-primary" onClick={() => setShowAddResourceModal(true)}>+ Add Virtual Resource</button>
                    </div>
                </div>

                {/* Canvas Area (Placeholder for actual Planning Grid) */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#94A3B8' }}>
                    <div style={{ textAlign: 'center' }}>
                        <h3>Scenario Workbench</h3>
                        <p>Virtual resources will appear here alongside real engineers.</p>
                        <p>(Visualization coming in Phase 2)</p>
                    </div>
                </div>

                {/* Add Resource Modal */}
                {showAddResourceModal && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ width: '400px' }}>
                            <h3>Add Virtual Resource</h3>
                            <div className="form-group">
                                <label>Name (e.g. "TBD Contractor")</label>
                                <input value={newResource.name} onChange={e => setNewResource({ ...newResource, name: e.target.value })} autoFocus />
                            </div>
                            <div className="form-group">
                                <label>Role</label>
                                <select value={newResource.role} onChange={e => setNewResource({ ...newResource, role: e.target.value })}>
                                    <option>Network Engineer</option>
                                    <option>Wireless Engineer</option>
                                    <option>Project Manager</option>
                                    <option>Architect</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Weekly Capacity (Hours)</label>
                                <input type="number" value={newResource.capacity} onChange={e => setNewResource({ ...newResource, capacity: e.target.value })} />
                            </div>
                            <div className="modal-actions">
                                <button className="btn" onClick={() => setShowAddResourceModal(false)}>Cancel</button>
                                <button className="btn btn-primary" onClick={addVirtualResource}>Add Resource</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Scenario Planner</h1>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>+ New Scenario</button>
            </div>

            {loading ? (
                <div>Loading scenarios...</div>
            ) : scenarios.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <p>No scenarios found. Create one to start planning "what-if" situations.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {scenarios.map(sc => (
                        <div key={sc.id} onClick={() => setActiveScenario(sc)} style={{
                            background: 'white',
                            padding: '1.5rem',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                            cursor: 'pointer',
                            transition: 'box-shadow 0.2s'
                        }}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                        >
                            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{sc.name}</h3>
                            <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748B' }}>
                                {sc.description || 'No description'}
                            </p>
                            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.75rem', background: '#F1F5F9', padding: '2px 8px', borderRadius: '4px' }}>Draft</span>
                                <span style={{ fontSize: '0.75rem', background: '#F0F9FF', color: '#0369A1', padding: '2px 8px', borderRadius: '4px' }}>{sc.owner_id ? 'Private' : 'Shared'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ width: '400px' }}>
                        <h3>Create New Scenario</h3>
                        <div className="form-group">
                            <label>Scenario Name</label>
                            <input
                                value={newScenarioName}
                                onChange={e => setNewScenarioName(e.target.value)}
                                placeholder="e.g. Q4 Resource Plan Option B"
                                autoFocus
                            />
                        </div>
                        <div className="modal-actions">
                            <button className="btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={createScenario} disabled={!newScenarioName.trim()}>Create</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScenarioBuilder;
