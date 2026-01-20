import React, { useState } from 'react';

const BulkUpdateModal = ({ selectedCount, onClose, onSave }) => {
    const [updates, setUpdates] = useState({
        workflow_status: '',
        priority: '',
        fiscal_year: ''
    });

    const handleChange = (field, value) => {
        setUpdates(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        // Filter out empty values
        const payload = {};
        if (updates.workflow_status) payload.workflow_status = updates.workflow_status;
        if (updates.priority) payload.priority = updates.priority;
        if (updates.fiscal_year) payload.fiscal_year = updates.fiscal_year;

        onSave(payload);
    };

    return (
        <div className="modal-overlay active">
            <div className="modal" style={{ width: 400 }}>
                <div className="modal-header">
                    <h3>Bulk Update ({selectedCount} Projects)</h3>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <p style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '1rem' }}>
                        Select fields to update. Leave blank to keep existing values.
                    </p>

                    <div className="form-group">
                        <label className="form-label">Workflow Status</label>
                        <select
                            className="form-select"
                            value={updates.workflow_status}
                            onChange={(e) => handleChange('workflow_status', e.target.value)}
                        >
                            <option value="">(No Change)</option>
                            <option value="Draft">Draft</option>
                            <option value="Pending Approval">Pending Approval</option>
                            <option value="Approved">Approved</option>
                            <option value="Active">Active</option>
                            <option value="On Hold">On Hold</option>
                            <option value="Complete">Complete</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Priority</label>
                        <select
                            className="form-select"
                            value={updates.priority}
                            onChange={(e) => handleChange('priority', e.target.value)}
                        >
                            <option value="">(No Change)</option>
                            <option value="P1-Critical">P1 - Critical</option>
                            <option value="P2-Strategic">P2 - Strategic</option>
                            <option value="P3-Standard">P3 - Standard</option>
                            <option value="P4-Low">P4 - Low</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Fiscal Year</label>
                        <select
                            className="form-select"
                            value={updates.fiscal_year}
                            onChange={(e) => handleChange('fiscal_year', e.target.value)}
                        >
                            <option value="">(No Change)</option>
                            <option value="FY24">FY24</option>
                            <option value="FY25">FY25</option>
                            <option value="FY26">FY26</option>
                        </select>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSave}>
                        Update Projects
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkUpdateModal;
