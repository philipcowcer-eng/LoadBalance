import React, { useState, useEffect, useMemo } from 'react';

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:8001' : '';

const FiscalReportPage = ({ projects = [], allDevices = [] }) => {
    // Filter state - empty arrays mean "show all" (no filter applied)
    const [selectedFYs, setSelectedFYs] = useState([]);
    const [targetDate, setTargetDate] = useState('');
    const [selectedDeviceTypes, setSelectedDeviceTypes] = useState([]);

    // Get unique device types from data
    const deviceTypes = useMemo(() => {
        const types = new Set(allDevices.map(d => d.device_type));
        return Array.from(types).sort();
    }, [allDevices]);

    // Build project lookup map
    const projectMap = useMemo(() => {
        const map = {};
        projects.forEach(p => { map[p.id] = p; });
        return map;
    }, [projects]);

    // Filter devices based on criteria
    const filteredDevices = useMemo(() => {
        return allDevices.filter(device => {
            const project = projectMap[device.project_id];
            if (!project) return false;

            // FY Filter
            if (selectedFYs.length > 0 && project.fiscal_year && !selectedFYs.includes(project.fiscal_year)) {
                return false;
            }

            // Target Date Filter
            if (targetDate && project.target_end_date) {
                if (new Date(project.target_end_date) > new Date(targetDate)) {
                    return false;
                }
            }

            // Device Type Filter
            if (selectedDeviceTypes.length > 0 && !selectedDeviceTypes.includes(device.device_type)) {
                return false;
            }

            return true;
        });
    }, [allDevices, projectMap, selectedFYs, targetDate, selectedDeviceTypes]);

    // Calculate totals
    const totals = useMemo(() => {
        const current = filteredDevices.reduce((sum, d) => sum + d.current_qty, 0);
        const proposed = filteredDevices.reduce((sum, d) => sum + d.proposed_qty, 0);
        const netChange = proposed - current;
        const growthPercent = current > 0 ? ((netChange / current) * 100).toFixed(1) : (proposed > 0 ? 100 : 0);
        return { current, proposed, netChange, growthPercent };
    }, [filteredDevices]);

    // Aggregate by device type for chart
    const chartData = useMemo(() => {
        const byType = {};
        filteredDevices.forEach(d => {
            if (!byType[d.device_type]) {
                byType[d.device_type] = { current: 0, proposed: 0 };
            }
            byType[d.device_type].current += d.current_qty;
            byType[d.device_type].proposed += d.proposed_qty;
        });
        return Object.entries(byType).map(([type, data]) => ({
            type,
            current: data.current,
            proposed: data.proposed,
            netChange: data.proposed - data.current
        })).sort((a, b) => b.proposed - a.proposed);
    }, [filteredDevices]);

    // Max value for chart scaling
    const maxValue = useMemo(() => {
        return Math.max(...chartData.flatMap(d => [d.current, d.proposed]), 1);
    }, [chartData]);

    // Toggle FY selection
    const toggleFY = (fy) => {
        if (selectedFYs.includes(fy)) {
            setSelectedFYs(selectedFYs.filter(f => f !== fy));
        } else {
            setSelectedFYs([...selectedFYs, fy]);
        }
    };

    // Toggle device type selection
    const toggleDeviceType = (type) => {
        if (selectedDeviceTypes.includes(type)) {
            setSelectedDeviceTypes(selectedDeviceTypes.filter(t => t !== type));
        } else {
            setSelectedDeviceTypes([...selectedDeviceTypes, type]);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem' }}>
                    📊 Fiscal & Volume Report
                </h1>
                <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
                    Track device refresh and growth across fiscal years
                </p>
            </div>

            {/* Filter Bar */}
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                display: 'flex',
                gap: '1.5rem',
                alignItems: 'flex-start',
                flexWrap: 'wrap'
            }}>
                {/* FY Filter */}
                <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                        Fiscal Year
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {['FY24', 'FY25', 'FY26', 'FY27'].map(fy => (
                            <button
                                key={fy}
                                onClick={() => toggleFY(fy)}
                                style={{
                                    padding: '0.375rem 0.75rem',
                                    borderRadius: '6px',
                                    border: selectedFYs.includes(fy) ? 'none' : '1px solid #E2E8F0',
                                    background: selectedFYs.includes(fy) ? '#2563EB' : 'white',
                                    color: selectedFYs.includes(fy) ? 'white' : '#64748B',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >{fy}</button>
                        ))}
                    </div>
                </div>

                {/* Target Date Filter */}
                <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                        Projects Completing By
                    </div>
                    <input
                        type="date"
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                        style={{
                            padding: '0.375rem 0.75rem',
                            border: '1px solid #E2E8F0',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            color: '#0F172A'
                        }}
                    />
                </div>

                {/* Device Type Filter */}
                <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                        Device Type
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {deviceTypes.length === 0 ? (
                            <span style={{ color: '#94A3B8', fontSize: '0.875rem' }}>No devices</span>
                        ) : (
                            deviceTypes.map(type => (
                                <button
                                    key={type}
                                    onClick={() => toggleDeviceType(type)}
                                    style={{
                                        padding: '0.375rem 0.75rem',
                                        borderRadius: '6px',
                                        border: selectedDeviceTypes.includes(type) ? 'none' : '1px solid #E2E8F0',
                                        background: selectedDeviceTypes.includes(type) ? '#10B981' : 'white',
                                        color: selectedDeviceTypes.includes(type) ? 'white' : '#64748B',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        cursor: 'pointer'
                                    }}
                                >{type}</button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        Total Current
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#64748B' }}>{totals.current}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>devices</div>
                </div>
                <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        Total Proposed
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0F172A' }}>{totals.proposed}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>devices</div>
                </div>
                <div style={{
                    background: totals.netChange >= 0 ? '#F0FDF4' : '#FEF2F2',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    borderLeft: `4px solid ${totals.netChange >= 0 ? '#10B981' : '#EF4444'}`
                }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        Net Growth
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: totals.netChange >= 0 ? '#10B981' : '#EF4444' }}>
                        {totals.netChange >= 0 ? '+' : ''}{totals.netChange}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: totals.netChange >= 0 ? '#059669' : '#DC2626' }}>
                        ({totals.netChange >= 0 ? '+' : ''}{totals.growthPercent}%)
                    </div>
                </div>
            </div>

            {/* Bar Chart */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', marginBottom: '1rem' }}>
                    Current vs Proposed by Device Type
                </div>

                {chartData.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>
                        No device data matching filters
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {chartData.map(item => (
                            <div key={item.type} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '120px', fontSize: '0.875rem', fontWeight: 500, color: '#0F172A', textAlign: 'right' }}>
                                    {item.type}
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    {/* Current Bar */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{
                                            width: `${(item.current / maxValue) * 100}%`,
                                            minWidth: '2px',
                                            height: '20px',
                                            background: '#94A3B8',
                                            borderRadius: '4px',
                                            transition: 'width 0.3s ease'
                                        }}></div>
                                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{item.current}</span>
                                    </div>
                                    {/* Proposed Bar */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{
                                            width: `${(item.proposed / maxValue) * 100}%`,
                                            minWidth: '2px',
                                            height: '20px',
                                            background: '#2563EB',
                                            borderRadius: '4px',
                                            transition: 'width 0.3s ease'
                                        }}></div>
                                        <span style={{ fontSize: '0.75rem', color: '#0F172A', fontWeight: 600 }}>{item.proposed}</span>
                                    </div>
                                </div>
                                <div style={{
                                    width: '60px',
                                    textAlign: 'right',
                                    fontSize: '0.875rem',
                                    fontWeight: 700,
                                    color: item.netChange >= 0 ? '#10B981' : '#EF4444'
                                }}>
                                    {item.netChange >= 0 ? '+' : ''}{item.netChange}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Legend */}
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '16px', height: '16px', background: '#94A3B8', borderRadius: '4px' }}></div>
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Current</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '16px', height: '16px', background: '#2563EB', borderRadius: '4px' }}></div>
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Proposed</span>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>Project Details</span>
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#94A3B8' }}>
                        ({filteredDevices.length} entries)
                    </span>
                </div>

                {filteredDevices.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>
                        No device data matching filters
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ background: '#F8FAFC' }}>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Project</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Device Type</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Current</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Proposed</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Net</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Target Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDevices.map(device => {
                                const project = projectMap[device.project_id];
                                const netChange = device.proposed_qty - device.current_qty;
                                return (
                                    <tr key={device.id} style={{ borderTop: '1px solid #E2E8F0', cursor: 'pointer' }}
                                        onMouseOver={(e) => e.currentTarget.style.background = '#F8FAFC'}
                                        onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                                    >
                                        <td style={{ padding: '0.75rem 1rem', color: '#0F172A', fontWeight: 500 }}>
                                            {project?.name || 'Unknown'}
                                            {project?.fiscal_year && (
                                                <span style={{
                                                    marginLeft: '0.5rem',
                                                    background: '#EEF2FF',
                                                    color: '#4F46E5',
                                                    padding: '0.125rem 0.375rem',
                                                    borderRadius: '4px',
                                                    fontSize: '0.625rem',
                                                    fontWeight: 700
                                                }}>{project.fiscal_year}</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', color: '#64748B' }}>{device.device_type}</td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#64748B' }}>{device.current_qty}</td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#0F172A', fontWeight: 600 }}>{device.proposed_qty}</td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: netChange >= 0 ? '#10B981' : '#EF4444' }}>
                                            {netChange >= 0 ? '+' : ''}{netChange}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', color: '#64748B' }}>
                                            {project?.target_end_date ? new Date(project.target_end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default FiscalReportPage;
