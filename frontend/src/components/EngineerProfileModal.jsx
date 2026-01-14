import React, { useMemo } from 'react';

const EngineerProfileModal = ({ engineer, allocations = [], projects = [], onClose }) => {
    if (!engineer) return null;

    // Build project lookup
    const projectMap = useMemo(() => {
        const map = {};
        projects.forEach(p => { map[p.id] = p; });
        return map;
    }, [projects]);

    // Calculate KPIs
    const kpis = useMemo(() => {
        const baseCapacity = engineer.hours_per_week || 40;
        const ktloAlloc = allocations.filter(a =>
            a.category === 'KTLO' || a.category === 'OPS_TAX'
        ).reduce((sum, a) => sum + (a.hours || 0), 0);
        const projectAlloc = allocations.filter(a =>
            a.category !== 'KTLO' && a.category !== 'OPS_TAX' && a.category !== 'MEETINGS'
        ).reduce((sum, a) => sum + (a.hours || 0), 0);
        const totalAllocated = allocations.reduce((sum, a) => sum + (a.hours || 0), 0);
        const meetingsAlloc = allocations.filter(a => a.category === 'MEETINGS')
            .reduce((sum, a) => sum + (a.hours || 0), 0);

        const effectiveCapacity = baseCapacity - ktloAlloc;
        const ktloPercent = baseCapacity > 0 ? Math.round((ktloAlloc / baseCapacity) * 100) : 0;
        const deepWorkRatio = totalAllocated > 0
            ? Math.round(((totalAllocated - meetingsAlloc) / totalAllocated) * 100)
            : 100;

        return {
            baseCapacity,
            effectiveCapacity,
            ktloHours: ktloAlloc,
            ktloPercent,
            projectHours: projectAlloc,
            totalAllocated,
            deepWorkRatio
        };
    }, [engineer, allocations]);

    // Group allocations by project for the table
    const projectAllocations = useMemo(() => {
        const byProject = {};

        // Add KTLO row
        const ktloHours = allocations.filter(a =>
            a.category === 'KTLO' || a.category === 'OPS_TAX'
        ).reduce((sum, a) => sum + (a.hours || 0), 0);
        if (ktloHours > 0) {
            byProject['KTLO'] = { name: 'KTLO / Ops Tax', hours: ktloHours, priority: null, isKTLO: true };
        }

        // Group by project
        allocations.filter(a => a.project_id).forEach(alloc => {
            const project = projectMap[alloc.project_id];
            if (!project) return;
            if (!byProject[alloc.project_id]) {
                byProject[alloc.project_id] = {
                    name: project.name,
                    hours: 0,
                    priority: project.priority,
                    isKTLO: false
                };
            }
            byProject[alloc.project_id].hours += alloc.hours || 0;
        });

        return Object.entries(byProject).map(([id, data]) => ({ id, ...data }));
    }, [allocations, projectMap]);

    // Generate 12 week dates
    const weekDates = useMemo(() => {
        const weeks = [];
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday

        for (let i = 0; i < 12; i++) {
            const weekStart = new Date(startOfWeek);
            weekStart.setDate(startOfWeek.getDate() + (i * 7));
            weeks.push({
                date: weekStart,
                label: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            });
        }
        return weeks;
    }, []);

    // Get initials
    const initials = engineer.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';

    // Priority badge helper
    const getPriorityBadge = (priority) => {
        if (!priority) return null;
        const p = priority.toLowerCase();
        const color = p.includes('p1') ? '#EF4444' : p.includes('p2') ? '#F59E0B' : '#6B7280';
        const label = p.includes('p1') ? 'P1' : p.includes('p2') ? 'P2' : 'P3';
        return (
            <span style={{
                background: color,
                color: 'white',
                padding: '0.125rem 0.375rem',
                borderRadius: '4px',
                fontSize: '0.625rem',
                fontWeight: 700,
                marginLeft: '0.5rem'
            }}>{label}</span>
        );
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }} onClick={onClose}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                width: '90%',
                maxWidth: '1000px',
                maxHeight: '90vh',
                overflow: 'auto',
                padding: '2rem'
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: '56px', height: '56px',
                            background: '#2563EB',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '1.25rem'
                        }}>{initials}</div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0F172A' }}>{engineer.name}</h2>
                            <div style={{ color: '#64748B', fontSize: '0.875rem' }}>
                                {engineer.primary_role || 'Engineer'} • {engineer.team || 'Network Team'}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                {(engineer.skills || []).slice(0, 4).map((skill, i) => (
                                    <span key={i} style={{
                                        background: '#F1F5F9',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        color: '#475569',
                                        fontWeight: 500
                                    }}>{skill}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button style={{
                            background: '#2563EB',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.5rem 1rem',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}>Team Allocation Workbench</button>
                        <button onClick={onClose} style={{
                            background: '#F1F5F9',
                            color: '#475569',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.5rem 1rem',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}>Close</button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '1rem', borderLeft: '4px solid #64748B' }}>
                        <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Effective Capacity</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A' }}>
                            {kpis.effectiveCapacity}h
                            <span style={{ fontSize: '1rem', fontWeight: 400, color: '#94A3B8' }}> / {kpis.baseCapacity}h</span>
                        </div>
                    </div>
                    <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '1rem', borderLeft: '4px solid #F59E0B' }}>
                        <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>KTLO / Ops Tax</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A' }}>
                            {kpis.ktloHours}h
                            <span style={{ fontSize: '1rem', fontWeight: 400, color: '#F59E0B' }}> ({kpis.ktloPercent}%)</span>
                        </div>
                    </div>
                    <div style={{
                        background: '#F8FAFC', borderRadius: '12px', padding: '1rem',
                        borderLeft: `4px solid ${kpis.totalAllocated > kpis.baseCapacity ? '#EF4444' : '#10B981'}`
                    }}>
                        <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Allocated Hours</div>
                        <div style={{
                            fontSize: '1.75rem', fontWeight: 700,
                            color: kpis.totalAllocated > kpis.baseCapacity ? '#EF4444' : '#10B981'
                        }}>
                            {kpis.totalAllocated}h
                        </div>
                    </div>
                    <div style={{
                        background: '#F8FAFC', borderRadius: '12px', padding: '1rem',
                        borderLeft: `4px solid ${kpis.deepWorkRatio >= 80 ? '#10B981' : '#EF4444'}`
                    }}>
                        <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Deep Work Ratio</div>
                        <div style={{
                            fontSize: '1.75rem', fontWeight: 700,
                            color: kpis.deepWorkRatio >= 80 ? '#10B981' : '#EF4444'
                        }}>
                            {kpis.deepWorkRatio}%
                        </div>
                    </div>
                </div>

                {/* Allocation Balance & Deep Work Compliance */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '1.25rem' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginBottom: '1rem' }}>Allocation Balance</div>

                        {/* Stacked Bar */}
                        <div style={{
                            display: 'flex',
                            height: '32px',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            background: '#E2E8F0',
                            marginBottom: '0.75rem'
                        }}>
                            {kpis.ktloHours > 0 && (
                                <div style={{
                                    width: `${(kpis.ktloHours / Math.max(kpis.totalAllocated, kpis.baseCapacity)) * 100}%`,
                                    background: '#64748B',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    fontWeight: 600
                                }}>{kpis.ktloHours}h</div>
                            )}
                            {kpis.projectHours > 0 && (
                                <div style={{
                                    width: `${(kpis.projectHours / Math.max(kpis.totalAllocated, kpis.baseCapacity)) * 100}%`,
                                    background: '#2563EB',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    fontWeight: 600
                                }}>{kpis.projectHours}h</div>
                            )}
                        </div>

                        {/* Legend */}
                        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '12px', height: '12px', background: '#64748B', borderRadius: '2px' }}></div>
                                <span style={{ color: '#64748B' }}>KTLO ({kpis.ktloHours}h)</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '12px', height: '12px', background: '#2563EB', borderRadius: '2px' }}></div>
                                <span style={{ color: '#64748B' }}>Projects ({kpis.projectHours}h)</span>
                            </div>
                        </div>
                    </div>
                    <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '1.25rem' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginBottom: '1rem' }}>Deep Work Compliance</div>
                        <div style={{
                            height: '12px',
                            background: '#E2E8F0',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            marginBottom: '0.5rem'
                        }}>
                            <div style={{
                                width: `${Math.min(kpis.deepWorkRatio, 100)}%`,
                                height: '100%',
                                background: kpis.deepWorkRatio >= 80 ? '#10B981' : '#F59E0B',
                                borderRadius: '6px'
                            }}></div>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                            {kpis.deepWorkRatio >= 80
                                ? 'This engineer has minimal meeting overhead, exceeding the 80% target.'
                                : 'Meeting load is higher than ideal. Consider reducing recurring meetings.'}
                        </div>
                    </div>
                </div>

                {/* 12-Week Allocation Summary */}
                <div style={{ background: '#F8FAFC', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, color: '#0F172A' }}>12-Week Allocation Summary</span>
                        <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                            Showing data through {new Date(Date.now() + 12 * 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                            <thead>
                                <tr style={{ background: 'white' }}>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#64748B', minWidth: '180px' }}>PROJECT / STREAM</th>
                                    {weekDates.map((week, i) => (
                                        <th key={i} style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 600, color: '#64748B', minWidth: '50px' }}>
                                            {week.label.split(' ')[0]}<br />{week.label.split(' ')[1]}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {projectAllocations.map(proj => (
                                    <tr key={proj.id} style={{ borderTop: '1px solid #E2E8F0' }}>
                                        <td style={{ padding: '0.75rem 1rem', fontWeight: 500, color: '#0F172A' }}>
                                            {proj.name}
                                            {getPriorityBadge(proj.priority)}
                                        </td>
                                        {weekDates.map((_, i) => (
                                            <td key={i} style={{ padding: '0.75rem 0.5rem', textAlign: 'center', color: '#64748B' }}>
                                                {proj.hours > 0 ? `${proj.hours}h` : '-'}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                {/* Weekly Total Row */}
                                <tr style={{ borderTop: '2px solid #CBD5E1', background: 'white' }}>
                                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0F172A' }}>WEEKLY TOTAL</td>
                                    {weekDates.map((_, i) => {
                                        const total = kpis.totalAllocated;
                                        const isOverAllocated = total > kpis.baseCapacity;
                                        return (
                                            <td key={i} style={{
                                                padding: '0.75rem 0.5rem',
                                                textAlign: 'center',
                                                fontWeight: 700,
                                                background: isOverAllocated ? '#FEE2E2' : total >= 32 ? '#DCFCE7' : '#FEF3C7',
                                                color: isOverAllocated ? '#DC2626' : total >= 32 ? '#166534' : '#92400E'
                                            }}>
                                                {total}h
                                            </td>
                                        );
                                    })}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EngineerProfileModal;
