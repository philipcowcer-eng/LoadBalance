import React, { useState } from 'react';

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:8001' : '/api';

const AddEngineerModal = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        total_capacity: 40,
        ktlo_tax: 0,
        specialization: 'Routing & Switching',
        role: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE}/api/engineers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    total_capacity: parseInt(formData.total_capacity),
                    ktlo_tax: parseInt(formData.ktlo_tax)
                })
            });
            if (res.ok) {
                onSave();
                onClose();
            } else {
                alert('Failed to create engineer');
            }
        } catch (err) {
            console.error(err);
            alert('Error creating engineer');
        }
    };

    return (
        <div className="modal-overlay active">
            <div className="modal" style={{ width: 450 }}>
                <div className="modal-header">
                    <h3>Add New Engineer</h3>
                    <button className="modal-close" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Name</label>
                            <input name="name" className="form-input" required onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Role / Title</label>
                            <select name="role" className="form-select" value={formData.role} onChange={handleChange} required>
                                <option value="">Select Role...</option>
                                <option value="Network Engineer">Network Engineer</option>
                                <option value="Wireless Engineer">Wireless Engineer</option>
                                <option value="Project Manager">Project Manager</option>
                                <option value="Architect">Architect</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Specialization</label>
                            <select name="specialization" className="form-select" onChange={handleChange}>
                                <option value="Routing & Switching">Routing & Switching</option>
                                <option value="Firewall">Firewall</option>
                                <option value="Wireless">Wireless</option>
                                <option value="Cloud">Cloud</option>
                                <option value="Automation">Automation</option>
                                <option value="NOC Operations">NOC Operations</option>
                            </select>
                        </div>
                        <div className="form-group-row">
                            <div className="form-group">
                                <label className="form-label">Total Cap (hrs)</label>
                                <input type="number" name="total_capacity" className="form-input" value={formData.total_capacity} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">KTLO Tax (hrs)</label>
                                <input type="number" name="ktlo_tax" className="form-input" value={formData.ktlo_tax} onChange={handleChange} />
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Save Engineer</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEngineerModal;
