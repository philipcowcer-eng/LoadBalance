import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Plus, X, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:8001' : '';

const ProjectTasksTab = ({ projectId, onTasksUpdate }) => {
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { can } = useAuth();
    const [isAddingTask, setIsAddingTask] = useState(false);
    const titleInputRef = useRef(null);
    const [newTask, setNewTask] = useState({
        title: '',
        status: 'todo',
        priority: 0,
        start_date: '',
        end_date: '',
        assignee_id: ''
    });

    // Auto-focus when entering add mode
    useEffect(() => {
        if (isAddingTask && titleInputRef.current) {
            titleInputRef.current.focus();
        }
    }, [isAddingTask]);

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('token');
                const [tasksRes, usersRes] = await Promise.all([
                    fetch(`${API_BASE}/api/projects/${projectId}/tasks`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch(`${API_BASE}/api/engineers`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);

                if (tasksRes.ok) {
                    const tasksData = await tasksRes.json();
                    setTasks(tasksData);
                    if (onTasksUpdate) onTasksUpdate(tasksData);
                }
                if (usersRes.ok) {
                    const usersData = await usersRes.json();
                    setUsers(usersData);
                }
            } catch (error) {
                console.error('Failed to load WBS data:', error);
            }
            setIsLoading(false);
        };
        fetchData();
    }, [projectId]);

    // Handlers
    const handleUpdateTask = async (taskId, field, value) => {
        if (!can('edit_project_registry')) return;

        // Optimistic update
        const updatedTasks = tasks.map(t =>
            t.id === taskId ? { ...t, [field]: value } : t
        );
        setTasks(updatedTasks);
        if (onTasksUpdate) onTasksUpdate(updatedTasks);

        try {
            const token = localStorage.getItem('token');
            const payload = { [field]: value === '' ? null : value };

            const response = await fetch(`${API_BASE}/api/projects/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                alert(`Update failed (${response.status}): ${errorText}`);
                // Revert local state
                setTasks(tasks);
            }
        } catch (error) {
            console.error('Failed to update task:', error);
            alert('Failed to update task. Check connection.');
            setTasks(tasks);
        }
    };

    const handleCreateTask = async () => {
        if (!can('edit_project_registry')) return;
        if (!newTask.title.trim()) return;

        // Clean payload: ensure empty strings are sent as null
        const payload = {
            ...newTask,
            start_date: newTask.start_date || null,
            end_date: newTask.end_date || null,
            assignee_id: newTask.assignee_id || null
        };

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/api/projects/${projectId}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const createdTask = await response.json();
                const updatedTasks = [...tasks, createdTask];
                setTasks(updatedTasks);
                if (onTasksUpdate) onTasksUpdate(updatedTasks);

                // Reset new task form but KEEP 'isAddingTask' true for rapid entry
                setNewTask({
                    title: '',
                    status: 'todo',
                    priority: 0,
                    start_date: '',
                    end_date: '',
                    assignee_id: ''
                });
                // Re-focus for next task
                if (titleInputRef.current) titleInputRef.current.focus();
            } else {
                const errorText = await response.text();
                alert(`Failed to create task (${response.status}): ${errorText}`);
            }
        } catch (error) {
            console.error('Failed to create task:', error);
            alert('Failed to create task. Check network.');
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!can('edit_project_registry')) return;
        if (!window.confirm('Delete this task?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/api/projects/tasks/${taskId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const updatedTasks = tasks.filter(t => t.id !== taskId);
                setTasks(updatedTasks);
                if (onTasksUpdate) onTasksUpdate(updatedTasks);
            } else {
                const errorText = await response.text();
                alert(`Delete failed (${response.status}): ${errorText}`);
            }
        } catch (error) {
            console.error('Failed to delete task:', error);
            alert('Failed to delete task. Check network.');
        }
    };

    const handleKeyDown = (e, action) => {
        if (e.key === 'Enter') {
            action();
        } else if (e.key === 'Escape') {
            setIsAddingTask(false);
            setNewTask({
                title: '',
                status: 'todo',
                priority: 0,
                start_date: '',
                end_date: '',
                assignee_id: ''
            });
        }
    };

    // Styling Helpers
    const getStatusBadgeStyle = (status) => {
        const base = { padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', display: 'inline-block' };
        switch (status) {
            case 'todo': return { ...base, background: '#F1F5F9', color: '#64748B' };
            case 'in_progress': return { ...base, background: '#DBEAFE', color: '#2563EB' };
            case 'blocked': return { ...base, background: '#FEE2E2', color: '#DC2626' };
            case 'done': return { ...base, background: '#DCFCE7', color: '#15803D' };
            default: return base;
        }
    };

    const cellStyle = { padding: '8px 12px', borderBottom: '1px solid #E2E8F0', fontSize: '13px', verticalAlign: 'middle' };
    const inputStyle = { width: '100%', border: 'none', background: 'transparent', fontSize: '13px', outline: 'none' };
    const headerStyle = { padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' };

    return (
        <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                    <strong>Work Breakdown Structure</strong> - Use rows below to manage project schedule.
                </span>
                <span style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }}></span>
                    Flag tasks as <strong>Blocked</strong> via status dropdown to highlight risks.
                </span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th style={{ ...headerStyle, width: '40px' }}></th>
                        <th style={{ ...headerStyle, width: '40%' }}>Task Name</th>
                        <th style={{ ...headerStyle, width: '15%' }}>Status</th>
                        <th style={{ ...headerStyle, width: '10%' }}>Priority</th>
                        <th style={{ ...headerStyle, width: '12%' }}>Start</th>
                        <th style={{ ...headerStyle, width: '12%' }}>End</th>
                        <th style={{ ...headerStyle, width: '15%' }}>Assignee</th>
                    </tr>
                </thead>
                <tbody>
                    {tasks.map(task => (
                        <tr key={task.id} style={{ transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'} onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                            <td style={cellStyle}>
                                {can('edit_project_registry') && (
                                    <button
                                        onClick={() => handleDeleteTask(task.id)}
                                        style={{
                                            border: 'none',
                                            background: 'transparent',
                                            cursor: 'pointer',
                                            color: '#EF4444',
                                            opacity: 0.6,
                                            padding: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '4px',
                                            transition: 'all 0.2s'
                                        }}
                                        title="Delete Task"
                                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = '#FEE2E2'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </td>
                            <td style={cellStyle}>
                                <input
                                    type="text"
                                    value={task.title}
                                    onChange={(e) => handleUpdateTask(task.id, 'title', e.target.value)}
                                    disabled={!can('edit_project_registry')}
                                    style={{ ...inputStyle, fontWeight: 500, color: '#0F172A', textDecoration: task.status === 'done' ? 'line-through' : 'none', cursor: can('edit_project_registry') ? 'text' : 'default' }}
                                />
                            </td>
                            <td style={cellStyle}>
                                <select
                                    value={task.status}
                                    onChange={(e) => handleUpdateTask(task.id, 'status', e.target.value)}
                                    disabled={!can('edit_project_registry')}
                                    style={{ ...inputStyle, ...getStatusBadgeStyle(task.status), width: 'auto', WebkitAppearance: 'none', cursor: can('edit_project_registry') ? 'pointer' : 'default', border: 'none', padding: '2px 8px' }}
                                >
                                    <option value="todo">Todo</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="blocked">Blocked</option>
                                    <option value="done">Done</option>
                                </select>
                            </td>
                            <td style={cellStyle}>
                                <input
                                    type="number"
                                    value={task.priority}
                                    onChange={(e) => handleUpdateTask(task.id, 'priority', parseInt(e.target.value) || 0)}
                                    disabled={!can('edit_project_registry')}
                                    style={{ ...inputStyle, cursor: can('edit_project_registry') ? 'text' : 'default' }}
                                />
                            </td>
                            <td style={cellStyle}>
                                <input
                                    type="date"
                                    value={task.start_date || ''}
                                    onChange={(e) => handleUpdateTask(task.id, 'start_date', e.target.value)}
                                    disabled={!can('edit_project_registry')}
                                    style={{ ...inputStyle, color: '#64748B', cursor: can('edit_project_registry') ? 'pointer' : 'default' }}
                                />
                            </td>
                            <td style={cellStyle}>
                                <input
                                    type="date"
                                    value={task.end_date || ''}
                                    onChange={(e) => handleUpdateTask(task.id, 'end_date', e.target.value)}
                                    disabled={!can('edit_project_registry')}
                                    style={{ ...inputStyle, color: '#64748B', cursor: can('edit_project_registry') ? 'pointer' : 'default' }}
                                />
                            </td>
                            <td style={cellStyle}>
                                <select
                                    value={task.assignee_id || ''}
                                    onChange={(e) => handleUpdateTask(task.id, 'assignee_id', e.target.value || null)}
                                    disabled={!can('edit_project_registry')}
                                    style={{ ...inputStyle, color: task.assignee_id ? '#0F172A' : '#94A3B8', cursor: can('edit_project_registry') ? 'pointer' : 'default' }}
                                >
                                    <option value="">Unassigned</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            </td>
                        </tr>
                    ))}

                    {/* Add Task Row - Only visible for editors */}
                    {/* Add Task UI - Click-to-Add Pattern */}
                    {can('edit_project_registry') && !isAddingTask && (
                        <tr>
                            <td colSpan="7" style={{ padding: '0' }}>
                                <button
                                    onClick={() => setIsAddingTask(true)}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#64748B',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#2563EB'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B'; }}
                                >
                                    <Plus size={16} /> Add New Task
                                </button>
                            </td>
                        </tr>
                    )}

                    {can('edit_project_registry') && isAddingTask && (
                        <tr style={{ background: '#F8FAFC', borderTop: '1px dashed #CBD5E1' }}>
                            <td style={cellStyle}>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <button
                                        onClick={() => setIsAddingTask(false)}
                                        style={{
                                            border: 'none',
                                            background: 'transparent',
                                            cursor: 'pointer',
                                            color: '#94A3B8',
                                            padding: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '4px'
                                        }}
                                        title="Cancel (Esc)"
                                        onMouseEnter={(e) => { e.currentTarget.style.background = '#E2E8F0'; e.currentTarget.style.color = '#64748B'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94A3B8'; }}
                                    >
                                        <X size={14} />
                                    </button>
                                    <button
                                        onClick={handleCreateTask}
                                        disabled={!newTask.title}
                                        style={{
                                            border: 'none',
                                            background: 'transparent',
                                            cursor: !newTask.title ? 'not-allowed' : 'pointer',
                                            color: !newTask.title ? '#CBD5E1' : '#10B981',
                                            padding: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '4px'
                                        }}
                                        title={!newTask.title ? "Type a task name" : "Save Task (Enter)"}
                                        onMouseEnter={(e) => { if (newTask.title) { e.currentTarget.style.background = '#D1FAE5'; } }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <Check size={16} />
                                    </button>
                                </div>
                            </td>
                            <td style={cellStyle}>
                                <input
                                    ref={titleInputRef}
                                    type="text"
                                    placeholder="Task name"
                                    value={newTask.title}
                                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                    onKeyDown={(e) => handleKeyDown(e, handleCreateTask)}
                                    style={{ ...inputStyle, fontWeight: 500 }}
                                />
                            </td>
                            <td style={cellStyle}>
                                <select
                                    value={newTask.status}
                                    onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                                    onKeyDown={(e) => handleKeyDown(e, handleCreateTask)}
                                    style={{ ...inputStyle, fontSize: '11px', color: '#64748B', padding: '2px 4px' }}
                                >
                                    <option value="todo">Todo</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="blocked">Blocked</option>
                                    <option value="done">Done</option>
                                </select>
                            </td>
                            <td style={cellStyle}>
                                <input
                                    type="number"
                                    value={newTask.priority}
                                    onChange={(e) => setNewTask({ ...newTask, priority: parseInt(e.target.value) || 0 })}
                                    onKeyDown={(e) => handleKeyDown(e, handleCreateTask)}
                                    style={inputStyle}
                                />
                            </td>
                            <td style={cellStyle}>
                                <input
                                    type="date"
                                    value={newTask.start_date}
                                    onChange={(e) => setNewTask({ ...newTask, start_date: e.target.value })}
                                    onKeyDown={(e) => handleKeyDown(e, handleCreateTask)}
                                    style={inputStyle}
                                />
                            </td>
                            <td style={cellStyle}>
                                <input
                                    type="date"
                                    value={newTask.end_date}
                                    onChange={(e) => setNewTask({ ...newTask, end_date: e.target.value })}
                                    onKeyDown={(e) => handleKeyDown(e, handleCreateTask)}
                                    style={inputStyle}
                                />
                            </td>
                            <td style={cellStyle}>
                                <select
                                    value={newTask.assignee_id}
                                    onChange={(e) => setNewTask({ ...newTask, assignee_id: e.target.value })}
                                    onKeyDown={(e) => handleKeyDown(e, handleCreateTask)}
                                    style={{ ...inputStyle, padding: '2px 4px' }}
                                >
                                    <option value="">Assignee</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ProjectTasksTab;
