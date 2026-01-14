import React, { useState, useEffect } from 'react';

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:8001' : '/api';

const EngineerDashboard = ({ engineers, allAllocations, projects = [] }) => {
    // Simulation: "Who am I?"
    const [currentEngineerId, setCurrentEngineerId] = useState('');

    // View state
    const [viewMode, setViewMode] = useState('active_week'); // 'active_week', 'lookahead'
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        if (engineers.length > 0 && !currentEngineerId) {
            setCurrentEngineerId(engineers[0].id);
        }
    }, [engineers]);

    const getCurrentWeekAllocations = () => {
        if (!currentEngineerId) return [];

        return allAllocations.filter(a => {
            if (a.engineer_id !== currentEngineerId) return false;

            // Filter by project dates if available
            const project = projects.find(p => p.id === a.project_id);
            if (!project) return true; // Keep if no project found (orphan allocation?) or robust fallback

            // Check if project is active "today" (currentDate model)
            const checkDate = new Date(currentDate);
            checkDate.setHours(12, 0, 0, 0);

            if (project.start_date) {
                const start = new Date(project.start_date);
                start.setHours(0, 0, 0, 0);
                if (checkDate < start) return false;
            }

            if (project.target_end_date) {
                const end = new Date(project.target_end_date);
                end.setHours(23, 59, 59, 999);
                if (checkDate > end) return false;
            }

            // Also check workflow status - ignore Complete/Cancelled? 
            if (project.workflow_status === 'Complete' || project.workflow_status === 'Cancelled') return false;

            return true;
        }).map(a => {
            const project = projects.find(p => p.id === a.project_id);
            return {
                ...a,
                projectName: project ? project.name : 'Unknown Project'
            };
        });
    };

    const myAllocations = getCurrentWeekAllocations();
    const totalHours = myAllocations.reduce((sum, a) => sum + a.hours, 0);
    const capacity = engineers.find(e => e.id === currentEngineerId)?.total_capacity || 40;
    const utilization = Math.round((totalHours / capacity) * 100);

    const getUtilizationColor = (pct) => {
        if (pct > 100) return '#EF4444'; // Red
        if (pct > 80) return '#F59E0B'; // Amber
        return '#10B981'; // Green
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            {/* Header / User Selector */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>My Week</h1>
                    <p style={{ color: '#64748B', marginTop: '0.25rem' }}>
                        {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>VIEW AS</label>
                    <select
                        value={currentEngineerId}
                        onChange={(e) => setCurrentEngineerId(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #E2E8F0', minWidth: '200px' }}
                    >
                        {engineers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Capacity Card */}
            <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                marginBottom: '2rem',
                borderLeft: `6px solid ${getUtilizationColor(utilization)}`
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '0.875rem', color: '#64748B', fontWeight: 500 }}>Total Load</div>
                        <div style={{ fontSize: '2.25rem', fontWeight: 700, color: '#0F172A' }}>
                            {totalHours} <span style={{ fontSize: '1.125rem', color: '#94A3B8', fontWeight: 500 }}>/ {capacity}h</span>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.875rem', color: '#64748B', fontWeight: 500 }}>Utilization</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: getUtilizationColor(utilization) }}>
                            {utilization}%
                        </div>
                    </div>
                </div>
                {/* Progress Bar */}
                <div style={{ width: '100%', height: '8px', background: '#F1F5F9', borderRadius: '4px', marginTop: '1rem', overflow: 'hidden' }}>
                    <div style={{
                        width: `${Math.min(utilization, 100)}%`,
                        height: '100%',
                        background: getUtilizationColor(utilization),
                        transition: 'width 0.5s ease'
                    }}></div>
                </div>
            </div>

            {/* Toggle Switch */}
            <div style={{ display: 'flex', background: '#F1F5F9', padding: '0.25rem', borderRadius: '8px', width: 'fit-content', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => setViewMode('active_week')}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        border: 'none',
                        background: viewMode === 'active_week' ? 'white' : 'transparent',
                        color: viewMode === 'active_week' ? '#0F172A' : '#64748B',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        boxShadow: viewMode === 'active_week' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                        cursor: 'pointer'
                    }}
                >Active Week</button>
                <button
                    onClick={() => setViewMode('lookahead')}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        border: 'none',
                        background: viewMode === 'lookahead' ? 'white' : 'transparent',
                        color: viewMode === 'lookahead' ? '#0F172A' : '#64748B',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        boxShadow: viewMode === 'lookahead' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                        cursor: 'pointer'
                    }}
                >Lookahead</button>
            </div>

            {/* Allocations List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {myAllocations.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: '12px' }}>
                        No allocations found for this week. Enjoy the downtime! 🌴
                    </div>
                ) : (
                    myAllocations.map(alloc => (
                        <div key={alloc.id} style={{
                            background: 'white',
                            padding: '1.25rem',
                            borderRadius: '12px',
                            border: '1px solid #E2E8F0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <div style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0F172A', marginBottom: '0.25rem' }}>
                                    {alloc.projectName}
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.875rem' }}>
                                    <span style={{
                                        background: '#EEF2FF', color: '#4F46E5', padding: '0.125rem 0.5rem', borderRadius: '999px', fontWeight: 600
                                    }}>{alloc.role || 'Contributor'}</span>
                                    <span style={{ color: '#64748B' }}>Daily Avg: <b>{(alloc.hours / 5).toFixed(1)}h</b></span>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A' }}>
                                    {alloc.hours}h
                                </div>
                                <button style={{
                                    marginTop: '0.25rem',
                                    background: 'transparent',
                                    border: '1px solid #CBD5E1',
                                    borderRadius: '6px',
                                    padding: '0.25rem 0.625rem',
                                    fontSize: '0.75rem',
                                    color: '#64748B',
                                    cursor: 'pointer'
                                }}>Confirm</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default EngineerDashboard;
