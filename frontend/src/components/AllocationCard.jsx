import React, { useState, useEffect, useRef } from 'react';

const AllocationCard = ({ allocation, priorityColor, onDelete, onUpdate }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [tempHours, setTempHours] = useState(allocation.hours);
    const inputRef = useRef(null);

    const isKTLO = allocation.category === 'Operational Support' || allocation.category === 'MEETINGS';

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        const newHours = parseInt(tempHours);
        if (!isNaN(newHours) && newHours !== allocation.hours) {
            onUpdate(allocation.id, newHours);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') {
            setTempHours(allocation.hours);
            setIsEditing(false);
        }
    };

    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                padding: '0.625rem 0.75rem',
                background: isKTLO ? '#F1F5F9' : 'white',
                border: '1px solid #E2E8F0',
                borderLeft: `3px solid ${isKTLO ? '#64748B' : priorityColor}`,
                borderRadius: '6px',
                fontSize: '0.75rem',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                position: 'relative',
                transition: 'all 0.2s ease'
            }}
        >
            {/* Remove Button */}
            {isHovered && !isEditing && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(allocation.id);
                    }}
                    style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: '#EF4444',
                        color: 'white',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '10px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        zIndex: 5
                    }}
                >
                    ✕
                </button>
            )}

            <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {allocation.name}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.625rem', color: '#64748B' }}>
                    {isKTLO ? 'Internal' : (allocation.priority?.split('-')[0] || 'P3')}
                </span>

                {isEditing ? (
                    <input
                        ref={inputRef}
                        type="number"
                        value={tempHours}
                        onChange={(e) => setTempHours(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        style={{
                            width: '40px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            textAlign: 'right',
                            border: '1px solid #3B82F6',
                            borderRadius: '3px',
                            padding: '0 2px',
                            outline: 'none',
                            color: '#1E40AF',
                            background: '#EFF6FF'
                        }}
                    />
                ) : (
                    <span
                        onClick={() => setIsEditing(true)}
                        style={{
                            fontWeight: 800,
                            color: isKTLO ? '#64748B' : (priorityColor || '#3B82F6'),
                            cursor: 'text',
                            padding: '0 2px',
                            borderRadius: '2px',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#F1F5F9'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                        {allocation.hours}h
                    </span>
                )}
            </div>
        </div>
    );
};

export default AllocationCard;
