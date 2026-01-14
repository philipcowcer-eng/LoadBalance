import React, { useState } from 'react';

const AddRidModal = ({ projectId, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        type: 'Risk',
        description: '',
        severity: 'Medium',
        owner: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Use the API_BASE equivalent or relative path if proxied
            // Assuming API_BASE is available via context or passed prop if needed?
            // For now, hardcode http://localhost:8000 or expect parent to handle if we pass logic?
            // Better: component makes the call using standard fetch

            const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:8001' : '/api';

            const res = await fetch(`${API_BASE}/api/projects/${projectId}/rid-log`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                onSave(); // Refresh list
                onClose();
            } else {
                const err = await res.text();
                alert(`Failed to add entry: ${err}`);
            }
        } catch (error) {
            console.error(error);
            alert('Error adding entry');
        }
        setIsSubmitting(false);
    };

    return (
        <div className="modal-overlay active" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div className="modal" style={{
                background: 'white',
                borderRadius: '8px',
                width: '500px',
                maxWidth: '90%',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
                <div className="modal-header" style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid #E2E8F0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#0F172A' }}>Add Log Entry</h3>
                    <button onClick={onClose} style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '1.5rem',
                        lineHeight: 1,
                        color: '#64748B',
                        cursor: 'pointer'
                    }}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>Type</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '0.625rem',
                                border: '1px solid #E2E8F0',
                                borderRadius: '6px',
                                fontSize: '0.875rem'
                            }}
                        >
                            <option value="Risk">Risk</option>
                            <option value="Issue">Issue</option>
                            <option value="Decision">Decision</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                            minLength={10}
                            placeholder="Describe the item..."
                            style={{
                                width: '100%',
                                padding: '0.625rem',
                                border: '1px solid #E2E8F0',
                                borderRadius: '6px',
                                minHeight: '100px',
                                fontSize: '0.875rem',
                                fontFamily: 'inherit'
                            }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>Severity</label>
                            <select
                                value={formData.severity}
                                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '0.625rem',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: '6px',
                                    fontSize: '0.875rem'
                                }}
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>Owner (Optional)</label>
                            <input
                                type="text"
                                value={formData.owner}
                                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                                placeholder="e.g. John Doe"
                                style={{
                                    width: '100%',
                                    padding: '0.625rem',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: '6px',
                                    fontSize: '0.875rem'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                        <button type="button" onClick={onClose} style={{
                            padding: '0.5rem 1rem',
                            background: 'white',
                            border: '1px solid #E2E8F0',
                            borderRadius: '6px',
                            color: '#374151',
                            fontWeight: 500,
                            cursor: 'pointer'
                        }}>Cancel</button>
                        <button type="submit" disabled={isSubmitting} style={{
                            padding: '0.5rem 1rem',
                            background: '#2563EB',
                            border: 'none',
                            borderRadius: '6px',
                            color: 'white',
                            fontWeight: 500,
                            cursor: 'pointer',
                            opacity: isSubmitting ? 0.7 : 1
                        }}>
                            {isSubmitting ? 'Saving...' : 'Add Entry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddRidModal;
