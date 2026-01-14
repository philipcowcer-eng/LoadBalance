import React, { useState, useEffect, useRef } from 'react';

const QuickAddPopover = ({ projects, anchorRect, onClose, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const popoverRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }

        const handleClickOutside = (event) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const filteredProjects = projects
        .filter(p =>
            (p.workflow_status === 'Approved' || p.workflow_status === 'Active') &&
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            const priorityOrder = { 'P1-Critical': 1, 'P2-Strategic': 2, 'P3-Standard': 3, 'P4-Low': 4 };
            return (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99);
        })
        .slice(0, 10);

    // Position logic
    const top = anchorRect.bottom + window.scrollY + 8;
    const left = anchorRect.left + window.scrollX;

    return (
        <div
            ref={popoverRef}
            style={{
                position: 'absolute',
                top: `${top}px`,
                left: `${left}px`,
                width: '260px',
                background: 'white',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                zIndex: 1000,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <div style={{ padding: '0.75rem', borderBottom: '1px solid #F1F5F9' }}>
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.8125rem',
                        border: '1px solid #E2E8F0',
                        borderRadius: '6px',
                        outline: 'none'
                    }}
                />
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {filteredProjects.length > 0 ? (
                    filteredProjects.map(project => (
                        <div
                            key={project.id}
                            onClick={() => onSelect(project.id)}
                            style={{
                                padding: '0.75rem',
                                cursor: 'pointer',
                                transition: 'background 0.2s',
                                borderBottom: '1px solid #F8FAFC'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#F1F5F9'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#0F172A', marginBottom: '0.125rem' }}>
                                {project.name}
                            </div>
                            <div style={{ fontSize: '0.6875rem', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{project.priority.split('-')[0]}</span>
                                {project.is_fully_staffed && <span style={{ color: '#10B981' }}>✓ Staffed</span>}
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', color: '#64748B' }}>
                        No projects found
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuickAddPopover;
