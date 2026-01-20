import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ProjectTasksTab from './ProjectTasksTab';

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:8001' : '';

const ProjectDetailModal = ({ project, onClose, engineers = [], onProjectUpdate }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { can } = useAuth();

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Not set';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
            });
        } catch {
            return 'Not set';
        }
    };

    // Editable state - initialized from project props (US-11.1 to US-11.5)
    const [editableProject, setEditableProject] = useState({
        owner_id: project.owner_id || '',
        manager_id: project.manager_id || '',
        project_number: project.project_number || '',
        project_site: project.project_site || '',
        priority: project.priority || 'P3-Standard',
        rag_status: project.rag_status || 'Green',
        rag_reason: project.rag_reason || '',
        percent_complete: project.percent_complete || 0,
        business_justification: project.business_justification || '',
        start_date: project.start_date || '',
        target_end_date: project.target_end_date || '',
        start_date: project.start_date || '',
        target_end_date: project.target_end_date || '',
        latest_status_update: project.latest_status_update || '',
        // Epic 13 fields (Fiscal Planning)
        fiscal_year: project.fiscal_year || '',
        device_count: project.device_count || 0,
        device_type: project.device_type || '',
    });

    // Track the current project ID to detect actual project switches
    const [currentProjectId, setCurrentProjectId] = useState(project.id);

    // Reset editable state only when switching to a DIFFERENT project
    useEffect(() => {
        // Only reset if we're looking at a different project
        if (project.id !== currentProjectId) {
            setCurrentProjectId(project.id);
            setEditableProject({
                owner_id: project.owner_id || '',
                manager_id: project.manager_id || '',
                project_number: project.project_number || '',
                project_site: project.project_site || '',
                priority: project.priority || 'P3-Standard',
                rag_status: project.rag_status || 'Green',
                rag_reason: project.rag_reason || '',
                percent_complete: project.percent_complete || 0,
                business_justification: project.business_justification || '',
                start_date: project.start_date || '',
                target_end_date: project.target_end_date || '',
                target_end_date: project.target_end_date || '',
                latest_status_update: project.latest_status_update || '',
                fiscal_year: project.fiscal_year || '',
                device_count: project.device_count || 0,
                device_type: project.device_type || '',
            });
            setHasChanges(false);
        }
    }, [project, currentProjectId]);

    // RAG dropdown state
    const [showRagDropdown, setShowRagDropdown] = useState(false);

    // RID Log state
    const [ridEntries, setRidEntries] = useState([]);
    const [showAddRidForm, setShowAddRidForm] = useState(false);
    const [newRidEntry, setNewRidEntry] = useState({ type: 'Risk', description: '', severity: 'Medium', owner: '' });
    const [ridMenuOpen, setRidMenuOpen] = useState(null);

    // Allocations state
    const [allocations, setAllocations] = useState([]);
    const [showAddResourceForm, setShowAddResourceForm] = useState(false);
    const [newAllocation, setNewAllocation] = useState({ engineer_id: '', role: '', category: 'Project Work', day: 'Mon', hours: 8 });
    const [editingHours, setEditingHours] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Resourcing Requirements state (US-RS.1)
    const [requirements, setRequirements] = useState([]);
    const [showAddRequirementForm, setShowAddRequirementForm] = useState(false);
    const [newRequirement, setNewRequirement] = useState({ role: '', hours_per_week: 8, duration_weeks: '' });

    // Device Volume state (US-13.4, US-13.5)
    const [devices, setDevices] = useState([]);
    const [showAddDeviceForm, setShowAddDeviceForm] = useState(false);
    const [newDevice, setNewDevice] = useState({ device_type: '', current_qty: 0, proposed_qty: 0 });
    const [customDeviceType, setCustomDeviceType] = useState('');

    // WBS Tasks state
    const [tasks, setTasks] = useState([]);

    // Project Members state (US-2.5)
    const [projectMembers, setProjectMembers] = useState([]);
    const [showAddMemberForm, setShowAddMemberForm] = useState(false);
    const [newMember, setNewMember] = useState({ engineer_id: '', role: '' });

    // Project Notes state (US-2.7)
    const [notes, setNotes] = useState([]);
    const [newNoteContent, setNewNoteContent] = useState('');
    const [projects, setProjects] = useState([]); // Needed for refreshing project list after status update

    const devicePresets = [
        'Access Points',
        'Switches',
        'Routers',
        'Firewalls',
        'Servers',
        'UPS/Power',
        'Cabling',
        'Other (User Input)'
    ];

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };
            try {
                const [ridRes, allocRes, reqRes, devRes, tasksRes, memRes, notesRes] = await Promise.all([
                    fetch(`${API_BASE}/api/projects/${project.id}/rid-log`, { headers }),
                    fetch(`${API_BASE}/api/projects/${project.id}/allocations`, { headers }),
                    fetch(`${API_BASE}/api/projects/${project.id}/requirements`, { headers }),
                    fetch(`${API_BASE}/api/projects/${project.id}/devices`, { headers }),
                    fetch(`${API_BASE}/api/projects/${project.id}/tasks`, { headers }),
                    fetch(`${API_BASE}/api/projects/${project.id}/members`, { headers }),
                    fetch(`${API_BASE}/api/projects/${project.id}/notes`, { headers })
                ]);

                if (ridRes.ok) {
                    const ridData = await ridRes.json();
                    setRidEntries(ridData.map(r => ({
                        id: r.id,
                        type: r.type,
                        description: r.description,
                        severity: r.severity,
                        owner: r.owner || '',
                        status: r.status,
                        date: r.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
                        previousType: r.previous_type
                    })));
                }

                if (allocRes.ok) {
                    const allocData = await allocRes.json();
                    setAllocations(allocData.map(a => {
                        const eng = engineers.find(e => e.id === a.engineer_id);
                        return {
                            id: a.id,
                            engineer_id: a.engineer_id,
                            name: eng?.name || 'Unassigned',
                            initials: eng?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??',
                            role: a.category || 'Project Work',
                            hours: a.hours,
                            status: 'Assigned',
                            policy_warnings: a.policy_warnings || []
                        };
                    }));
                }

                if (reqRes.ok) {
                    const reqData = await reqRes.json();
                    setRequirements(reqData);
                }

                if (devRes.ok) {
                    const devData = await devRes.json();
                    setDevices(devData);
                }

                if (tasksRes.ok) {
                    const tasksData = await tasksRes.json();
                    setTasks(tasksData);
                }

                if (memRes.ok) {
                    const memData = await memRes.json();
                    setProjectMembers(memData);
                }

                if (notesRes.ok) {
                    const notesData = await notesRes.json();
                    setNotes(notesData);
                }
            } catch (error) {
                console.error('Failed to load data:', error);
            }
            setIsLoading(false);
        };

        fetchData();
    }, [project.id, engineers]);

    const handleFieldChange = (field, value) => {
        setEditableProject(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    // US-11.2: Handle RAG status change with reason requirement
    const handleRagStatusChange = (status) => {
        handleFieldChange('rag_status', status);
        setShowRagDropdown(false);
        // Clear reason if not Red/Issue
        if (status !== 'Red' && status !== 'Issue') {
            handleFieldChange('rag_reason', '');
        }
    };

    const handleSaveChanges = async () => {
        // US-11.2: Validate rag_reason is provided for Red/Issue
        if ((editableProject.rag_status === 'Red' || editableProject.rag_status === 'Issue') && !editableProject.rag_reason.trim()) {
            alert('Please provide a reason for Red or Issue status.');
            return;
        }

        setIsSaving(true);
        try {
            // Clean payload: convert empty strings to null for UUID fields and handle dates
            const payload = { ...editableProject };
            ['owner_id', 'manager_id', 'start_date', 'target_end_date'].forEach(field => {
                if (payload[field] === '') payload[field] = null;
            });

            console.log('DEBUG: Patching project with payload:', payload);

            // Use PATCH for partial update (Epic 11)
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/api/projects/${project.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                setHasChanges(false);
                // Refresh parent data and close modal
                if (onProjectUpdate) {
                    await onProjectUpdate();
                }
                onClose();
            } else {
                const errorText = await response.text();
                console.error('Save failed:', response.status, errorText);
                alert(`Failed to save changes: ${errorText}`);
            }
        } catch (error) {
            console.error('Failed to save:', error);
            alert('Failed to save changes. Please try again.');
        }
        setIsSaving(false);
    };

    const handleWorkflowTransition = async (newStatus) => {
        setIsSaving(true);
        try {
            console.log(`DEBUG: Transitioning project ${project.id} to ${newStatus}`);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/api/projects/${project.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ workflow_status: newStatus })
            });

            if (response.ok) {
                if (onProjectUpdate) {
                    await onProjectUpdate();
                }
                alert(`Project status successfully moved to: ${newStatus}`);
            } else {
                const errorText = await response.text();
                console.error('Transition failed:', response.status, errorText);
                alert(`Failed to update status: ${errorText}`);
            }
        } catch (error) {
            console.error('Workflow transition failed:', error);
            alert('Error updating status. Please check your connection.');
        }
        setIsSaving(false);
    };

    const renderWorkflowButtons = () => {
        const status = project.workflow_status || 'Draft';
        const buttonStyle = {
            padding: '0.5rem 0.875rem',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            transition: 'all 0.2s',
            border: 'none'
        };

        const transitions = [];

        switch (status) {
            case 'Draft':
                transitions.push({ label: 'Submit for Approval', next: 'Pending Approval', color: '#2563EB', textColor: 'white', icon: '📤' });
                break;
            case 'Pending Approval':
                transitions.push({ label: 'Approve', next: 'Approved', color: '#10B981', textColor: 'white', icon: '✅' });
                transitions.push({ label: 'Reject to Draft', next: 'Draft', color: '#EF4444', textColor: 'white', icon: '↩️' });
                break;
            case 'Approved':
                transitions.push({ label: 'Activate Project', next: 'Active', color: '#1E293B', textColor: 'white', icon: '⚡' });
                transitions.push({ label: 'Cancel', next: 'Cancelled', color: '#64748B', textColor: 'white', icon: '🚫' });
                break;
            case 'Active':
                transitions.push({ label: 'Put on Hold', next: 'On Hold', color: '#F59E0B', textColor: 'white', icon: '⏸️' });
                transitions.push({ label: 'Mark Complete', next: 'Complete', color: '#6366F1', textColor: 'white', icon: '🏁' });
                break;
            case 'On Hold':
                transitions.push({ label: 'Resume', next: 'Active', color: '#10B981', textColor: 'white', icon: '▶️' });
                transitions.push({ label: 'Cancel Project', next: 'Cancelled', color: '#EF4444', textColor: 'white', icon: '🗑️' });
                break;
            case 'Complete':
            case 'Cancelled':
                transitions.push({ label: 'Restore to Draft', next: 'Draft', color: '#F1F5F9', textColor: '#475569', icon: '♻️' });
                break;
            default:
                break;
        }

        return (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                {transitions.map((t, i) => (
                    <button
                        key={i}
                        disabled={isSaving || !can('edit_project_status')}
                        onClick={() => handleWorkflowTransition(t.next)}
                        style={{
                            ...buttonStyle,
                            background: t.color,
                            color: t.textColor,
                            opacity: isSaving ? 0.6 : 1,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                    >
                        <span>{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </div>
        );
    };


    const getPriorityColor = (priority) => {
        if (!priority) return { bg: '#DBEAFE', text: '#1E40AF' };
        if (priority.includes('1') || priority.includes('Critical')) return { bg: '#FEE2E2', text: '#DC2626' };
        if (priority.includes('2') || priority.includes('Strategic')) return { bg: '#FEF3C7', text: '#D97706' };
        if (priority.includes('3') || priority.includes('Standard')) return { bg: '#DBEAFE', text: '#2563EB' };
        return { bg: '#F3F4F6', text: '#6B7280' };
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'active': case 'approved': return { bg: '#DCFCE7', text: '#15803D' };
            case 'draft': return { bg: '#F1F5F9', text: '#475569' };
            case 'pending approval': return { bg: '#FEF3C7', text: '#D97706' };
            case 'on hold': return { bg: '#FED7AA', text: '#C2410C' };
            case 'complete': return { bg: '#E0E7FF', text: '#4338CA' };
            case 'cancelled': return { bg: '#FEE2E2', text: '#DC2626' };
            default: return { bg: '#F1F5F9', text: '#475569' };
        }
    };

    const getRagColor = (rag) => {
        switch (rag?.toLowerCase()) {
            case 'green': return { bg: '#DCFCE7', text: '#15803D', dot: '#22C55E' };
            case 'amber': return { bg: '#FEF3C7', text: '#D97706', dot: '#F59E0B' };
            case 'red': return { bg: '#FEE2E2', text: '#DC2626', dot: '#EF4444' };
            case 'issue': return { bg: '#E0E7FF', text: '#4338CA', dot: '#6366F1' };
            default: return { bg: '#DCFCE7', text: '#15803D', dot: '#22C55E' };
        }
    };

    const priorityColors = getPriorityColor(project.priority);
    const statusColors = getStatusColor(project.workflow_status);
    const ragColors = getRagColor(editableProject.rag_status);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: '📋' },
        { id: 'rid', label: 'Health & RID Log', icon: '⚠️' },
        { id: 'tasks', label: 'Tasks', icon: '📝' },
        { id: 'schedule', label: 'Schedule & Allocations', icon: '📅' },
        { id: 'notes', label: 'Notes', icon: '💬' },
    ];

    // RID Log functions - API integrated (US-11.6, US-11.7)
    const handleAddRidEntry = async () => {
        if (newRidEntry.description.length < 10) return;

        console.log('DEBUG: Attempting to add RID entry:', newRidEntry);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/api/projects/${project.id}/rid-log`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newRidEntry)
            });

            if (response.ok) {
                const savedEntry = await response.json();
                console.log('DEBUG: RID entry saved successfully:', savedEntry);
                setRidEntries([{
                    id: savedEntry.id,
                    type: savedEntry.type,
                    description: savedEntry.description,
                    severity: savedEntry.severity,
                    owner: savedEntry.owner || '',
                    status: savedEntry.status,
                    date: savedEntry.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
                    previousType: savedEntry.previous_type
                }, ...ridEntries]);
                setNewRidEntry({ type: 'Risk', description: '', severity: 'Medium', owner: '' });
                setShowAddRidForm(false);
            } else {
                const errorText = await response.text();
                console.error('Failed to add RID entry:', response.status, errorText);
            }
        } catch (error) {
            console.error('Fetch error in handleAddRidEntry:', error);
        }
    };

    const handlePromoteRid = async (id, toType) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/api/rid-log/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ type: toType })
            });

            if (response.ok) {
                setRidEntries(ridEntries.map(entry => {
                    if (entry.id === id) {
                        return { ...entry, previousType: entry.type, type: toType, date: new Date().toISOString().split('T')[0] };
                    }
                    return entry;
                }));
            }
        } catch (error) {
            console.error('Failed to promote RID entry:', error);
        }
        setRidMenuOpen(null);
    };

    const handleDeleteRid = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/api/rid-log/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setRidEntries(ridEntries.filter(entry => entry.id !== id));
            }
        } catch (error) {
            console.error('Failed to delete RID entry:', error);
        }
        setRidMenuOpen(null);
    };

    // Allocation functions - API integrated (US-11.8, US-11.9, US-11.10)
    const handleAddAllocation = async () => {
        console.log('DEBUG: Attempting to add allocation:', newAllocation);
        if (!newAllocation.engineer_id || !newAllocation.role) {
            console.warn('DEBUG: Missing engineer_id or role', newAllocation);
            return;
        }

        try {
            const payload = {
                engineer_id: newAllocation.engineer_id,
                role: newAllocation.role,
                category: newAllocation.category,
                day: newAllocation.day,
                hours_per_week: parseInt(newAllocation.hours) || 8
            };
            console.log('DEBUG: Sending allocation payload:', payload);

            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/api/projects/${project.id}/allocations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const savedAlloc = await response.json();
                console.log('DEBUG: Allocation saved successfully:', savedAlloc);
                const eng = engineers.find(e => e.id === newAllocation.engineer_id);
                setAllocations([...allocations, {
                    id: savedAlloc.id,
                    engineer_id: savedAlloc.engineer_id,
                    name: eng?.name || 'Unassigned',
                    initials: eng?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??',
                    role: newAllocation.role,
                    hours: savedAlloc.hours,
                    status: 'Assigned',
                    policy_warnings: savedAlloc.policy_warnings || []
                }]);
                setNewAllocation({ engineer_id: '', role: '', category: 'Project Work', day: 'Mon', hours: 8 });
                setShowAddResourceForm(false);
                setHasChanges(true);
                if (onProjectUpdate) onProjectUpdate();
            } else {
                const errorText = await response.text();
                console.error('Failed to add allocation:', response.status, errorText);
                alert(`Failed to add allocation: ${errorText}`);
            }
        } catch (error) {
            console.error('Failed to add allocation:', error);
        }
    };

    const handleRemoveAllocation = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/api/allocations/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setAllocations(allocations.filter(a => a.id !== id));
                setHasChanges(true);
                if (onProjectUpdate) onProjectUpdate();
            }
        } catch (error) {
            console.error('Failed to remove allocation:', error);
        }
        setDeleteConfirm(null);
    };

    const handleUpdateHours = async (id, newHours) => {
        const hours = Math.min(40, Math.max(2, Math.round(parseInt(newHours) / 2) * 2));

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/api/allocations/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ hours_per_week: hours })
            });

            if (response.ok) {
                setAllocations(allocations.map(a => a.id === id ? { ...a, hours } : a));
                setHasChanges(true);
                if (onProjectUpdate) onProjectUpdate();
            }
        } catch (error) {
            console.error('Failed to update hours:', error);
        }
        setEditingHours(null);
    };


    // Project Member Functions (US-2.5)
    const handleAddMember = async () => {
        if (!newMember.engineer_id || !newMember.role) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/api/projects/${project.id}/members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newMember)
            });

            if (response.ok) {
                const savedMember = await response.json();
                // Manually attach engineer object for UI since API response might generally include it based on connection but explicit attachment here ensures immediate UI update compatibility if schema differs slightly on post (but schema has engineer field). 
                // Actually fetching the engineer details from our 'engineers' prop to populate the UI view immediately is safer than re-fetching.
                const fullMember = {
                    ...savedMember,
                    engineer: engineers.find(e => e.id === savedMember.engineer_id)
                };
                setProjectMembers([...projectMembers, fullMember]);
                setNewMember({ engineer_id: '', role: '' });
                setShowAddMemberForm(false);
            } else {
                const errorText = await response.text();
                alert(`Failed to add member: ${errorText}`);
            }
        } catch (error) {
            console.error('Failed to add member:', error);
        }
    };

    const handleRemoveMember = async (memberId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/projects/${project.id}/members/${memberId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setProjectMembers(projectMembers.filter(m => m.id !== memberId));
            } else {
                alert("Failed to remove member");
            }
        } catch (error) {
            console.error("Error removing member:", error);
        }
    };

    // Notes Handlers (US-2.7)
    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!newNoteContent.trim()) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/projects/${project.id}/notes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }, // Hardcoded user for now until auth context is fully passed
                body: JSON.stringify({ content: newNoteContent, created_by: 'Current User' })
            });
            if (res.ok) {
                const newNote = await res.json();
                setNotes([newNote, ...notes]);
                setNewNoteContent('');
            } else {
                alert("Failed to add note");
            }
        } catch (error) {
            console.error("Error adding note:", error);
        }
    };

    const handleDeleteNote = async (noteId) => {
        if (!window.confirm("Are you sure you want to delete this note?")) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/projects/${project.id}/notes/${noteId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setNotes(notes.filter(n => n.id !== noteId));
            } else {
                alert("Failed to delete note");
            }
        } catch (error) {
            console.error("Error deleting note:", error);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem'
        }} onClick={(e) => { if (e.target === e.currentTarget) { setShowRagDropdown(false); setRidMenuOpen(null); } }}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                width: '800px',
                maxWidth: '95vw',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.5rem 2rem',
                    borderBottom: '1px solid #E2E8F0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <span style={{
                                background: priorityColors.bg,
                                color: priorityColors.text,
                                padding: '0.25rem 0.625rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 700
                            }}>{project.priority || 'P3-Standard'}</span>
                            <h2 style={{ margin: 0, fontSize: '1.375rem', fontWeight: 700, color: '#0F172A' }}>
                                {project.name}
                            </h2>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748B' }}>
                            ID: {project.id?.substring(0, 8)}... • Created: {formatDate(project.created_at || Date.now())}
                        </p>

                        {/* WBS Progress Bar (Senior PM Review Item) */}
                        {tasks.length > 0 && (
                            <div style={{ marginTop: '0.75rem', width: '200px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', fontWeight: 700, color: '#64748B', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                                    <span>Task Completion</span>
                                    <span>{tasks.filter(t => t.status === 'done').length} / {tasks.length}</span>
                                </div>
                                <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100)}%`,
                                        height: '100%',
                                        background: '#10B981',
                                        borderRadius: '3px',
                                        transition: 'width 0.4s ease-out'
                                    }}></div>
                                </div>
                            </div>
                        )}

                        {renderWorkflowButtons()}
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: '#F1F5F9',
                            border: 'none',
                            borderRadius: '8px',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '1.25rem',
                            color: '#64748B'
                        }}
                    >×</button>
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    gap: '0.25rem',
                    padding: '0 2rem',
                    background: '#F8FAFC',
                    borderBottom: '1px solid #E2E8F0'
                }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '1rem 1.25rem',
                                background: activeTab === tab.id ? 'white' : 'transparent',
                                border: 'none',
                                borderBottom: activeTab === tab.id ? '2px solid #2563EB' : '2px solid transparent',
                                marginBottom: '-1px',
                                fontSize: '0.875rem',
                                fontWeight: activeTab === tab.id ? 600 : 500,
                                color: activeTab === tab.id ? '#0F172A' : '#64748B',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem 2rem' }}>
                    {activeTab === 'tasks' && (
                        <ProjectTasksTab
                            projectId={project.id}
                            onTasksUpdate={(updatedTasks) => setTasks(updatedTasks)}
                        />
                    )}
                    {activeTab === 'overview' && (
                        <div>
                            {/* Status Cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                                <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '1.25rem' }}>
                                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Workflow Status</div>
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        background: statusColors.bg,
                                        color: statusColors.text,
                                        padding: '0.375rem 0.75rem',
                                        borderRadius: '6px',
                                        fontSize: '0.875rem',
                                        fontWeight: 600
                                    }}>{project.workflow_status || 'Draft'}</span>
                                </div>

                                {/* Editable % Complete - US-11.3 */}
                                <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '1.25rem' }}>
                                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.5rem' }}>% Complete</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={editableProject.percent_complete}
                                            onChange={(e) => handleFieldChange('percent_complete', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                            disabled={!can('edit_project_registry')}
                                            style={{
                                                width: '60px',
                                                fontSize: '1.25rem',
                                                fontWeight: 700,
                                                color: '#0F172A',
                                                border: '1px solid #E2E8F0',
                                                borderRadius: '6px',
                                                padding: '0.25rem 0.5rem',
                                                textAlign: 'center'
                                            }}
                                        />
                                        <span style={{ fontSize: '1rem', fontWeight: 600, color: '#64748B' }}>%</span>
                                        <div style={{ flex: 1, height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ width: `${editableProject.percent_complete}%`, height: '100%', background: '#3B82F6', borderRadius: '4px', transition: 'width 0.2s' }}></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Priority Level - Editable */}
                                <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '1.25rem' }}>
                                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Priority Level</div>
                                    <select
                                        value={editableProject.priority}
                                        onChange={(e) => handleFieldChange('priority', e.target.value)}
                                        disabled={!can('edit_project_registry')}
                                        style={{
                                            width: '100%',
                                            fontSize: '0.9375rem',
                                            fontWeight: 600,
                                            color: getPriorityColor(editableProject.priority).text,
                                            background: getPriorityColor(editableProject.priority).bg,
                                            border: '1px solid #E2E8F0',
                                            borderRadius: '6px',
                                            padding: '0.5rem 0.75rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="P1-Critical">P1 - Critical</option>
                                        <option value="P2-Strategic">P2 - Strategic</option>
                                        <option value="P3-Standard">P3 - Standard</option>
                                        <option value="P4-Low">P4 - Low</option>
                                    </select>
                                </div>
                            </div>

                            {/* WBS Summary (Visual Dashboard) */}
                            <div style={{ marginBottom: '2rem' }}>
                                <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0F172A', marginBottom: '1rem' }}>WBS Summary</h4>
                                <div style={{
                                    background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                                    borderRadius: '16px',
                                    padding: '1.5rem',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '2rem',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                }}>
                                    {/* Progress Ring */}
                                    <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                                        <svg width="100" height="100" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="40" fill="none" stroke="#334155" strokeWidth="8" />
                                            <circle
                                                cx="50" cy="50" r="40"
                                                fill="none"
                                                stroke="#3B82F6"
                                                strokeWidth="8"
                                                strokeDasharray={`${2 * Math.PI * 40}`}
                                                strokeDashoffset={`${2 * Math.PI * 40 * (1 - (tasks.length > 0 ? tasks.filter(t => t.status === 'done').length / tasks.length : 0))}`}
                                                transform="rotate(-90 50 50)"
                                                style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                                            />
                                        </svg>
                                        <div style={{
                                            position: 'absolute', inset: 0,
                                            display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                                                {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0}%
                                            </span>
                                            <span style={{ fontSize: '0.625rem', textTransform: 'uppercase', opacity: 0.7 }}>Complete</span>
                                        </div>
                                    </div>

                                    {/* Task Stats */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '8px' }}>
                                                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{tasks.filter(t => t.status === 'todo').length}</div>
                                                <div style={{ fontSize: '0.625rem', textTransform: 'uppercase', opacity: 0.7 }}>To Do</div>
                                            </div>
                                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '8px' }}>
                                                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{tasks.filter(t => t.status === 'in_progress').length}</div>
                                                <div style={{ fontSize: '0.625rem', textTransform: 'uppercase', opacity: 0.7 }}>In Progress</div>
                                            </div>
                                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '8px' }}>
                                                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{tasks.filter(t => t.status === 'blocked').length}</div>
                                                <div style={{ fontSize: '0.625rem', textTransform: 'uppercase', opacity: 0.7 }}>Blocked</div>
                                            </div>
                                        </div>


                                    </div>

                                    {/* Vertical Divider */}
                                    <div style={{ width: '1px', height: '80px', background: 'rgba(255,255,255,0.2)' }}></div>

                                    {/* Critical Tasks */}
                                    <div style={{ width: '250px' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem', opacity: 0.8 }}>Critical Tasks</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {tasks
                                                .filter(t => t.status !== 'done')
                                                .sort((a, b) => (b.priority || 0) - (a.priority || 0))
                                                .slice(0, 3)
                                                .map(task => (
                                                    <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
                                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: task.status === 'blocked' ? '#EF4444' : '#F59E0B' }}></div>
                                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{task.title}</span>
                                                    </div>
                                                ))}
                                            {tasks.filter(t => t.status !== 'done').length === 0 && (
                                                <div style={{ fontSize: '0.8125rem', opacity: 0.5, fontStyle: 'italic' }}>No active tasks</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>


                            <div style={{ marginBottom: '2rem' }}>
                                <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0F172A', marginBottom: '1rem' }}>Project Details</h4>
                                <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '1.25rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        {/* US-11.1: Project Owner Dropdown */}
                                        <div>
                                            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Project Owner</div>
                                            <select
                                                value={editableProject.owner_id}
                                                onChange={(e) => handleFieldChange('owner_id', e.target.value || null)}
                                                style={{
                                                    width: '100%',
                                                    fontSize: '0.9375rem',
                                                    color: '#0F172A',
                                                    fontWeight: 500,
                                                    border: '1px solid #E2E8F0',
                                                    borderRadius: '6px',
                                                    padding: '0.375rem 0.5rem',
                                                    background: 'white'
                                                }}
                                            >
                                                <option value="">Select Owner...</option>
                                                {engineers.map(eng => (
                                                    <option key={eng.id} value={eng.id}>{eng.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        {/* US-11.1: Project Manager Dropdown (filtered to PM role) */}
                                        <div>
                                            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Project Manager</div>
                                            <select
                                                value={editableProject.manager_id}
                                                onChange={(e) => handleFieldChange('manager_id', e.target.value || null)}
                                                style={{
                                                    width: '100%',
                                                    fontSize: '0.9375rem',
                                                    color: '#0F172A',
                                                    fontWeight: 500,
                                                    border: '1px solid #E2E8F0',
                                                    borderRadius: '6px',
                                                    padding: '0.375rem 0.5rem',
                                                    background: 'white'
                                                }}
                                            >
                                                <option value="">Select PM...</option>
                                                {engineers
                                                    .filter(eng => eng.role === 'Project Manager' || !eng.role)
                                                    .map(eng => (
                                                        <option key={eng.id} value={eng.id}>{eng.name}</option>
                                                    ))}
                                            </select>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Project Type</div>
                                            <div style={{ fontSize: '0.9375rem', color: '#0F172A', fontWeight: 500 }}>{project.project_type || 'Infrastructure'}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Size Estimate</div>
                                            <div style={{ fontSize: '0.9375rem', color: '#0F172A', fontWeight: 500 }}>{project.size || 'Medium'}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Start Date</div>
                                            <input
                                                type="date"
                                                value={editableProject.start_date}
                                                onChange={(e) => handleFieldChange('start_date', e.target.value)}
                                                style={{
                                                    fontSize: '0.9375rem',
                                                    color: '#0F172A',
                                                    fontWeight: 500,
                                                    border: '1px solid #E2E8F0',
                                                    borderRadius: '6px',
                                                    padding: '0.375rem 0.5rem',
                                                    background: 'white'
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Target End Date</div>
                                            <input
                                                type="date"
                                                value={editableProject.target_end_date}
                                                onChange={(e) => handleFieldChange('target_end_date', e.target.value)}
                                                min={editableProject.start_date}
                                                style={{
                                                    fontSize: '0.9375rem',
                                                    color: '#0F172A',
                                                    fontWeight: 500,
                                                    border: '1px solid #E2E8F0',
                                                    borderRadius: '6px',
                                                    padding: '0.375rem 0.5rem',
                                                    background: 'white'
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Project Team Section (US-2.5) */}
                            <div style={{ marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0F172A', margin: 0 }}>Project Team</h4>
                                    <button
                                        onClick={() => setShowAddMemberForm(true)}
                                        disabled={!can('edit_project_registry')}
                                        style={{
                                            background: '#F1F5F9',
                                            color: '#475569',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '0.375rem 0.75rem',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >+ Add Member</button>
                                </div>

                                {showAddMemberForm && (
                                    <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                        <select
                                            value={newMember.engineer_id}
                                            onChange={(e) => setNewMember({ ...newMember, engineer_id: e.target.value })}
                                            style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.875rem' }}
                                        >
                                            <option value="">Select Engineer...</option>
                                            {engineers.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                        </select>
                                        <input
                                            type="text"
                                            placeholder="Role (e.g. Tech Lead)"
                                            value={newMember.role}
                                            onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                                            style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.875rem' }}
                                        />
                                        <button onClick={handleAddMember} style={{ background: '#2563EB', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>Save</button>
                                        <button onClick={() => setShowAddMemberForm(false)} style={{ background: 'transparent', color: '#64748B', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}>&times;</button>
                                    </div>
                                )}

                                {projectMembers.length === 0 ? (
                                    <div style={{ fontSize: '0.875rem', color: '#94A3B8', fontStyle: 'italic' }}>No additional team members assigned.</div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                                        {projectMembers.map(member => (
                                            <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.75rem' }}>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.875rem' }}>{member.engineer?.name || 'Unknown'}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{member.role}</div>
                                                </div>
                                                {can('edit_project_registry') && (
                                                    <button
                                                        onClick={() => handleRemoveMember(member.id)}
                                                        style={{ color: '#EF4444', background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.6 }}
                                                        title="Remove"
                                                    >&times;</button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Project Status Update - Epic 11 Enhancement */}
                            <div style={{ marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0F172A', margin: 0 }}>Project Status Update</h4>
                                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                                        Last updated: {project.status_updated_at ? formatDate(project.status_updated_at) : 'Never'}
                                    </span>
                                </div>
                                <textarea
                                    value={editableProject.latest_status_update || ''}
                                    onChange={(e) => handleFieldChange('latest_status_update', e.target.value)}
                                    placeholder="Enter the latest project status update (will appear on the dashboard)..."
                                    style={{
                                        width: '100%',
                                        minHeight: '100px',
                                        padding: '1rem',
                                        border: '1px solid #E2E8F0',
                                        borderRadius: '12px',
                                        fontSize: '0.9375rem',
                                        color: '#374151',
                                        lineHeight: 1.6,
                                        resize: 'vertical',
                                        fontFamily: 'inherit',
                                        background: '#F0F9FF',
                                        borderLeft: '4px solid #3B82F6'
                                    }}
                                />
                            </div>

                            {/* Project Number - New Field */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
                                    Project Number
                                </label>
                                <input
                                    type="text"
                                    value={editableProject.project_number}
                                    onChange={(e) => handleFieldChange('project_number', e.target.value)}
                                    placeholder="e.g. PRJ-2024-001"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #E2E8F0',
                                        borderRadius: '8px',
                                        fontSize: '0.9375rem',
                                        color: '#0F172A'
                                    }}
                                />
                            </div>

                            {/* Project Site - New Field */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
                                    Project Site
                                </label>
                                <input
                                    type="text"
                                    value={editableProject.project_site}
                                    onChange={(e) => handleFieldChange('project_site', e.target.value)}
                                    placeholder="e.g. https://confluence.example.com/project"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #E2E8F0',
                                        borderRadius: '8px',
                                        fontSize: '0.9375rem',
                                        color: '#0F172A'
                                    }}
                                />
                            </div>

                            {/* Section: Fiscal Planning & Device Volume (Epic 13, US-13.4, US-13.5) */}
                            <div style={{ marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0F172A', margin: 0 }}>Fiscal Year & Project Hardware</h4>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <select
                                            value={editableProject.fiscal_year}
                                            onChange={(e) => handleFieldChange('fiscal_year', e.target.value)}
                                            style={{
                                                padding: '0.375rem 0.75rem',
                                                border: '1px solid #E2E8F0',
                                                borderRadius: '6px',
                                                fontSize: '0.875rem',
                                                color: '#0F172A',
                                                background: 'white',
                                                fontWeight: 500
                                            }}
                                        >
                                            <option value="">FY...</option>
                                            <option value="FY24">FY24</option>
                                            <option value="FY25">FY25</option>
                                            <option value="FY26">FY26</option>
                                            <option value="FY27">FY27</option>
                                        </select>
                                        <button
                                            onClick={() => setShowAddDeviceForm(true)}
                                            style={{
                                                background: '#2563EB',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                padding: '0.375rem 0.75rem',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                cursor: 'pointer'
                                            }}>+ Add Device</button>
                                    </div>
                                </div>

                                {/* Add Device Form */}
                                {showAddDeviceForm && (
                                    <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem' }}>
                                                <select
                                                    value={newDevice.device_type}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setNewDevice({ ...newDevice, device_type: val });
                                                        if (val !== 'Other (User Input)') setCustomDeviceType('');
                                                    }}
                                                    style={{ padding: '0.5rem', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '0.875rem', background: 'white' }}
                                                >
                                                    <option value="">Select Device Type...</option>
                                                    {devicePresets.map(preset => (
                                                        <option key={preset} value={preset}>{preset}</option>
                                                    ))}
                                                </select>
                                                <input
                                                    type="number"
                                                    placeholder="Current Qty"
                                                    value={newDevice.current_qty}
                                                    onChange={(e) => setNewDevice({ ...newDevice, current_qty: parseInt(e.target.value) || 0 })}
                                                    style={{ padding: '0.5rem', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '0.875rem' }}
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="Proposed Qty"
                                                    value={newDevice.proposed_qty}
                                                    onChange={(e) => setNewDevice({ ...newDevice, proposed_qty: parseInt(e.target.value) || 0 })}
                                                    style={{ padding: '0.5rem', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '0.875rem' }}
                                                />
                                            </div>

                                            {newDevice.device_type === 'Other (User Input)' && (
                                                <input
                                                    type="text"
                                                    placeholder="Specify Unique Project Hardware Type..."
                                                    value={customDeviceType}
                                                    onChange={(e) => setCustomDeviceType(e.target.value)}
                                                    style={{ padding: '0.5rem', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '0.875rem' }}
                                                />
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={async () => {
                                                    if (!newDevice.device_type || !newDevice.proposed_qty) return;
                                                    const deviceTypeToSave = newDevice.device_type === 'Other (User Input)' ? customDeviceType : newDevice.device_type;
                                                    if (!deviceTypeToSave) return;

                                                    try {
                                                        const token = localStorage.getItem('token');
                                                        const res = await fetch(`${API_BASE}/api/projects/${project.id}/devices`, {
                                                            method: 'POST',
                                                            headers: {
                                                                'Content-Type': 'application/json',
                                                                'Authorization': `Bearer ${token}`
                                                            },
                                                            body: JSON.stringify({ ...newDevice, device_type: deviceTypeToSave })
                                                        });
                                                        if (res.ok) {
                                                            const saved = await res.json();
                                                            setDevices([...devices, saved]);
                                                            setNewDevice({ device_type: '', current_qty: 0, proposed_qty: 0 });
                                                            setShowAddDeviceForm(false);
                                                        }
                                                    } catch (error) {
                                                        console.error('Failed to add device:', error);
                                                    }
                                                }}
                                                style={{ background: '#10B981', color: 'white', border: 'none', borderRadius: '6px', padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                                            >Save</button>
                                            <button
                                                onClick={() => setShowAddDeviceForm(false)}
                                                style={{ background: '#E2E8F0', color: '#475569', border: 'none', borderRadius: '6px', padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                                            >Cancel</button>
                                        </div>
                                    </div>
                                )}

                                {/* Device Volume Table */}
                                {devices.length === 0 ? (
                                    <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', color: '#64748B', fontSize: '0.875rem' }}>
                                        No device volumes defined yet. Click "+ Add Device" to define hardware scope.
                                    </div>
                                ) : (
                                    <div style={{ background: '#F8FAFC', borderRadius: '12px', overflow: 'hidden' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                            <thead>
                                                <tr style={{ background: '#E2E8F0' }}>
                                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Device Type</th>
                                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Current</th>
                                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Proposed</th>
                                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Net Change</th>
                                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600, color: '#475569', width: '60px' }}></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {devices.map(dev => {
                                                    const netChange = dev.proposed_qty - dev.current_qty;
                                                    return (
                                                        <tr key={dev.id} style={{ borderTop: '1px solid #E2E8F0' }}>
                                                            <td style={{ padding: '0.75rem 1rem', color: '#0F172A', fontWeight: 500 }}>{dev.device_type}</td>
                                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#64748B' }}>{dev.current_qty}</td>
                                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#0F172A', fontWeight: 600 }}>{dev.proposed_qty}</td>
                                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: netChange > 0 ? '#10B981' : netChange < 0 ? '#EF4444' : '#64748B' }}>
                                                                {netChange > 0 ? '+' : ''}{netChange}
                                                            </td>
                                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                                                <button
                                                                    onClick={async () => {
                                                                        try {
                                                                            const token = localStorage.getItem('token');
                                                                            await fetch(`${API_BASE}/api/devices/${dev.id}`, {
                                                                                method: 'DELETE',
                                                                                headers: { 'Authorization': `Bearer ${token}` }
                                                                            });
                                                                            setDevices(devices.filter(d => d.id !== dev.id));
                                                                        } catch (error) {
                                                                            console.error('Failed to delete device:', error);
                                                                        }
                                                                    }}
                                                                    style={{ background: 'transparent', border: 'none', color: '#EF4444', fontSize: '0.75rem', cursor: 'pointer' }}
                                                                >Remove</button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                {/* Totals Row */}
                                                <tr style={{ borderTop: '2px solid #CBD5E1', background: '#F1F5F9' }}>
                                                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0F172A' }}>TOTAL</td>
                                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#64748B' }}>
                                                        {devices.reduce((sum, d) => sum + d.current_qty, 0)}
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: '#0F172A' }}>
                                                        {devices.reduce((sum, d) => sum + d.proposed_qty, 0)}
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: devices.reduce((sum, d) => sum + (d.proposed_qty - d.current_qty), 0) > 0 ? '#10B981' : '#EF4444' }}>
                                                        {(() => {
                                                            const total = devices.reduce((sum, d) => sum + (d.proposed_qty - d.current_qty), 0);
                                                            return `${total > 0 ? '+' : ''}${total}`;
                                                        })()}
                                                    </td>
                                                    <td></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Resourcing Requirements Section - US-RS.1 */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0F172A', margin: 0 }}>Resourcing Requirements</h4>
                                    {project.workflow_status === 'Draft' && (
                                        <button
                                            onClick={() => setShowAddRequirementForm(true)}
                                            style={{
                                                background: '#2563EB',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                padding: '0.375rem 0.75rem',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                cursor: 'pointer'
                                            }}>+ Add Requirement</button>
                                    )}
                                </div>

                                {showAddRequirementForm && (
                                    <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                            <input
                                                type="text"
                                                placeholder="Role needed (e.g., Network Engineer)"
                                                value={newRequirement.role}
                                                onChange={(e) => setNewRequirement({ ...newRequirement, role: e.target.value })}
                                                style={{ padding: '0.5rem', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '0.875rem' }}
                                            />
                                            <input
                                                type="number"
                                                placeholder="Hrs/week"
                                                value={newRequirement.hours_per_week}
                                                onChange={(e) => setNewRequirement({ ...newRequirement, hours_per_week: parseInt(e.target.value) || 0 })}
                                                style={{ padding: '0.5rem', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '0.875rem' }}
                                            />
                                            <input
                                                type="number"
                                                placeholder="Duration (wks)"
                                                value={newRequirement.duration_weeks}
                                                onChange={(e) => setNewRequirement({ ...newRequirement, duration_weeks: e.target.value })}
                                                style={{ padding: '0.5rem', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '0.875rem' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={async () => {
                                                    if (!newRequirement.role || !newRequirement.hours_per_week) return;
                                                    try {
                                                        const token = localStorage.getItem('token');
                                                        const res = await fetch(`${API_BASE}/api/projects/${project.id}/requirements`, {
                                                            method: 'POST',
                                                            headers: {
                                                                'Content-Type': 'application/json',
                                                                'Authorization': `Bearer ${token}`
                                                            },
                                                            body: JSON.stringify({
                                                                role: newRequirement.role,
                                                                hours_per_week: newRequirement.hours_per_week,
                                                                duration_weeks: newRequirement.duration_weeks ? parseInt(newRequirement.duration_weeks) : null
                                                            })
                                                        });
                                                        if (res.ok) {
                                                            const saved = await res.json();
                                                            setRequirements([...requirements, saved]);
                                                            setNewRequirement({ role: '', hours_per_week: 8, duration_weeks: '' });
                                                            setShowAddRequirementForm(false);
                                                        }
                                                    } catch (error) {
                                                        console.error('Failed to add requirement:', error);
                                                    }
                                                }}
                                                style={{ background: '#10B981', color: 'white', border: 'none', borderRadius: '6px', padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                                            >Save</button>
                                            <button
                                                onClick={() => setShowAddRequirementForm(false)}
                                                style={{ background: '#E2E8F0', color: '#475569', border: 'none', borderRadius: '6px', padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                                            >Cancel</button>
                                        </div>
                                    </div>
                                )}

                                {requirements.length === 0 ? (
                                    <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', color: '#64748B', fontSize: '0.875rem' }}>
                                        No resourcing requirements defined yet.
                                        {project.workflow_status === 'Draft' && ' Click "+ Add Requirement" to define staffing needs.'}
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {requirements.map(req => (
                                            <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', borderRadius: '8px', padding: '0.75rem 1rem' }}>
                                                <div>
                                                    <span style={{ fontWeight: 600, color: '#0F172A' }}>{req.role}</span>
                                                    <span style={{ color: '#64748B', marginLeft: '0.5rem', fontSize: '0.875rem' }}>
                                                        {req.hours_per_week}h/wk{req.duration_weeks && ` • ${req.duration_weeks} weeks`}
                                                    </span>
                                                </div>
                                                {project.workflow_status === 'Draft' && (
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                const token = localStorage.getItem('token');
                                                                const res = await fetch(`${API_BASE}/api/requirements/${req.id}`, {
                                                                    method: 'DELETE',
                                                                    headers: { 'Authorization': `Bearer ${token}` }
                                                                });
                                                                if (res.ok) {
                                                                    setRequirements(requirements.filter(r => r.id !== req.id));
                                                                }
                                                            } catch (error) {
                                                                console.error('Failed to delete requirement:', error);
                                                            }
                                                        }}
                                                        style={{ background: 'transparent', border: 'none', color: '#EF4444', fontSize: '0.75rem', cursor: 'pointer' }}
                                                    >Remove</button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Editable Business Justification - US-11.5 */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0F172A', margin: 0 }}>Project Description</h4>
                                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                                        {editableProject.business_justification.length}/2000 chars
                                    </span>
                                </div>
                                <textarea
                                    value={editableProject.business_justification}
                                    onChange={(e) => handleFieldChange('business_justification', e.target.value.substring(0, 2000))}
                                    placeholder="Describe the business value and expected outcomes..."
                                    style={{
                                        width: '100%',
                                        minHeight: '120px',
                                        padding: '1rem',
                                        border: '1px solid #E2E8F0',
                                        borderRadius: '12px',
                                        fontSize: '0.9375rem',
                                        color: '#374151',
                                        lineHeight: 1.6,
                                        resize: 'vertical',
                                        fontFamily: 'inherit'
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'rid' && (
                        <div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '2rem' }}>
                                {/* Clickable RAG Health - US-11.2 */}
                                <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '1.25rem', position: 'relative' }}>
                                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Current RAG Health</div>
                                    <button
                                        onClick={() => setShowRagDropdown(!showRagDropdown)}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.375rem',
                                            background: ragColors.bg,
                                            color: ragColors.text,
                                            padding: '0.5rem 1rem',
                                            borderRadius: '8px',
                                            fontSize: '0.9375rem',
                                            fontWeight: 700,
                                            border: '2px dashed transparent',
                                            cursor: 'pointer',
                                            transition: 'border-color 0.15s',
                                            width: '100%',
                                            justifyContent: 'center'
                                        }}
                                        onMouseOver={(e) => e.target.style.borderColor = ragColors.dot}
                                        onMouseOut={(e) => e.target.style.borderColor = 'transparent'}
                                    >
                                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: ragColors.dot }}></span>
                                        {editableProject.rag_status}
                                        <span style={{ marginLeft: 'auto', opacity: 0.6 }}>▼</span>
                                    </button>

                                    {showRagDropdown && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: '1.25rem',
                                            right: '1.25rem',
                                            background: 'white',
                                            border: '1px solid #E2E8F0',
                                            borderRadius: '8px',
                                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                                            zIndex: 100,
                                            overflow: 'hidden'
                                        }}>
                                            {['Green', 'Amber', 'Red', 'Issue'].map(status => {
                                                const colors = getRagColor(status);
                                                return (
                                                    <button
                                                        key={status}
                                                        onClick={() => handleRagStatusChange(status)}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.5rem',
                                                            width: '100%',
                                                            padding: '0.75rem 1rem',
                                                            border: 'none',
                                                            background: editableProject.rag_status === status ? '#F1F5F9' : 'white',
                                                            cursor: 'pointer',
                                                            textAlign: 'left',
                                                            fontSize: '0.875rem'
                                                        }}
                                                    >
                                                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: colors.dot }}></span>
                                                        {status}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* RAG Reason Field - US-11.2 (only shows for Red/Issue) */}
                                <div style={{
                                    opacity: (editableProject.rag_status === 'Red' || editableProject.rag_status === 'Issue') ? 1 : 0.5,
                                    pointerEvents: (editableProject.rag_status === 'Red' || editableProject.rag_status === 'Issue') ? 'auto' : 'none'
                                }}>
                                    <div style={{
                                        background: editableProject.rag_status === 'Red' ? '#FEF2F2' : '#F8FAFC',
                                        border: `1px solid ${editableProject.rag_status === 'Red' ? '#FECACA' : '#E2E8F0'}`,
                                        borderRadius: '12px',
                                        padding: '1.25rem'
                                    }}>
                                        <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                            Health Status Reason
                                        </div>
                                        <textarea
                                            value={editableProject.rag_reason}
                                            onChange={(e) => handleFieldChange('rag_reason', e.target.value)}
                                            placeholder={(editableProject.rag_status === 'Red' || editableProject.rag_status === 'Issue')
                                                ? "Please provide a reason for the Red or Issue status..."
                                                : "Reason not required for Green/Amber status."}
                                            disabled={editableProject.rag_status !== 'Red' && editableProject.rag_status !== 'Issue'}
                                            style={{
                                                width: '100%',
                                                minHeight: '44px',
                                                padding: '0.5rem 0.75rem',
                                                border: '1px solid #E2E8F0',
                                                borderRadius: '8px',
                                                fontSize: '0.875rem',
                                                fontFamily: 'inherit',
                                                resize: 'vertical',
                                                background: (editableProject.rag_status !== 'Red' && editableProject.rag_status !== 'Issue') ? '#F1F5F9' : 'white'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: '#0F172A' }}>Risk, Issue & Decision Log</h4>
                                <button
                                    onClick={() => setShowAddRidForm(true)}
                                    disabled={!can('edit_project_registry')}
                                    style={{
                                        background: '#2563EB',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '0.5rem 1rem',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.375rem'
                                    }}>
                                    <span>+</span> Add Entry
                                </button>
                            </div>

                            {/* Add RID Form - US-11.7 */}
                            {showAddRidForm && (
                                <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>Type</label>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                {['Risk', 'Issue', 'Decision'].map(type => (
                                                    <button
                                                        key={type}
                                                        onClick={() => setNewRidEntry({ ...newRidEntry, type })}
                                                        style={{
                                                            padding: '0.375rem 0.75rem',
                                                            borderRadius: '6px',
                                                            border: newRidEntry.type === type ? 'none' : '1px solid #E2E8F0',
                                                            background: newRidEntry.type === type ? (type === 'Risk' ? '#FEF3C7' : type === 'Issue' ? '#FEE2E2' : '#DBEAFE') : 'white',
                                                            color: newRidEntry.type === type ? (type === 'Risk' ? '#D97706' : type === 'Issue' ? '#DC2626' : '#2563EB') : '#64748B',
                                                            fontSize: '0.8125rem',
                                                            fontWeight: 600,
                                                            cursor: 'pointer'
                                                        }}
                                                    >{type}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>Severity</label>
                                            <select
                                                value={newRidEntry.severity}
                                                onChange={(e) => setNewRidEntry({ ...newRidEntry, severity: e.target.value })}
                                                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}
                                            >
                                                <option value="Low">Low</option>
                                                <option value="Medium">Medium</option>
                                                <option value="High">High</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>Description (min 10 chars)</label>
                                        <textarea
                                            value={newRidEntry.description}
                                            onChange={(e) => setNewRidEntry({ ...newRidEntry, description: e.target.value })}
                                            placeholder="Describe the risk, issue, or decision..."
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #E2E8F0', minHeight: '60px' }}
                                        />
                                    </div>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>Owner</label>
                                        <input
                                            type="text"
                                            value={newRidEntry.owner}
                                            onChange={(e) => setNewRidEntry({ ...newRidEntry, owner: e.target.value })}
                                            placeholder="Enter owner name"
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <button onClick={() => setShowAddRidForm(false)} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer' }}>Cancel</button>
                                        <button
                                            onClick={handleAddRidEntry}
                                            disabled={newRidEntry.description.length < 10}
                                            style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: newRidEntry.description.length >= 10 ? '#2563EB' : '#CBD5E1', color: 'white', cursor: newRidEntry.description.length >= 10 ? 'pointer' : 'not-allowed' }}
                                        >Add Entry</button>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {ridEntries.map((entry) => (
                                    <div key={entry.id} style={{
                                        background: 'white',
                                        border: '1px solid #E2E8F0',
                                        borderRadius: '12px',
                                        padding: '1rem 1.25rem',
                                        borderLeft: `4px solid ${entry.type === 'Risk' ? '#F59E0B' : entry.type === 'Issue' ? '#EF4444' : '#3B82F6'}`,
                                        position: 'relative'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <span style={{
                                                    background: entry.type === 'Risk' ? '#FEF3C7' : entry.type === 'Issue' ? '#FEE2E2' : '#DBEAFE',
                                                    color: entry.type === 'Risk' ? '#D97706' : entry.type === 'Issue' ? '#DC2626' : '#2563EB',
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '4px',
                                                    fontSize: '0.6875rem',
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase'
                                                }}>{entry.type}</span>
                                                <span style={{
                                                    background: entry.severity === 'High' ? '#FEE2E2' : entry.severity === 'Medium' ? '#FEF3C7' : '#F1F5F9',
                                                    color: entry.severity === 'High' ? '#DC2626' : entry.severity === 'Medium' ? '#D97706' : '#64748B',
                                                    padding: '0.125rem 0.375rem',
                                                    borderRadius: '4px',
                                                    fontSize: '0.625rem',
                                                    fontWeight: 600
                                                }}>{entry.severity}</span>
                                                {entry.previousType && (
                                                    <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontStyle: 'italic' }}>
                                                        Previously: {entry.previousType}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{
                                                    background: entry.status === 'Open' ? '#FEF3C7' : '#DCFCE7',
                                                    color: entry.status === 'Open' ? '#D97706' : '#15803D',
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '4px',
                                                    fontSize: '0.6875rem',
                                                    fontWeight: 600
                                                }}>{entry.status}</span>

                                                {/* Overflow Menu - US-11.6 */}
                                                <div style={{ position: 'relative' }}>
                                                    <button
                                                        onClick={() => setRidMenuOpen(ridMenuOpen === entry.id ? null : entry.id)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', fontSize: '1rem', color: '#64748B' }}
                                                    >⋮</button>
                                                    {ridMenuOpen === entry.id && (
                                                        <div style={{
                                                            position: 'absolute',
                                                            top: '100%',
                                                            right: 0,
                                                            background: 'white',
                                                            border: '1px solid #E2E8F0',
                                                            borderRadius: '8px',
                                                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                                                            zIndex: 100,
                                                            minWidth: '160px',
                                                            overflow: 'hidden'
                                                        }}>
                                                            {entry.type === 'Risk' && (
                                                                <button onClick={() => handlePromoteRid(entry.id, 'Issue')} style={{ display: 'block', width: '100%', padding: '0.625rem 1rem', border: 'none', background: 'white', cursor: 'pointer', textAlign: 'left', fontSize: '0.875rem' }}>
                                                                    Promote to Issue
                                                                </button>
                                                            )}
                                                            {entry.type === 'Issue' && (
                                                                <button onClick={() => handlePromoteRid(entry.id, 'Decision')} style={{ display: 'block', width: '100%', padding: '0.625rem 1rem', border: 'none', background: 'white', cursor: 'pointer', textAlign: 'left', fontSize: '0.875rem' }}>
                                                                    Promote to Decision
                                                                </button>
                                                            )}
                                                            <button onClick={() => handleDeleteRid(entry.id)} style={{ display: 'block', width: '100%', padding: '0.625rem 1rem', border: 'none', background: 'white', cursor: 'pointer', textAlign: 'left', fontSize: '0.875rem', color: '#DC2626' }}>
                                                                Delete Entry
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9375rem', color: '#0F172A' }}>{entry.description}</p>
                                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#64748B' }}>
                                            <span>Owner: <strong>{entry.owner}</strong></span>
                                            <span>•</span>
                                            <span>{entry.date}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'schedule' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: '#0F172A' }}>Resource Allocations</h4>
                                <button
                                    onClick={() => setShowAddResourceForm(true)}
                                    disabled={!can('allocate_resources')}
                                    style={{
                                        background: '#2563EB',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '0.5rem 1rem',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        cursor: 'pointer'
                                    }}>
                                    + Add Resource
                                </button>
                            </div>

                            {/* Timeline */}
                            <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                                <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Project Timeline</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ background: '#E2E8F0', borderRadius: '8px', height: '24px', position: 'relative', overflow: 'hidden' }}>
                                            <div style={{ background: 'linear-gradient(90deg, #3B82F6, #60A5FA)', height: '100%', width: `${editableProject.percent_complete}%`, borderRadius: '8px' }}></div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: '#64748B' }}>
                                            <span>{editableProject.start_date || 'Start TBD'}</span>
                                            <span style={{ fontWeight: 600, color: '#0F172A' }}>{editableProject.percent_complete}% Complete</span>
                                            <span>{editableProject.target_end_date || 'End TBD'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Add Resource Form - US-11.8 */}
                            {showAddResourceForm && (
                                <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 0.8fr', gap: '0.75rem', marginBottom: '1rem' }}>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>Engineer</label>
                                            <select
                                                value={newAllocation.engineer_id}
                                                onChange={(e) => setNewAllocation({ ...newAllocation, engineer_id: e.target.value })}
                                                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.875rem' }}
                                            >
                                                <option value="">Select Engineer...</option>
                                                {engineers.map(eng => (
                                                    <option key={eng.id} value={eng.id}>
                                                        {eng.name} ({eng.effective_capacity || eng.total_capacity - eng.ktlo_tax}h avail)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>Role</label>
                                            <input
                                                type="text"
                                                value={newAllocation.role}
                                                onChange={(e) => setNewAllocation({ ...newAllocation, role: e.target.value })}
                                                placeholder="e.g. Network Engineer"
                                                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.875rem' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>Category</label>
                                            <select
                                                value={newAllocation.category}
                                                onChange={(e) => setNewAllocation({ ...newAllocation, category: e.target.value })}
                                                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.875rem' }}
                                            >
                                                <option value="Project Work">Project Work</option>
                                                <option value="Operational Support">Operational Support</option>
                                                <option value="Meetings">Meetings</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>Day</label>
                                            <select
                                                value={newAllocation.day}
                                                onChange={(e) => setNewAllocation({ ...newAllocation, day: e.target.value })}
                                                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.875rem' }}
                                            >
                                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
                                                    <option key={day} value={day}>{day}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '0.25rem' }}>Hrs/Wk</label>
                                            <input
                                                type="number"
                                                min="2"
                                                max="40"
                                                step="2"
                                                value={newAllocation.hours}
                                                onChange={(e) => setNewAllocation({ ...newAllocation, hours: e.target.value })}
                                                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.875rem' }}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <button onClick={() => setShowAddResourceForm(false)} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer' }}>Cancel</button>
                                        <button
                                            onClick={handleAddAllocation}
                                            disabled={!newAllocation.engineer_id || !newAllocation.role}
                                            style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: newAllocation.engineer_id && newAllocation.role ? '#2563EB' : '#CBD5E1', color: 'white', cursor: newAllocation.engineer_id && newAllocation.role ? 'pointer' : 'not-allowed' }}
                                        >Add Allocation</button>
                                    </div>
                                </div>
                            )}

                            {/* Allocations Table with inline edit & delete - US-11.9, US-11.10 */}
                            <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: '#F8FAFC' }}>
                                            <th style={{ textAlign: 'left', padding: '0.875rem 1.25rem', fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Engineer</th>
                                            <th style={{ textAlign: 'left', padding: '0.875rem 1.25rem', fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Role</th>
                                            <th style={{ textAlign: 'center', padding: '0.875rem 1.25rem', fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Hours/Week</th>
                                            <th style={{ textAlign: 'center', padding: '0.875rem 1.25rem', fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Status</th>
                                            <th style={{ textAlign: 'center', padding: '0.875rem 1.25rem', fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', width: '60px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allocations.map((alloc) => (
                                            <tr key={alloc.id} style={{ borderTop: '1px solid #E2E8F0' }}>
                                                <td style={{ padding: '0.875rem 1.25rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <span style={{
                                                            width: '32px',
                                                            height: '32px',
                                                            borderRadius: '50%',
                                                            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                                                            color: 'white',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600
                                                        }}>{alloc.initials}</span>
                                                        <span style={{ fontWeight: 500, color: '#0F172A' }}>{alloc.name}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '0.875rem 1.25rem', color: '#374151' }}>{alloc.role}</td>
                                                <td style={{ padding: '0.875rem 1.25rem', textAlign: 'center' }}>
                                                    {editingHours === alloc.id ? (
                                                        <input
                                                            type="number"
                                                            min="2"
                                                            max="40"
                                                            step="2"
                                                            defaultValue={alloc.hours}
                                                            onBlur={(e) => handleUpdateHours(alloc.id, e.target.value)}
                                                            onKeyPress={(e) => e.key === 'Enter' && handleUpdateHours(alloc.id, e.target.value)}
                                                            autoFocus
                                                            style={{ width: '50px', textAlign: 'center', padding: '0.25rem', borderRadius: '4px', border: '2px solid #2563EB' }}
                                                        />
                                                    ) : (
                                                        <span
                                                            onClick={() => setEditingHours(alloc.id)}
                                                            style={{ fontWeight: 600, color: '#0F172A', cursor: 'pointer', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px dashed transparent' }}
                                                            onMouseOver={(e) => e.target.style.borderColor = '#CBD5E1'}
                                                            onMouseOut={(e) => e.target.style.borderColor = 'transparent'}
                                                        >{alloc.hours}h</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '0.875rem 1.25rem', textAlign: 'center' }}>
                                                    <span style={{
                                                        background: '#DCFCE7',
                                                        color: '#15803D',
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: '9999px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600
                                                    }}>{alloc.status}</span>
                                                    {alloc.policy_warnings && alloc.policy_warnings.length > 0 && (
                                                        <span
                                                            title={alloc.policy_warnings.join('\n')}
                                                            style={{ marginLeft: '0.5rem', cursor: 'help', fontSize: '1rem' }}
                                                        >
                                                            ⚠️
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '0.875rem 0.5rem', textAlign: 'center' }}>
                                                    {deleteConfirm === alloc.id ? (
                                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                            <button onClick={() => handleRemoveAllocation(alloc.id)} style={{ background: '#DC2626', color: 'white', border: 'none', borderRadius: '4px', padding: '0.25rem 0.5rem', fontSize: '0.6875rem', cursor: 'pointer' }}>Yes</button>
                                                            <button onClick={() => setDeleteConfirm(null)} style={{ background: '#E2E8F0', color: '#374151', border: 'none', borderRadius: '4px', padding: '0.25rem 0.5rem', fontSize: '0.6875rem', cursor: 'pointer' }}>No</button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setDeleteConfirm(alloc.id)}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: '1rem' }}
                                                            title="Remove allocation"
                                                        >✕</button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notes' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: '#0F172A' }}>Project Notes</h4>
                                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{notes.length} note{notes.length !== 1 ? 's' : ''}</span>
                            </div>

                            {/* Add Note Form */}
                            <div style={{ marginBottom: '2rem' }}>
                                <form onSubmit={handleAddNote}>
                                    <textarea
                                        value={newNoteContent}
                                        onChange={(e) => setNewNoteContent(e.target.value)}
                                        placeholder="Add a note about this project..."
                                        style={{
                                            width: '100%',
                                            minHeight: '80px',
                                            padding: '0.75rem',
                                            border: '1px solid #E2E8F0',
                                            borderRadius: '8px',
                                            fontSize: '0.875rem',
                                            marginBottom: '0.75rem',
                                            fontFamily: 'inherit',
                                            resize: 'vertical'
                                        }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <button
                                            type="submit"
                                            disabled={!newNoteContent.trim()}
                                            style={{
                                                background: newNoteContent.trim() ? '#2563EB' : '#94A3B8',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                padding: '0.5rem 1rem',
                                                fontSize: '0.875rem',
                                                fontWeight: 600,
                                                cursor: newNoteContent.trim() ? 'pointer' : 'not-allowed'
                                            }}
                                        >Add Note</button>
                                    </div>
                                </form>
                            </div>

                            {/* Notes List */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {notes.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8', fontStyle: 'italic', background: '#F8FAFC', borderRadius: '8px' }}>
                                        No notes yet. Start the discussion!
                                    </div>
                                ) : (
                                    notes.map(note => (
                                        <div key={note.id} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{
                                                        width: '24px',
                                                        height: '24px',
                                                        borderRadius: '50%',
                                                        background: '#E2E8F0',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        color: '#64748B'
                                                    }}>
                                                        {(note.created_by || 'Unknown').charAt(0)}
                                                    </div>
                                                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>{note.created_by || 'Unknown'}</span>
                                                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>• {new Date(note.created_at).toLocaleString()}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteNote(note.id)}
                                                    style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '1.25rem', padding: '0 0.5rem', opacity: 0.5 }}
                                                    title="Delete note"
                                                    onMouseOver={(e) => e.target.style.opacity = 1}
                                                    onMouseOut={(e) => e.target.style.opacity = 0.5}
                                                >×</button>
                                            </div>
                                            <div style={{ fontSize: '0.9375rem', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                                {note.content}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '1rem 2rem',
                    borderTop: '1px solid #E2E8F0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#F8FAFC'
                }}>
                    <div>
                        {hasChanges && (
                            <span style={{ fontSize: '0.75rem', color: '#D97706', fontWeight: 500 }}>• Unsaved changes</span>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'white',
                                border: '1px solid #E2E8F0',
                                borderRadius: '8px',
                                padding: '0.625rem 1.25rem',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                color: '#374151',
                                cursor: 'pointer'
                            }}
                        >Close</button>
                        <button
                            onClick={handleSaveChanges}
                            disabled={!hasChanges || isSaving}
                            style={{
                                background: hasChanges ? '#0F172A' : '#CBD5E1',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '0.625rem 1.25rem',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                color: 'white',
                                cursor: hasChanges ? 'pointer' : 'not-allowed'
                            }}
                        >{isSaving ? 'Saving...' : 'Save Changes'}</button>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default ProjectDetailModal;
