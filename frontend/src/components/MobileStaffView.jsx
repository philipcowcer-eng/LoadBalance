import React, { useState } from 'react';
import { Search, Calendar, ChevronDown, ChevronRight, Phone, Mail } from 'lucide-react';

const MobileStaffView = ({ engineers, engineerSchedules, viewWeeks }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedEngineerId, setExpandedEngineerId] = useState(null);

    // Filter engineers
    const filteredEngineers = engineerSchedules.filter(eng =>
        eng.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eng.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleExpand = (id) => {
        setExpandedEngineerId(expandedEngineerId === id ? null : id);
    };

    const currentWeekLabel = viewWeeks[0]?.label || 'This Week';

    return (
        <div style={{ background: '#F8FAFC', minHeight: '100vh', paddingBottom: '80px' }}>

            {/* Sticky Header */}
            <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 50,
                background: 'white',
                borderBottom: '1px solid #E2E8F0',
                padding: '1rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}>
                <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0F172A', marginBottom: '1rem' }}>
                    Staff Agenda
                </h1>

                {/* Search Bar */}
                <div style={{ position: 'relative' }}>
                    <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        type="text"
                        placeholder="Find engineer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                            fontSize: '1rem',
                            background: '#F1F5F9'
                        }}
                    />
                </div>
            </div>

            {/* Engineer List */}
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredEngineers.map(eng => {
                    const isExpanded = expandedEngineerId === eng.id;
                    const utilizationColor = eng.utilizationPct > 100 ? '#EF4444' : eng.utilizationPct > 80 ? '#F59E0B' : '#10B981';

                    // Get current week allocations for this engineer
                    const currentWeekAllocations = eng.projectWeeklyTotals
                        .filter(p => p.hours > 0) // Only relevant ones
                        .sort((a, b) => b.hours - a.hours);

                    return (
                        <div key={eng.id} style={{
                            background: 'white',
                            borderRadius: '12px',
                            border: '1px solid #E2E8F0',
                            overflow: 'hidden',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}>
                            {/* Card Header (Always Visible) */}
                            <div
                                onClick={() => toggleExpand(eng.id)}
                                style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
                            >
                                {/* Avatar / Initials */}
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    background: '#F1F5F9',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: '700',
                                    color: '#64748B',
                                    fontSize: '1.125rem'
                                }}>
                                    {eng.name.split(' ').map(n => n[0]).join('')}
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '600', color: '#0F172A', fontSize: '1rem' }}>{eng.name}</div>
                                    <div style={{ fontSize: '0.875rem', color: '#64748B' }}>{eng.role}</div>
                                </div>

                                {/* Capacity Indicator */}
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: '700', color: utilizationColor, fontSize: '0.875rem' }}>
                                        {eng.utilizationPct}%
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>load</div>
                                </div>

                                {isExpanded ? <ChevronDown size={20} color="#94A3B8" /> : <ChevronRight size={20} color="#94A3B8" />}
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                                <div style={{ borderTop: '1px solid #F1F5F9', background: '#FAFAFA', padding: '1rem' }}>

                                    {/* Capacity Bar */}
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.5rem', fontWeight: '500', color: '#64748B' }}>
                                            <span>Capacity Used ({currentWeekLabel})</span>
                                            <span>{eng.allocatedTotal}h / {eng.effective}h</span>
                                        </div>
                                        <div style={{ height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${Math.min(eng.utilizationPct, 100)}%`,
                                                height: '100%',
                                                background: utilizationColor
                                            }} />
                                        </div>
                                    </div>

                                    {/* Project Allocations */}
                                    <h4 style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#94A3B8', marginBottom: '0.75rem' }}>
                                        Active Projects
                                    </h4>

                                    {currentWeekAllocations.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {currentWeekAllocations.map((proj, idx) => (
                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B82F6' }}></div>
                                                        <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#334155' }}>{proj.name}</span>
                                                    </div>
                                                    <span style={{ fontWeight: '600', fontSize: '0.875rem', color: '#0F172A' }}>{proj.hours}h</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: '0.875rem', color: '#94A3B8', fontStyle: 'italic' }}>
                                            No active allocations this week.
                                        </div>
                                    )}

                                    {/* Action Buttons (Mock) */}
                                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                                        <button style={{ flex: 1, padding: '0.75rem', background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>
                                            <Mail size={16} /> Email
                                        </button>
                                        <button style={{ flex: 1, padding: '0.75rem', background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>
                                            <Phone size={16} /> Call
                                        </button>
                                    </div>

                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MobileStaffView;
