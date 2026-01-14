import React, { useState } from 'react';
import { Search, ChevronDown, ChevronRight, Calendar, User, AlignLeft } from 'lucide-react';

const MobileProjectView = ({ projects, engineers }) => {
    const [filter, setFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedProjectId, setExpandedProjectId] = useState(null);

    // --- Smart Filters ---
    const filters = ['All', 'Critical', 'At Risk', 'Launching Soon', 'Drafts'];

    const getFilteredProjects = () => {
        let filtered = projects;

        // 1. Text Search
        if (searchTerm) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        // 2. Smart Tab Filter
        if (filter === 'Critical') return filtered.filter(p => p.rag_status === 'Red');
        if (filter === 'At Risk') return filtered.filter(p => p.rag_status === 'Amber' || p.rag_status === 'Issue');
        if (filter === 'Drafts') return filtered.filter(p => !p.workflow_status || p.workflow_status === 'Draft');
        if (filter === 'Launching Soon') {
            // Simple check: target date in next 30 days
            const now = new Date();
            const thirtyDays = new Date();
            thirtyDays.setDate(now.getDate() + 30);
            return filtered.filter(p => {
                if (!p.target_end_date) return false;
                const d = new Date(p.target_end_date);
                return d >= now && d <= thirtyDays;
            });
        }

        return filtered;
    };

    const visibleProjects = getFilteredProjects();

    const toggleExpand = (id) => {
        setExpandedProjectId(expandedProjectId === id ? null : id);
    };

    const getStatusColor = (status) => {
        const s = status?.toLowerCase() || 'green';
        if (s === 'red' || s === 'blocked') return '#EF4444';
        if (s === 'amber' || s === 'at risk') return '#F59E0B';
        if (s === 'issue') return '#6366F1';
        return '#10B981';
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'TBD';
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

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
                    Project Feed
                </h1>

                {/* Search */}
                <div style={{ position: 'relative', marginBottom: '1rem' }}>
                    <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.625rem 0.625rem 0.625rem 2.25rem',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                            fontSize: '0.925rem',
                            background: '#F1F5F9'
                        }}
                    />
                </div>

                {/* Horizontal Scroll Filters */}
                <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem', scrollbarWidth: 'none' }}>
                    {filters.map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                whiteSpace: 'nowrap',
                                padding: '0.375rem 0.875rem',
                                borderRadius: '20px',
                                border: '1px solid',
                                borderColor: filter === f ? '#2563EB' : '#E2E8F0',
                                background: filter === f ? '#EFF6FF' : 'white',
                                color: filter === f ? '#2563EB' : '#64748B',
                                fontSize: '0.8125rem',
                                fontWeight: '600'
                            }}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* The Feed */}
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {visibleProjects.map(proj => {
                    const isExpanded = expandedProjectId === proj.id;
                    const leadParams = engineers.find(e => e.id === proj.owner_id);
                    const leadName = leadParams ? leadParams.name : 'Unassigned';

                    return (
                        <div key={proj.id} style={{
                            background: 'white',
                            borderRadius: '12px',
                            border: '1px solid #E2E8F0',
                            overflow: 'hidden',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}>
                            {/* Card Face */}
                            <div
                                onClick={() => toggleExpand(proj.id)}
                                style={{ padding: '1rem', cursor: 'pointer' }}
                            >
                                {/* Status Stripe */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{
                                        background: getStatusColor(proj.rag_status),
                                        color: 'white',
                                        padding: '0.25rem 0.625rem',
                                        borderRadius: '99px',
                                        fontSize: '0.75rem',
                                        fontWeight: '700',
                                        textTransform: 'uppercase'
                                    }}>
                                        {proj.rag_status || 'Healthy'}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                                        Due {formatDate(proj.target_end_date)}
                                    </span>
                                </div>

                                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0F172A', marginBottom: '0.25rem', lineHeight: '1.4' }}>
                                    {proj.name}
                                </h3>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: '#64748B' }}>
                                    <User size={14} /> <span>{leadName}</span>
                                </div>
                            </div>

                            {/* Accordion Content */}
                            {isExpanded && (
                                <div style={{ borderTop: '1px solid #F1F5F9', background: '#FAFAFA', padding: '1rem' }}>

                                    {/* Latest Update */}
                                    <div style={{ marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                            <AlignLeft size={14} /> Latest Update
                                        </div>
                                        {proj.latest_status_update ? (
                                            <div style={{ fontSize: '0.875rem', lineHeight: '1.5', color: '#334155', background: 'white', padding: '0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                                {proj.latest_status_update}
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: '0.875rem', color: '#94A3B8', fontStyle: 'italic' }}>
                                                No updates recorded.
                                            </div>
                                        )}
                                    </div>

                                    {/* Key Metadata Grid */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                        <div style={{ background: 'white', padding: '0.625rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                                            <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginBottom: '0.125rem' }}>Workflow</div>
                                            <div style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#0F172A' }}>{proj.workflow_status || 'Draft'}</div>
                                        </div>
                                        <div style={{ background: 'white', padding: '0.625rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                                            <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginBottom: '0.125rem' }}>Priority</div>
                                            <div style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#0F172A' }}>{proj.priority || 'Standard'}</div>
                                        </div>
                                    </div>

                                </div>
                            )}

                            {/* Expand/Collapse Handle */}
                            <div
                                onClick={() => toggleExpand(proj.id)}
                                style={{ background: '#F8FAFC', padding: '0.5rem', display: 'flex', justifyContent: 'center', borderTop: '1px solid #F1F5F9', cursor: 'pointer' }}
                            >
                                {isExpanded ? <ChevronDown size={18} color="#CBD5E1" /> : <ChevronRight size={18} color="#CBD5E1" />}
                            </div>

                        </div>
                    )
                })}
            </div>
        </div>
    );
};

export default MobileProjectView;
