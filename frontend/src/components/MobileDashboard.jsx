import React from 'react';
import { Activity, AlertTriangle, CheckCircle, Clock, PlusCircle } from 'lucide-react';

const MobileDashboard = ({ engineers, projects, allocations }) => {
    // --- Quick Calculations ---

    // 1. Utilization
    const totalCapacity = engineers.length * 40; // Rough weekly capacity
    const totalAllocated = allocations.reduce((sum, a) => sum + (a.hours_per_week || 0), 0);
    const utilization = Math.round((totalAllocated / totalCapacity) * 100) || 0;

    // 2. Over-allocated Engineers
    const activeEngineerIds = new Set(allocations.map(a => a.engineer_id));
    let overAllocatedCount = 0;
    // Simple check: anyone with > 40 hours allocated total? 
    // (Note: This is a simplified check for the summary. The main dashboard has more complex logic.)
    const engineerLoads = {};
    allocations.forEach(a => {
        engineerLoads[a.engineer_id] = (engineerLoads[a.engineer_id] || 0) + a.hours_per_week;
    });
    overAllocatedCount = Object.values(engineerLoads).filter(hours => hours > 40).length;

    // 3. Greeting
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

    return (
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>

            {/* Header / Greeting */}
            <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1E293B', marginBottom: '0.25rem' }}>
                    {greeting}, User
                </h1>
                <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
                    Here is your network team update.
                </p>
            </div>

            {/* Health Badge */}
            <div style={{
                background: utilization > 90 ? '#FEF2F2' : '#F0FDF4',
                border: `1px solid ${utilization > 90 ? '#FECACA' : '#DCFCE7'}`,
                borderRadius: '12px',
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
            }}>
                <div style={{
                    background: utilization > 90 ? '#EF4444' : '#10B981',
                    padding: '0.75rem',
                    borderRadius: '50%',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Activity size={24} />
                </div>
                <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>
                        Team Utilization
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0F172A' }}>
                        {utilization}% <span style={{ fontSize: '0.875rem', fontWeight: '500', color: utilization > 90 ? '#DC2626' : '#16A34A' }}>
                            {utilization > 90 ? '(High Load)' : '(Healthy)'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Actionable Alerts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase' }}>Attention Needed</h3>

                {overAllocatedCount > 0 ? (
                    <div style={{
                        background: 'white',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <AlertTriangle size={20} color="#F59E0B" />
                            <span style={{ fontWeight: '500', color: '#0F172A' }}>{overAllocatedCount} Engineers Over-capacity</span>
                        </div>
                        <span style={{ color: '#3B82F6', fontSize: '0.875rem', fontWeight: '600' }}>Review</span>
                    </div>
                ) : (
                    <div style={{
                        background: 'white',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}>
                        <CheckCircle size={20} color="#10B981" />
                        <span style={{ fontWeight: '500', color: '#0F172A' }}>No immediate staffing issues.</span>
                    </div>
                )}

            </div>

            {/* Quick Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <button style={{
                    background: '#3B82F6',
                    color: 'white',
                    border: 'none',
                    padding: '1rem',
                    borderRadius: '8px',
                    fontWeight: '600',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <PlusCircle size={24} />
                    New Request
                </button>
                <button style={{
                    background: 'white',
                    color: '#0F172A',
                    border: '1px solid #E2E8F0',
                    padding: '1rem',
                    borderRadius: '8px',
                    fontWeight: '600',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <Clock size={24} color="#64748B" />
                    Log Time
                </button>
            </div>

        </div>
    );
};

export default MobileDashboard;
