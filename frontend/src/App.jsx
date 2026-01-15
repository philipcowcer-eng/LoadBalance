import React, { useState, useEffect } from 'react';
import './App.css';
import AddEngineerModal from './components/AddEngineerModal';
import EditEngineerModal from './components/EditEngineerModal';
import ProjectDetailModal from './components/ProjectDetailModal';
import AddRidModal from './components/AddRidModal';
import EngineerDashboard from './pages/EngineerDashboard';
import FiscalReportPage from './pages/FiscalReportPage';
import EngineerProfileModal from './components/EngineerProfileModal';
import AllocationCard from './components/AllocationCard';
import QuickAddPopover from './components/QuickAddPopover';
import MobileDashboard from './components/MobileDashboard';
import MobileStaffView from './components/MobileStaffView';
import MobileProjectView from './components/MobileProjectView';
import LoginPage from './components/LoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import ActivityLog from './components/ActivityLog';
import SnapshotManager from './components/SnapshotManager';

// Detect if running in production (via domain) or development (localhost)
// In production, API calls go through nginx proxy at /api, so we use empty string
// In dev, we need the full localhost URL
const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:8001'
  : '';

// Utility for priority badges
const PriorityBadge = ({ priority }) => {
  const p = priority?.toLowerCase() || '';
  const className = p.includes('p1') ? 'p1' : p.includes('p2') ? 'p2' : p.includes('p3') ? 'p3' : 'p4';
  return <span className={`priority-badge ${className}`}>{priority}</span>;
}

function App({ isGuestMode = false }) {
  const { user, logout, can } = useAuth();
  // Persist current page in localStorage
  const [currentPage, setCurrentPage] = useState(() => {
    if (isGuestMode) return 'projects';
    const saved = localStorage.getItem('resourceManager_currentPage');
    return saved || 'dashboard';
  });

  const [engineers, setEngineers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Save page to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('resourceManager_currentPage', currentPage);
  }, [currentPage]);

  // Modal States
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [showAddEngModal, setShowAddEngModal] = useState(false);
  const [showAddRidModal, setShowAddRidModal] = useState(false);
  const [editingEngineer, setEditingEngineer] = useState(null);
  const [managingProjectId, setManagingProjectId] = useState(null);

  // Project Registry States
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedEngineerId, setSelectedEngineerId] = useState(null);
  const [selectedEngineerAllocations, setSelectedEngineerAllocations] = useState([]);
  const [projectFilter, setProjectFilter] = useState('all');
  const [workflowFilter, setWorkflowFilter] = useState('All');
  const [projectRidEntries, setProjectRidEntries] = useState([]);
  const [currentProjectAllocations, setCurrentProjectAllocations] = useState([]);
  const [allAllocations, setAllAllocations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  const [dashboardTeamFilter, setDashboardTeamFilter] = useState('All Teams');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // US-DASH-001: Dynamic quarter calculation based on current date
  const getCurrentQuarter = () => {
    const now = new Date();
    const q = Math.floor(now.getMonth() / 3) + 1;
    return `Q${q} ${now.getFullYear()}`;
  };

  const generateQuarterOptions = () => {
    const now = new Date();
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
    const currentYear = now.getFullYear();
    const currentValue = `Q${currentQuarter} ${currentYear}`;

    const options = [];
    // Previous quarter
    let q = currentQuarter - 1;
    let y = currentYear;
    if (q < 1) { q = 4; y--; }
    options.push({ value: `Q${q} ${y}`, label: `Q${q} ${y}`, isCurrent: false });

    // Current + next 4 quarters
    for (let i = 0; i < 5; i++) {
      q = ((currentQuarter - 1 + i) % 4) + 1;
      y = currentYear + Math.floor((currentQuarter - 1 + i) / 4);
      const value = `Q${q} ${y}`;
      options.push({
        value,
        label: value,
        isCurrent: value === currentValue
      });
    }
    return options;
  };

  const [dashboardQuarterFilter, setDashboardQuarterFilter] = useState(getCurrentQuarter);
  const [backlogFilter, setBacklogFilter] = useState('All');
  const [showFullyStaffed, setShowFullyStaffed] = useState(false); // EPIC-002
  const [allRequirements, setAllRequirements] = useState([]); // US-RS.2: For staffing calculations
  const [allDevices, setAllDevices] = useState([]); // US-13.6: For fiscal reporting
  const [profileEngineer, setProfileEngineer] = useState(null); // Engineer Profile Modal
  const [quickAddTarget, setQuickAddTarget] = useState(null); // { engineerId, anchorRect }
  const [hoveredEngineerId, setHoveredEngineerId] = useState(null); // For delete button visibility

  const fetchRidEntries = async (projectId) => {
    const pid = projectId || selectedProjectId;
    if (!pid) {
      setProjectRidEntries([]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/projects/${pid}/rid-log`);
      if (res.ok) {
        const data = await res.json();
        setProjectRidEntries(data);
      } else {
        setProjectRidEntries([]);
      }
    } catch (error) {
      console.error('Failed to fetch RID entries:', error);
      setProjectRidEntries([]);
    }
  };

  const fetchAllocations = async (projectId) => {
    const pid = projectId || selectedProjectId;
    if (!pid) {
      setCurrentProjectAllocations([]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/projects/${pid}/allocations`);
      if (res.ok) {
        const data = await res.json();
        setCurrentProjectAllocations(data);
      } else {
        setCurrentProjectAllocations([]);
      }
    } catch (error) {
      console.error('Failed to fetch allocations:', error);
      setCurrentProjectAllocations([]);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      fetchRidEntries(selectedProjectId);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchAllocations(selectedProjectId);
    }
  }, [selectedProjectId]);

  // Fetch engineer allocations when selected
  useEffect(() => {
    const fetchEngAllocations = async () => {
      if (!selectedEngineerId) {
        setSelectedEngineerAllocations([]);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/engineers/${selectedEngineerId}/allocations`);
        if (res.ok) {
          const data = await res.json();
          setSelectedEngineerAllocations(data);
        }
      } catch (error) {
        console.error('Failed to fetch engineer allocations:', error);
      }
    };
    fetchEngAllocations();
  }, [selectedEngineerId]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [engRes, projRes, allocRes, reqRes, devRes] = await Promise.all([
        fetch(`${API_BASE}/api/engineers`),
        fetch(`${API_BASE}/api/projects`),
        fetch(`${API_BASE}/api/allocations`),
        fetch(`${API_BASE}/api/requirements`),
        fetch(`${API_BASE}/api/devices`)
      ]);
      const engData = await engRes.json();
      const projData = await projRes.json();
      const allocData = allocRes.ok ? await allocRes.json() : [];
      const reqData = reqRes.ok ? await reqRes.json() : [];
      const devData = devRes.ok ? await devRes.json() : [];
      setEngineers(engData);
      setProjects(projData);
      setAllAllocations(allocData);
      setAllRequirements(reqData);
      setAllDevices(devData);

      // Auto-select first project if none selected
      if (!selectedProjectId && projData.length > 0) {
        setSelectedProjectId(projData[0].id);
      } else if (selectedProjectId) {
        // Refresh details for the currently selected project - pass ID explicitly
        await Promise.all([
          fetchRidEntries(selectedProjectId),
          fetchAllocations(selectedProjectId)
        ]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  // Handle global events (for guest mode intake)
  useEffect(() => {
    const handleShowIntake = () => setShowIntakeModal(true);
    window.addEventListener('show-intake', handleShowIntake);
    return () => window.removeEventListener('show-intake', handleShowIntake);
  }, []);

  const createProject = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      name: formData.get('name'),
      priority: formData.get('priority') || 'P2-Strategic',
      business_justification: formData.get('business_justification'),
      target_end_date: formData.get('target_end_date') || null,
      size: formData.get('size') || 'M',
      workflow_status: 'Draft',
      status: 'Healthy'
    };

    try {
      const res = await fetch(`${API_BASE}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowIntakeModal(false);
        fetchData();
        alert('Project request submitted successfully as DRAFT.');
      } else {
        const errorText = await res.text();
        console.error('Failed to create project:', errorText);
        alert(`Failed to create project: ${errorText}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend.');
    }
  };

  const handleCloneScenario = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/scenarios/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Clone of Live Plan - ${new Date().toLocaleDateString()}`,
          created_by: "00000000-0000-0000-0000-000000000001"
        })
      });
      if (res.ok) {
        setNotification({ show: true, type: 'success', message: 'Scenario cloned successfully!' });
        setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000);
        setCurrentPage('scenario');
      } else {
        setNotification({ show: true, type: 'error', message: 'Failed to clone scenario.' });
        setTimeout(() => setNotification({ show: false, type: '', message: '' }), 5000);
      }
    } catch (err) {
      console.error(err);
      setNotification({ show: true, type: 'error', message: 'Error cloning scenario. Check console.' });
      setTimeout(() => setNotification({ show: false, type: '', message: '' }), 5000);
    }
  };

  const renderSidebar = () => (
    <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-active' : ''}`}>
      <div className="sidebar-logo">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="c-optimal">
          <path d="M12 20V10" />
          <path d="M18 20V4" />
          <path d="M6 20v-4" />
        </svg>
        <span>Network Planner</span>
      </div>
      <button
        className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
        onClick={() => { setCurrentPage('dashboard'); setIsMobileMenuOpen(false); }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
        Dashboard
      </button>
      <button
        className={`nav-item ${currentPage === 'roster' ? 'active' : ''}`}
        onClick={() => { setCurrentPage('roster'); setIsMobileMenuOpen(false); }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
        Staff Planning
      </button>
      <button
        className={`nav-item ${currentPage === 'projects' ? 'active' : ''}`}
        onClick={() => { setCurrentPage('projects'); setIsMobileMenuOpen(false); }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
        Project Registry
      </button>
      <button
        className={`nav-item ${currentPage === 'my-week' ? 'active' : ''}`}
        onClick={() => { setCurrentPage('my-week'); setIsMobileMenuOpen(false); }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        My Week
      </button>
      <button
        className={`nav-item ${currentPage === 'scenario' ? 'active' : ''}`}
        onClick={() => { setCurrentPage('scenario'); setIsMobileMenuOpen(false); }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
        Scenario Builder
      </button>
      <button
        className={`nav-item ${currentPage === 'fiscal-report' ? 'active' : ''}`}
        onClick={() => { setCurrentPage('fiscal-report'); setIsMobileMenuOpen(false); }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}><path d="M3 3v18h18"></path><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path></svg>
        Fiscal Reporting
      </button>

      {/* Admin Settings (Admin only) */}
      {can('manage_users') && (
        <button
          className={`nav-item ${currentPage === 'admin' ? 'active' : ''}`}
          onClick={() => { setCurrentPage('admin'); setIsMobileMenuOpen(false); }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          Admin Settings
        </button>
      )}
      <div style={{ marginTop: 'auto' }}>
        <button
          className={`nav-item ${currentPage === 'support' ? 'active' : ''}`}
          onClick={() => { setCurrentPage('support'); setIsMobileMenuOpen(false); }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          Support & Docs
        </button>
      </div>
    </aside>
  );

  // Breadcrumb component for navigation context (Fix for Navigation Audit)
  const Breadcrumb = () => {
    const pageNames = {
      dashboard: 'Dashboard',
      roster: 'Staff Planning',
      projects: 'Project Registry',
      'my-week': 'My Week',
      scenario: 'Scenario Builder',
      'fiscal-report': 'Fiscal Reporting',
      support: 'Support & Docs'
    };

    return (
      <div className="breadcrumb" style={{
        fontSize: '0.75rem',
        color: '#64748B',
        padding: '0.75rem 1.5rem',
        background: '#F8FAFC',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <span style={{ cursor: 'pointer' }} onClick={() => setCurrentPage('dashboard')}>Home</span>
        <span style={{ color: '#CBD5E1' }}>›</span>
        <span style={{ color: '#0F172A', fontWeight: 500 }}>{pageNames[currentPage] || 'Unknown'}</span>
      </div>
    );
  };

  const renderDashboard = () => {
    // Mobile Check: If screen is small, show the simplified mobile dashboard
    // We already have responsive CSS, but this component replaces the DENSE grid with a SUMMARY view
    if (window.innerWidth < 768) {
      return (
        <MobileDashboard
          engineers={engineers}
          projects={projects}
          allocations={allAllocations}
          onNewRequest={() => setShowIntakeModal(true)}
        />
      );
    }
    // Generate weeks based on selected quarter filter
    const getWeeksForQuarter = (quarterStr) => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      // Parse quarter string (e.g., "Q1 2025")
      const match = quarterStr.match(/Q(\d)\s+(\d{4})/);
      if (!match) {
        // Fallback to current quarter
        const now = new Date();
        const quarter = Math.floor(now.getMonth() / 3) + 1;
        const year = now.getFullYear();
        return getWeeksForQuarter(`Q${quarter} ${year}`);
      }

      const quarter = parseInt(match[1]);
      const year = parseInt(match[2]);

      // Quarter start months: Q1=0 (Jan), Q2=3 (Apr), Q3=6 (Jul), Q4=9 (Oct)
      const startMonth = (quarter - 1) * 3;
      const startDate = new Date(year, startMonth, 1);

      // Find the first Monday of the quarter
      const dayOfWeek = startDate.getDay();
      const daysUntilMonday = dayOfWeek === 0 ? 1 : (dayOfWeek === 1 ? 0 : 8 - dayOfWeek);
      startDate.setDate(startDate.getDate() + daysUntilMonday);

      const result = [];
      for (let i = 0; i < 13; i++) {
        const weekStart = new Date(startDate);
        weekStart.setDate(startDate.getDate() + (i * 7));
        const label = `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()}`;
        result.push({ date: label, short: label.toUpperCase(), rawDate: weekStart });
      }
      return result;
    };
    const weeks = getWeeksForQuarter(dashboardQuarterFilter);

    // Calculate REAL metrics from database
    const activeProjects = projects.filter(p => p.workflow_status !== 'Complete' && p.workflow_status !== 'Cancelled');
    const activeProjectIds = new Set(activeProjects.map(p => p.id));

    // Apply Team Filter to engineers
    const filteredEngineers = dashboardTeamFilter === 'All Teams'
      ? engineers
      : engineers.filter(eng => {
        const role = eng.role?.toLowerCase() || '';
        if (dashboardTeamFilter === 'Network') return role.includes('network');
        if (dashboardTeamFilter === 'Wireless') return role.includes('wireless');
        if (dashboardTeamFilter === 'Cloud') return role.includes('cloud');
        return true;
      });

    // Helper: Check if project is active in a specific week
    const isProjectActiveInWeek = (projectId, weekStart) => {
      const project = projects.find(p => p.id === projectId);
      if (!project) return false;

      // If project has no dates, assume it's active based on workflow status
      if (!project.start_date && !project.target_end_date) return true;

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // Adjust dates for timezone/boundaries
      const pStart = project.start_date ? new Date(project.start_date) : null;
      if (pStart) pStart.setHours(0, 0, 0, 0); // Start of day

      const pEnd = project.target_end_date ? new Date(project.target_end_date) : null;
      if (pEnd) pEnd.setHours(23, 59, 59, 999); // End of day

      if (pStart && pStart > weekEnd) return false; // Starts after this week
      if (pEnd && pEnd < weekStart) return false; // Ends before this week

      return true;
    };

    // Calculate Weekly Data for Team Total
    const teamTotalData = weeks.map(week => {
      const totalCapacity = filteredEngineers.reduce((sum, eng) => sum + ((eng.total_capacity || 40) - (eng.ktlo_tax || 0)), 0);
      if (totalCapacity === 0) return '0%';

      const weeklyAllocated = allAllocations.reduce((sum, alloc) => {
        // Must be active project, active in THIS week, and belong to filtered team
        if (!activeProjectIds.has(alloc.project_id)) return sum;
        if (!filteredEngineers.find(e => e.id === alloc.engineer_id)) return sum;
        if (!isProjectActiveInWeek(alloc.project_id, week.rawDate)) return sum;
        return sum + alloc.hours;
      }, 0);

      return `${Math.round((weeklyAllocated / totalCapacity) * 100)}%`;
    });

    // Calculate Weekly Data for Each Engineer
    const engineerUtilization = filteredEngineers.map(eng => {
      const effective = (eng.total_capacity || 40) - (eng.ktlo_tax || 0);

      // Calculate utilization per week based on project timelines
      const weeklyUtilization = weeks.map(week => {
        if (effective === 0) return 0;

        const weeklyHours = allAllocations
          .filter(a => a.engineer_id === eng.id && activeProjectIds.has(a.project_id) && isProjectActiveInWeek(a.project_id, week.rawDate))
          .reduce((sum, a) => sum + a.hours, 0);

        return Math.round((weeklyHours / effective) * 100);
      });

      // Current Avg for sorting/burnout (calc based on first 4 weeks of view or all?)
      // Let's use the average of the displayed quarter for the 'utilizationPct' metric
      const avgUtil = Math.round(weeklyUtilization.reduce((a, b) => a + b, 0) / weeklyUtilization.length);

      return {
        ...eng,
        utilizationPct: avgUtil,
        weeklyData: weeklyUtilization
      };
    });

    // Restore removed variables that are still used in JSX
    const filteredEngineerIds = new Set(filteredEngineers.map(e => e.id));
    const activeAllocatedHours = allAllocations
      .filter(a => activeProjectIds.has(a.project_id) && filteredEngineerIds.has(a.engineer_id))
      .reduce((sum, a) => sum + a.hours, 0);

    const totalTeamCapacity = filteredEngineers.reduce((sum, eng) => sum + ((eng.total_capacity || 40) - (eng.ktlo_tax || 0)), 0);

    // Current allocation percentage (Team Total)
    const currentAllocationPct = totalTeamCapacity > 0
      ? Math.round((activeAllocatedHours / totalTeamCapacity) * 100)
      : 0;

    const burnoutRiskCount = engineerUtilization.filter(e => e.utilizationPct > 100).length;
    const weeklyCapacity = weeks.map((week, i) => {
      const pct = parseInt(teamTotalData[i]) || 0;
      return { demand: pct, capacity: 100 };
    });
    const getCapacityColor = (demand) => {
      if (demand >= 100) return '#EF4444';
      if (demand >= 85) return '#F59E0B';
      if (demand >= 50) return '#10B981';
      return '#CBD5E1';
    };

    // Build utilization table
    const utilizationData = [
      {
        name: 'TEAM TOTAL',
        subtitle: `${filteredEngineers.length} Engineers`,
        data: teamTotalData, // Use calculated weekly array
        isTotal: true
      },
      ...engineerUtilization.map(eng => ({
        name: eng.name,
        subtitle: eng.role,
        data: eng.weeklyData.map(val => `${val}%`), // Use calculated weekly array
        isTotal: false,
        engineerId: eng.id
      }))
    ];

    const getUtilizationColor = (value) => {
      if (value === 'PTO') return '#E2E8F0';
      const num = parseInt(value);
      if (num >= 100) return '#EF4444';
      if (num >= 85) return '#F59E0B';
      if (num >= 50) return '#10B981';
      return '#CBD5E1';
    };


    const getUtilizationTextColor = (value) => {
      if (value === 'PTO') return '#64748B';
      return '#FFFFFF';
    };

    // KPI: Project Lifecycle Counts (Phase 4)
    const projectLifecycleCounts = {
      Draft: projects.filter(p => (p.workflow_status || 'Draft') === 'Draft').length,
      Pending: projects.filter(p => p.workflow_status === 'Pending Approval').length,
      Active: projects.filter(p => p.workflow_status === 'Active').length,
      Complete: projects.filter(p => p.workflow_status === 'Complete').length,
      OnHold: projects.filter(p => p.workflow_status === 'On Hold').length
    };

    // KPI: Fiscal Impact (Phase 4)
    const fiscalImpactCounts = projects
      .filter(p => p.workflow_status === 'Active' || p.workflow_status === 'Complete')
      .reduce((acc, p) => {
        if (!p.fiscal_year) return acc;
        acc[p.fiscal_year] = (acc[p.fiscal_year] || 0) + (parseInt(p.device_count) || 0);
        return acc;
      }, {});

    // Sort fiscal years for display
    const sortedFyKeys = Object.keys(fiscalImpactCounts).sort();


    return (
      <div className="dashboard-content">
        {/* Header Bar with Filters */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.5rem',
          background: 'white',
          borderRadius: '8px',
          border: '1px solid #E2E8F0',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0F172A' }}>Resource Overview</h2>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <select
              value={dashboardTeamFilter}
              onChange={(e) => setDashboardTeamFilter(e.target.value)}
              style={{
                padding: '0.5rem 2rem 0.5rem 0.75rem',
                border: dashboardTeamFilter !== 'All Teams' ? '2px solid #3B82F6' : '1px solid #E2E8F0',
                borderRadius: '6px',
                fontSize: '0.875rem',
                color: '#0F172A',
                background: 'white',
                cursor: 'pointer',
                minWidth: '140px'
              }}>
              <option>All Teams</option>
              <option>Network</option>
              <option>Wireless</option>
              <option>Cloud</option>
            </select>
            <select
              value={dashboardQuarterFilter}
              onChange={(e) => setDashboardQuarterFilter(e.target.value)}
              style={{
                padding: '0.5rem 2rem 0.5rem 0.75rem',
                border: dashboardQuarterFilter === getCurrentQuarter() ? '2px solid #10B981' : '1px solid #E2E8F0',
                borderRadius: '6px',
                fontSize: '0.875rem',
                color: '#0F172A',
                background: 'white',
                cursor: 'pointer',
                minWidth: '120px'
              }}>
              {generateQuarterOptions().map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}{opt.isCurrent ? ' (Current)' : ''}
                </option>
              ))}
            </select>
            <button
              className="btn btn-primary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              onClick={() => fetchData()}
            >Apply Filters</button>

          </div>

        </div>

        <div className="grid" style={{ gap: '1.25rem', marginBottom: '2rem' }}>

          {/* KPI Cards - REAL DATA */}
          <div className="kpi-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.6875rem', color: '#64748B', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: 600 }}>EFFECTIVE CAPACITY</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <div style={{ fontSize: '2.25rem', fontWeight: 700, color: '#0F172A' }}>{totalTeamCapacity}h</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#10B981' }}>Weekly</div>
            </div>
            <p style={{ fontSize: '0.6875rem', color: '#94A3B8', margin: 0 }}>{engineers.length} engineers after KTLO</p>
          </div>

          <div className="kpi-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.6875rem', color: '#64748B', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: 600 }}>CURRENT ALLOCATION</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '2.25rem', fontWeight: 700, color: getCapacityColor(currentAllocationPct) }}>{currentAllocationPct}%</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#64748B' }}>Avg</div>
            </div>
            <div style={{ display: 'flex', gap: '2px', height: '24px' }}>
              {engineerUtilization.slice(0, 5).map((eng, i) => (
                <div key={i} style={{ flex: 1, background: getCapacityColor(eng.utilizationPct), borderRadius: '2px' }}></div>
              ))}
            </div>
          </div>

          <div className="kpi-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.6875rem', color: '#64748B', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: 600 }}>BURNOUT RISK</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <div style={{ fontSize: '2.25rem', fontWeight: 700, color: burnoutRiskCount > 0 ? '#EF4444' : '#10B981' }}>{burnoutRiskCount}</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#64748B' }}>Engineer{burnoutRiskCount !== 1 ? 's' : ''}</div>
            </div>
            <p style={{ fontSize: '0.6875rem', color: '#94A3B8', margin: 0 }}>{burnoutRiskCount > 0 ? 'Exceeding 100%' : 'All within capacity'}</p>
          </div>

          <div className="kpi-card" style={{ background: '#EFF6FF', padding: '1.5rem', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" style={{ marginTop: '2px', flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
              </svg>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#2563EB' }}>Smart Insight</div>
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#1E40AF', lineHeight: '1.5', margin: 0 }}>
              {(() => {
                const isCurrentQuarter = dashboardQuarterFilter === getCurrentQuarter();
                if (burnoutRiskCount > 0) {
                  return <>⚠️ <strong>{burnoutRiskCount} engineer{burnoutRiskCount > 1 ? 's' : ''}</strong> currently exceeding 100% utilization. Consider redistributing workload.</>;
                } else if (currentAllocationPct < 50) {
                  return <>📊 Team capacity is <strong>underutilized</strong> at {currentAllocationPct}%. Good opportunity to take on new projects.</>;
                } else if (currentAllocationPct > 85) {
                  return <>⚡ Team running at <strong>{currentAllocationPct}%</strong> capacity. Monitor for potential overload in upcoming weeks.</>;
                } else if (!isCurrentQuarter) {
                  return <>📅 Viewing <strong>{dashboardQuarterFilter}</strong>. Allocations shown are projections based on current assignments.</>;
                } else {
                  return <>✅ Team utilization is <strong>balanced</strong> at {currentAllocationPct}%. All engineers within healthy capacity limits.</>;
                }
              })()}
            </p>
          </div>

          {/* New Row for Phase 4 KPIs */}

          {/* Unassigned Demand (The Void) Card */}
          <div className="kpi-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.6875rem', color: '#64748B', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: 600 }}>UNASSIGNED DEMAND</div>
            {(() => {
              // Logic: Sum requirements for Active/Approved projects
              const activeApprovedIds = new Set(projects.filter(p => p.workflow_status === 'Active' || p.workflow_status === 'Approved').map(p => p.id));

              const totalRequired = allRequirements
                .filter(r => activeApprovedIds.has(r.project_id))
                .reduce((sum, r) => sum + r.hours_per_week, 0);

              const totalAllocated = allAllocations
                .filter(a => activeApprovedIds.has(a.project_id))
                .reduce((sum, a) => sum + a.hours, 0);

              const voidHours = Math.max(0, totalRequired - totalAllocated);
              const demandMetPct = totalRequired > 0 ? Math.round((totalAllocated / totalRequired) * 100) : 100;

              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <div style={{ fontSize: '2.25rem', fontWeight: 700, color: '#0F172A' }}>{voidHours}h</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748B' }}>In The Void</div>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: '#F1F5F9', borderRadius: '2px', marginTop: '0.5rem' }}>
                    <div style={{ width: `${Math.min(demandMetPct, 100)}%`, height: '100%', background: '#3B82F6', borderRadius: '2px' }}></div>
                  </div>
                  <p style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '0.5rem', margin: 0 }}>{demandMetPct}% of demand met</p>
                </>
              );
            })()}
          </div>

          {/* Deep Work Compliance Card */}
          <div className="kpi-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.6875rem', color: '#64748B', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: 600 }}>DEEP WORK COMPLIANCE</div>
            {(() => {
              // Logic: % of network engineers with NO meetings on Tue/Thu
              // Note: Only checking 'Network Engineer' and 'Wireless Engineer' roles for compliance
              const engineersToCheck = engineers.filter(e => e.role === 'Network Engineer' || e.role === 'Wireless Engineer');

              const compliantEngineersCount = engineersToCheck.filter(eng => {
                // Find if engineer has any 'Meetings' (Category) on 'Tue' or 'Thu' (Day)
                const hasMeetingViolation = allAllocations.some(a =>
                  a.engineer_id === eng.id &&
                  a.category === 'Meetings' &&
                  (a.day === 'Tue' || a.day === 'Thu')
                );
                return !hasMeetingViolation;
              }).length;

              const complianceScore = engineersToCheck.length > 0
                ? Math.round((compliantEngineersCount / engineersToCheck.length) * 100)
                : 100;

              const getScoreColor = (score) => {
                if (score >= 90) return '#10B981';
                if (score >= 70) return '#F59E0B';
                return '#EF4444';
              };

              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <div style={{ fontSize: '2.25rem', fontWeight: 700, color: getScoreColor(complianceScore) }}>{complianceScore}%</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: getScoreColor(complianceScore) }}>Compliance</div>
                  </div>
                  <p style={{ fontSize: '0.6875rem', color: '#94A3B8', margin: 0 }}>{compliantEngineersCount}/{engineersToCheck.length} Engineers protected Tue/Thu</p>
                </>
              );
            })()}
          </div>


          {/* Project Lifecycle Card */}
          <div className="kpi-card" style={{ background: 'white', padding: '1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0', gridColumn: 'span 2' }}>
            <div style={{ fontSize: '0.6875rem', color: '#64748B', marginBottom: '1rem', textTransform: 'uppercase', fontWeight: 600 }}>PROJECT LIFECYCLE</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', alignItems: 'center', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#94A3B8' }}>{projectLifecycleCounts.Draft}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Draft</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F59E0B' }}>{projectLifecycleCounts.Pending}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Pending</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3B82F6' }}>{projectLifecycleCounts.Active}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Active</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#6366F1' }}>{projectLifecycleCounts.OnHold}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>On Hold</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10B981' }}>{projectLifecycleCounts.Complete}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Complete</div>
              </div>
            </div>
            {/* Show Cancelled as a footnote if any exist */}
            {projects.filter(p => p.workflow_status === 'Cancelled').length > 0 && (
              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #E2E8F0', fontSize: '0.6875rem', color: '#94A3B8', textAlign: 'center' }}>
                And {projects.filter(p => p.workflow_status === 'Cancelled').length} Cancelled projects
              </div>
            )}
          </div>

          {/* Fiscal Impact Card */}
          {/* Fiscal Year Refresh Status/Goal Card - EPIC-003 */}
          {/* Fiscal Year Refresh Status/Goal Card - EPIC-003 */}
          <div className="kpi-card" style={{ background: 'white', padding: '1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0', gridColumn: 'span 4' }}>
            <div style={{ fontSize: '0.6875rem', color: '#64748B', marginBottom: '1rem', textTransform: 'uppercase', fontWeight: 600 }}>FISCAL YEAR REFRESH PROGRESS</div>
            {(() => {
              // Extract Fiscal Year from current dashboard filter (e.g. "Q1 2026" -> 2026 -> "FY26")
              const match = dashboardQuarterFilter.match(/Q\d\s+(\d{4})/);
              const selectedYear = match ? `FY${match[1].slice(2)}` : 'FY26'; // Default if parse fails

              // Filter all devices for projects in this Fiscal Year
              const fyDevices = allDevices.filter(d => {
                const project = projects.find(p => p.id === d.project_id);
                return project && project.fiscal_year === selectedYear;
              });

              if (fyDevices.length === 0) {
                return (
                  <div style={{ textAlign: 'center', padding: '1rem', color: '#94A3B8', fontStyle: 'italic', fontSize: '0.875rem' }}>
                    No refresh goals defined for {selectedYear}
                  </div>
                );
              }

              // Aggregate counts by device type
              const statsByType = fyDevices.reduce((acc, dev) => {
                const type = dev.device_type;
                if (!acc[type]) acc[type] = { planned: 0, completed: 0 };

                // Add to planned (Goal)
                acc[type].planned += (dev.proposed_qty || 0);

                // Add to completed if project is Complete
                const project = projects.find(p => p.id === dev.project_id);
                if (project && project.workflow_status === 'Complete') {
                  acc[type].completed += (dev.proposed_qty || 0);
                }

                return acc;
              }, {});

              // Calculate max value for scaling the bars based on the highest count in any category
              const allValues = Object.values(statsByType).flatMap(s => [s.planned, s.completed]);
              const maxValue = Math.max(...allValues, 1); // Avoid div by zero

              const sortedTypes = Object.keys(statsByType).sort();

              return (
                <div>
                  {/* Legend/Header */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1.5rem', marginBottom: '1rem', fontSize: '0.75rem', color: '#64748B' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: 10, height: 10, background: '#CBD5E1', borderRadius: '2px' }}></div>
                      <span>Goal</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: 10, height: 10, background: '#10B981', borderRadius: '2px' }}></div>
                      <span>Done</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                    {sortedTypes.map(type => {
                      const stats = statsByType[type];
                      return (
                        <div key={type} style={{ fontSize: '0.875rem' }}>
                          <div style={{ fontWeight: 600, color: '#0F172A', marginBottom: '0.5rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.25rem' }}>
                            {type}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {/* Goal Bar */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', width: '30px', textAlign: 'right' }}>{stats.planned}</div>
                              <div style={{ flex: 1, height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${(stats.planned / maxValue) * 100}%`, height: '100%', background: '#CBD5E1', borderRadius: '4px' }}></div>
                              </div>
                            </div>
                            {/* Done Bar */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: stats.completed > 0 ? '#10B981' : '#64748B', width: '30px', textAlign: 'right' }}>{stats.completed}</div>
                              <div style={{ flex: 1, height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${(stats.completed / maxValue) * 100}%`, height: '100%', background: '#10B981', borderRadius: '4px' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Weekly Capacity Chart */}
          <div className="card full-width" style={{ background: 'white', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ borderBottom: '1px solid #E2E8F0', padding: '1.25rem 1.5rem', fontSize: '0.9375rem', fontWeight: 600 }}>
              Weekly Team Capacity vs Demand
            </div>
            <div style={{ padding: '2rem 1.5rem' }}>
              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 12, height: 12, background: '#0F172A', borderRadius: '2px' }}></div>
                  <span>Demand</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 12, height: 12, background: 'white', border: '2px solid #64748B', borderRadius: '2px' }}></div>
                  <span>Capacity</span>
                </div>
                <div style={{ marginLeft: 'auto', color: '#64748B' }}>--- 100%</div>
              </div>
              {/* Chart area with ENGINEER column placeholder for alignment */}
              <div style={{ display: 'flex' }}>
                <div style={{ width: '150px', flexShrink: 0 }}></div>
                <div style={{ display: 'flex', flex: 1, height: '200px', alignItems: 'flex-end', borderBottom: '2px solid #E2E8F0', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, borderBottom: '2px dashed #94A3B8', pointerEvents: 'none' }}></div>
                  {weeklyCapacity.map((week, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <div style={{ width: '60%', background: getCapacityColor(week.demand), height: `${Math.min(week.demand, 100)}%`, borderRadius: '4px 4px 0 0', minHeight: '20px' }}></div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Week labels with ENGINEER column placeholder for alignment */}
              <div style={{ display: 'flex', marginTop: '8px' }}>
                <div style={{ width: '150px', flexShrink: 0 }}></div>
                <div style={{ display: 'flex', flex: 1 }}>
                  {weeks.map((week, i) => (
                    <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '0.6875rem', color: '#64748B' }}>{week.date}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Individual Utilization Table */}
          <div className="card full-width" style={{ background: 'white', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ borderBottom: '1px solid #E2E8F0', padding: '1.25rem 1.5rem', fontSize: '0.9375rem', fontWeight: 600 }}>
              Individual Utilization by Week
            </div>
            <div style={{ overflowX: 'auto' }}>
              <div style={{ display: 'flex', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <div style={{ width: '150px', flexShrink: 0, padding: '0.875rem 1rem', fontWeight: 600, fontSize: '0.6875rem', color: '#64748B', textTransform: 'uppercase' }}>ENGINEER</div>
                {weeks.map((week, i) => (
                  <div key={i} style={{ flex: 1, padding: '0.875rem 0', fontWeight: 600, fontSize: '0.6875rem', color: '#64748B', textTransform: 'uppercase', textAlign: 'center' }}>{week.short}</div>
                ))}
              </div>
              {utilizationData.map((eng, engIndex) => (
                <div key={engIndex} style={{ display: 'flex', borderTop: engIndex > 0 ? '1px solid #E2E8F0' : 'none' }}>
                  <div style={{ width: '150px', flexShrink: 0, padding: '0.75rem 1rem', background: 'white' }}>
                    <div
                      onClick={() => {
                        if (!eng.isTotal && eng.engineerId) {
                          const found = engineers.find(e => e.id === eng.engineerId);
                          setProfileEngineer(found);
                        }
                      }}
                      style={{
                        fontWeight: eng.isTotal ? 700 : 600,
                        fontSize: '0.875rem',
                        color: eng.isTotal ? '#D97706' : '#0F172A',
                        cursor: eng.isTotal ? 'default' : 'pointer',
                        textDecoration: eng.isTotal ? 'none' : 'underline',
                        textDecorationColor: '#CBD5E1'
                      }}
                    >{eng.name}</div>
                    <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '2px' }}>{eng.subtitle}</div>
                  </div>
                  {eng.data.map((value, weekIndex) => (
                    <div key={weekIndex} style={{ flex: 1, padding: '4px' }}>
                      <div style={{
                        background: getUtilizationColor(value),
                        color: getUtilizationTextColor(value),
                        padding: '0.5rem 0.25rem',
                        borderRadius: '4px',
                        textAlign: 'center',
                        fontWeight: 700,
                        fontSize: '0.75rem'
                      }}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (e, project) => {
    e.dataTransfer.setData('projectId', project.id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleAllocate = async (projectId, engineerId) => {
    if (!projectId || !engineerId) return;

    // Default allocation details
    const payload = {
      engineer_id: engineerId,
      hours_per_week: 8, // Defaulting to 8h as per plan
      role: 'Contributor' // Default role
    };

    try {
      const res = await fetch(`${API_BASE}/api/projects/${projectId}/allocations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await fetchData();
        setNotification({ show: true, type: 'success', message: 'Project allocated successfully' });
        setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000);
      } else {
        const errText = await res.text();
        console.error("Failed to allocate:", errText);
        alert("Failed to create allocation.");
      }
    } catch (error) {
      console.error("Error allocating project:", error);
      alert("Error processing assignment.");
    }
  };

  const handleDrop = async (e, engineerId) => {
    e.preventDefault();
    const projectId = e.dataTransfer.getData('projectId');
    handleAllocate(projectId, engineerId);
  };

  const handleDeleteAllocation = async (allocationId) => {
    try {
      const res = await fetch(`${API_BASE}/api/allocations/${allocationId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchData();
        setNotification({ show: true, type: 'success', message: 'Allocation removed' });
        setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000);
      } else {
        alert("Failed to remove allocation");
      }
    } catch (error) {
      console.error("Error deleting allocation:", error);
    }
  };

  const handleUpdateAllocation = async (allocationId, hours) => {
    try {
      const res = await fetch(`${API_BASE}/api/allocations/${allocationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours_per_week: hours })
      });
      if (res.ok) {
        await fetchData();
      } else {
        alert("Failed to update allocation");
      }
    } catch (error) {
      console.error("Error updating allocation:", error);
    }
  };

  const handleDeleteEngineer = async (engineerId, engineerName) => {
    if (!window.confirm(`Are you sure you want to remove ${engineerName}? All their current project allocations will be released.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/engineers/${engineerId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchData();
        setNotification({ show: true, type: 'success', message: `${engineerName} removed successfully.` });
        setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000);
      } else {
        alert("Failed to remove engineer.");
      }
    } catch (error) {
      console.error("Error deleting engineer:", error);
    }
  };

  const renderWorkbench = () => {
    // Generate Weeks for the current view (12 week horizon) starting from current week
    const getWeeksFromNow = (count) => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) - 7); // Start on Monday of LAST week

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const result = [];
      for (let i = 0; i < count; i++) {
        const weekStart = new Date(startOfWeek);
        weekStart.setDate(startOfWeek.getDate() + (i * 7));
        const label = `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()}`;
        result.push({ id: `W${i + 1}`, label, rawDate: weekStart });
      }
      return result;
    };
    const viewWeeks = getWeeksFromNow(12);
    const currentWeekLabel = viewWeeks[0]?.label || 'This Week';

    // Group projects by priority for backlog - apply filter (US-RS.2)
    // Only show Approved/Active projects, excluding fully staffed
    const getStaffingStatus = (projectId) => {
      const projectReqs = allRequirements.filter(r => r.project_id === projectId);
      const requiredHours = projectReqs.reduce((sum, r) => sum + r.hours_per_week, 0);
      const allocatedHours = allAllocations
        .filter(a => a.project_id === projectId)
        .reduce((sum, a) => sum + a.hours, 0);
      const isFullyStaffed = requiredHours > 0 && allocatedHours >= requiredHours;
      const rolesCount = projectReqs.length;
      // Count how many roles have at least some allocation
      const filledRoles = projectReqs.filter(req => {
        const allocForRole = allAllocations.filter(a => a.project_id === projectId).reduce((s, a) => s + a.hours, 0);
        return allocForRole > 0;
      }).length;
      return { requiredHours, allocatedHours, isFullyStaffed, rolesCount, filledRoles, hasRequirements: projectReqs.length > 0 };
    };

    // Base filter: Only Approved or Active projects
    const eligibleProjects = projects.filter(p =>
      (p.workflow_status === 'Approved' || p.workflow_status === 'Active') &&
      p.workflow_status !== 'Complete' && p.workflow_status !== 'Cancelled'
    );

    // Filter projects for backlog using backend-precalculated metrics
    const backlogProjects = eligibleProjects.filter(p => {
      // 1. Check if fully staffed (and respect toggle)
      if (!showFullyStaffed && p.is_fully_staffed) return false;

      // 2. Apply text/priority filters (existing logic)
      if (backlogFilter === 'P1 Only' && p.priority !== 'P1-Critical') return false;
      if (backlogFilter === 'Unassigned' && p.total_hours_allocated > 0) return false;

      return true;
    });

    // Helper for priority colors
    const getPriorityColor = (priority) => {
      if (priority === 'P1-Critical') return '#EF4444'; // Red
      if (priority === 'P2-Strategic') return '#F59E0B'; // Amber
      if (priority === 'P3-Standard') return '#3B82F6'; // Blue
      return '#94A3B8'; // Gray
    };

    // Calculate engineer utilization and weekly schedules
    const engineerSchedules = engineers.map(eng => {
      const effective = (eng.total_capacity || 40) - (eng.ktlo_tax || 0);

      // Get all allocations for this engineer
      const engAllocations = allAllocations.filter(a => a.engineer_id === eng.id);

      // SUM up daily hours into weekly project buckets
      // Since our DB is one-set-of-days-fits-all-weeks, we calculate the weekly total once
      const projectWeeklyTotals = {};
      engAllocations.forEach(alloc => {
        if (!projectWeeklyTotals[alloc.project_id]) {
          const proj = projects.find(p => p.id === alloc.project_id);
          projectWeeklyTotals[alloc.project_id] = {
            id: alloc.project_id,
            allocationId: alloc.id, // Store ID for quick updates
            name: proj?.name || 'Loading...',
            category: alloc.category,
            hours: 0,
            priority: proj?.priority || 'P3-Standard'
          };
        }
        projectWeeklyTotals[alloc.project_id].hours += alloc.hours;
      });

      const weeklyAllocatedHours = Object.values(projectWeeklyTotals).reduce((sum, p) => sum + p.hours, 0);

      return {
        ...eng,
        effective,
        allocatedTotal: weeklyAllocatedHours,
        projectWeeklyTotals: Object.values(projectWeeklyTotals),
        utilizationPct: effective > 0 ? Math.round((weeklyAllocatedHours / effective) * 100) : 0
      };
    });

    const teamOverloadCount = engineerSchedules.filter(e => e.utilizationPct > 100).length;

    // Calculate total unassigned hours dynamically
    const totalUnassignedHours = projects
      .filter(p => (p.workflow_status === 'Approved' || p.workflow_status === 'Active') && p.workflow_status !== 'Complete' && p.workflow_status !== 'Cancelled')
      .reduce((sum, p) => {
        const gap = Math.max(0, (p.total_hours_required || 0) - (p.total_hours_allocated || 0));
        return sum + gap;
      }, 0);

    // Reuse helper for date checking
    const isProjectActiveInWeekHelper = (projectId, weekStart) => {
      const project = projects.find(p => p.id === projectId);
      if (!project) return false;

      // Filter out Completed/Cancelled (US request)
      if (project.workflow_status === 'Complete' || project.workflow_status === 'Cancelled') return false;

      // If project has no dates, assume active
      if (!project.start_date && !project.target_end_date) return true;

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const pStart = project.start_date ? new Date(project.start_date) : null;
      if (pStart) pStart.setHours(0, 0, 0, 0);

      const pEnd = project.target_end_date ? new Date(project.target_end_date) : null;
      if (pEnd) pEnd.setHours(23, 59, 59, 999);

      if (pStart && pStart > weekEnd) return false;
      if (pEnd && pEnd < weekStart) return false;

      return true;
    };

    return (
      <>
        {/* Mobile Agenda View (US-MOBILE-002) */}
        {window.innerWidth < 768 ? (
          <MobileStaffView
            engineers={engineers}
            engineerSchedules={engineerSchedules}
            viewWeeks={viewWeeks}
          />
        ) : (
          <div className="workbench-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8FAFC' }}>
            {/* Top Header Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 2rem',
              background: 'white',
              borderBottom: '1px solid #E2E8F0',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>Staff Planning</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.875rem', background: '#F1F5F9', padding: '0.375rem 0.75rem', borderRadius: '6px' }}>
                  <span>📅 Week of {currentWeekLabel}</span>
                </div>

              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-primary" onClick={() => setShowAddEngModal(true)} style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>
                  Add Resource
                </button>
                <button className="btn" style={{ background: 'white', border: '1px solid #E2E8F0' }}>Cancel</button>
                <button className="btn btn-primary" style={{ padding: '0.5rem 1.5rem' }}>Save Grid</button>
              </div>
            </div>

            {/* Impact Summary Banner */}
            <div style={{
              display: 'flex',
              gap: '2rem',
              padding: '0.75rem 2rem',
              background: '#FEF2F2',
              borderBottom: '1px solid #FEE2E2',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#EF4444', textTransform: 'uppercase' }}>Current Impact</div>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8125rem', color: '#475569' }}>Unassigned Hours:</span>
                  <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '1rem' }}>{totalUnassignedHours}h</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8125rem', color: '#475569' }}>Team Overload:</span>
                  <span style={{ fontWeight: 700, color: '#EF4444', fontSize: '1rem' }}>{teamOverloadCount} Eng</span>
                </div>
              </div>
              {teamOverloadCount > 0 && (
                <div style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#B91C1C', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                  Capacity Alert: {teamOverloadCount} resources are currently over-allocated.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* Main Grid Area */}
              <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, left: 0, zIndex: 30, background: 'white', borderRadius: '12px 12px 0 0' }}>
                    <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '1rem' }}>Team Schedule</span>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#64748B' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><div style={{ width: 8, height: 8, background: '#EF4444', borderRadius: '50%' }}></div> P1 Critical</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><div style={{ width: 8, height: 8, background: '#64748B', borderRadius: '50%' }}></div> KTLO</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><div style={{ width: 8, height: 8, background: '#CBD5E1', borderRadius: '50%' }}></div> Available</div>
                    </div>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 'max-content' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', position: 'sticky', top: '56px', zIndex: 25 }}>
                        <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', width: '200px', position: 'sticky', left: 0, zIndex: 26, background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>Engineer</th>
                        {viewWeeks.map(week => (
                          <th key={week.id} style={{ textAlign: 'left', padding: '1rem', fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', borderBottom: '1px solid #E2E8F0', minWidth: '180px', background: '#F8FAFC' }}>{week.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {engineerSchedules.map(eng => (
                        <tr key={eng.id}>
                          <td
                            onMouseEnter={() => setHoveredEngineerId(eng.id)}
                            onMouseLeave={() => setHoveredEngineerId(null)}
                            style={{ padding: '1.25rem 1.5rem', verticalAlign: 'top', position: 'sticky', left: 0, zIndex: 10, background: 'white', borderBottom: '1px solid #F1F5F9', borderRight: '1px solid #F1F5F9' }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0F172A', cursor: 'pointer' }} onClick={() => setProfileEngineer(eng)}>{eng.name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.5rem' }}>{eng.role}</div>
                              </div>
                              {hoveredEngineerId === eng.id && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteEngineer(eng.id, eng.name); }}
                                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#EF4444', padding: '0 0 0 8px', fontSize: '0.875rem' }}
                                  title="Delete Resource"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>

                            {/* Capacity Bar */}
                            <div style={{ marginTop: '0.5rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', fontWeight: 700, marginBottom: '2px', color: eng.allocatedTotal > eng.effective ? '#EF4444' : '#10B981' }}>
                                <span>{eng.allocatedTotal}h / {eng.effective}h {eng.allocatedTotal > eng.effective && '(Over)'}</span>
                              </div>
                              <div style={{ height: '4px', background: '#F1F5F9', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{
                                  height: '100%',
                                  width: `${Math.min((eng.allocatedTotal / eng.effective) * 100, 100)}%`,
                                  background: eng.allocatedTotal > eng.effective ? '#EF4444' : '#10B981',
                                  borderRadius: '2px'
                                }}></div>
                              </div>
                            </div>
                          </td>

                          {viewWeeks.map(week => (
                            <td key={week.id} style={{ padding: '0.75rem', verticalAlign: 'top', minWidth: '180px', borderBottom: '1px solid #F1F5F9' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {eng.projectWeeklyTotals
                                  .filter(projAlloc => isProjectActiveInWeekHelper(projAlloc.id, week.rawDate))
                                  .map(projAlloc => (
                                    <AllocationCard
                                      key={projAlloc.id}
                                      allocation={{
                                        id: projAlloc.allocationId,
                                        name: projAlloc.name,
                                        hours: projAlloc.hours,
                                        category: projAlloc.category,
                                        priority: projAlloc.priority
                                      }}
                                      priorityColor={getPriorityColor(projAlloc.priority)}
                                      onDelete={handleDeleteAllocation}
                                      onUpdate={handleUpdateAllocation}
                                    />
                                  ))}

                                {/* Empty/Add target */}
                                <div
                                  onDragOver={handleDragOver}
                                  onDrop={(e) => handleDrop(e, eng.id)}
                                  onClick={(e) => setQuickAddTarget({ engineerId: eng.id, anchorRect: e.currentTarget.getBoundingClientRect() })}
                                  style={{
                                    height: '48px',
                                    border: '2px dashed #E2E8F0',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#94A3B8',
                                    fontSize: '0.75rem',
                                    background: 'rgba(248, 250, 252, 0.5)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(248, 250, 252, 0.8)';
                                    e.currentTarget.style.borderColor = '#94A3B8';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(248, 250, 252, 0.5)';
                                    e.currentTarget.style.borderColor = '#E2E8F0';
                                  }}
                                >
                                  + Allocate
                                </div>
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sidebar Area */}
              <div style={{ width: '300px', background: 'white', borderLeft: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>Project Backlog</div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.625rem', color: '#64748B', cursor: 'pointer' }}>
                      <input type="checkbox" checked={showFullyStaffed} onChange={(e) => setShowFullyStaffed(e.target.checked)} />
                      Show Done
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem', padding: '0.25rem', background: '#F1F5F9', borderRadius: '6px' }}>
                    {['All', 'P1 Only', 'Unassigned'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setBacklogFilter(tab)}
                        style={{
                          flex: 1,
                          border: 'none',
                          background: tab === backlogFilter ? 'white' : 'transparent',
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          padding: '0.375rem',
                          borderRadius: '4px',
                          boxShadow: tab === backlogFilter ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                          color: tab === backlogFilter ? '#2563EB' : '#64748B',
                          cursor: 'pointer'
                        }}>{tab}</button>
                    ))}
                  </div>
                </div>

                <div style={{ flex: 1, overflow: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {backlogProjects.map(proj => {
                    const totalReq = proj.total_hours_required || 0;
                    const totalAlloc = proj.total_hours_allocated || 0;
                    const progressPct = totalReq > 0 ? Math.round((totalAlloc / totalReq) * 100) : 100;

                    return (
                      <div
                        key={proj.id}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, proj)}
                        style={{
                          padding: '0.875rem',
                          border: '1px solid #E2E8F0',
                          borderRadius: '10px',
                          position: 'relative',
                          cursor: 'grab',
                          background: 'white',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}>
                        <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '0.625rem', fontWeight: 700, color: getPriorityColor(proj.priority), background: `${getPriorityColor(proj.priority)}10`, padding: '0.125rem 0.375rem', borderRadius: '4px' }}>
                          {proj.priority.split('-')[0]}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#0F172A', marginBottom: '0.4rem', paddingRight: '2.5rem' }}>{proj.name}</div>

                        {/* Role Chips */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.6rem' }}>
                          {(proj.role_staffing || []).map((rs, idx) => (
                            <div
                              key={idx}
                              title={`${rs.allocated}/${rs.required}h allocated`}
                              style={{
                                fontSize: '0.625rem',
                                fontWeight: 600,
                                padding: '0.125rem 0.375rem',
                                borderRadius: '4px',
                                background: rs.is_complete ? '#DCFCE7' : (rs.allocated > 0 ? '#FEF3C7' : '#F1F5F9'),
                                color: rs.is_complete ? '#166534' : (rs.allocated > 0 ? '#92400E' : '#64748B'),
                                border: `1px solid ${rs.is_complete ? '#BBF7D0' : (rs.allocated > 0 ? '#FDE68A' : '#E2E8F0')}`
                              }}
                            >
                              {rs.role.split(' ').map(w => w[0]).join('')}: {rs.is_complete ? '✓' : `${rs.allocated}h`}
                            </div>
                          ))}
                        </div>

                        {/* Progress Bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ flex: 1, height: '4px', background: '#F1F5F9', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${progressPct}%`,
                              background: progressPct === 100 ? '#10B981' : '#3B82F6',
                              borderRadius: '2px'
                            }}></div>
                          </div>
                          <span style={{ fontSize: '0.625rem', color: '#64748B', minWidth: '24px' }}>{progressPct}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Add Resource Modal */}
            {showAddEngModal && (
              <AddEngineerModal onClose={() => setShowAddEngModal(false)} onSave={fetchData} />
            )}

            {/* Quick Add Popover */}
            {quickAddTarget && (
              <QuickAddPopover
                projects={projects}
                anchorRect={quickAddTarget.anchorRect}
                onClose={() => setQuickAddTarget(null)}
                onSelect={(projectId) => {
                  handleAllocate(projectId, quickAddTarget.engineerId);
                  setQuickAddTarget(null);
                }}
              />
            )}
          </div>
        )}
      </>
    );
  };


  const renderProjects = () => {
    // Mobile Project Feed (US-MOBILE-003)
    if (window.innerWidth < 768) {
      return <MobileProjectView projects={projects} engineers={engineers} />;
    }

    const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];

    const getStatusColor = (status) => {
      const s = status?.toLowerCase() || '';
      if (s === 'healthy' || s === 'green' || s === 'on track' || s === 'active') return '#10B981';
      if (s === 'at risk' || s === 'amber') return '#F59E0B';
      if (s === 'blocked' || s === 'red' || s === 'issue') return '#EF4444';
      return '#94A3B8';
    };

    const getPriorityLabel = (priority) => {
      if (!priority) return 'P3';
      if (priority.includes('1') || priority.includes('Critical')) return 'P1';
      if (priority.includes('2') || priority.includes('Strategic')) return 'P2';
      if (priority.includes('3') || priority.includes('Standard')) return 'P3';
      return 'P4';
    };

    const getRagStatusBadge = (ragStatus) => {
      const status = ragStatus?.toLowerCase() || 'green';
      switch (status) {
        case 'green':
          return { label: 'On Track', bg: '#ECFDF5', color: '#059669', dot: '#10B981' };
        case 'amber':
          return { label: 'At Risk', bg: '#FEF3C7', color: '#D97706', dot: '#F59E0B' };
        case 'red':
          return { label: 'Critical', bg: '#FEE2E2', color: '#DC2626', dot: '#EF4444' };
        case 'issue':
          return { label: 'Issue', bg: '#E0E7FF', color: '#4338CA', dot: '#6366F1' };
        default:
          return { label: 'On Track', bg: '#ECFDF5', color: '#059669', dot: '#10B981' };
      }
    };

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

    const projectAllocations = currentProjectAllocations.map(alloc => {
      const eng = engineers.find(e => e.id === alloc.engineer_id);
      return {
        role: alloc.category || 'Project Work',
        engineer: eng?.name || 'Unassigned',
        initials: eng?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??',
        hours: alloc.hours,
        status: 'Assigned'
      };
    });



    const filteredProjects = projects.filter(p => {
      // First apply workflow status filter
      if (workflowFilter !== 'All' && (p.workflow_status || 'Draft') !== workflowFilter) return false;

      // Filter by search term
      if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;

      // Then apply the priority/health filter
      if (projectFilter === 'all') return true;
      if (projectFilter === 'p1') return getPriorityLabel(p.priority) === 'P1';
      if (projectFilter === 'at-risk') return p.rag_status?.toLowerCase() === 'amber' || p.rag_status?.toLowerCase() === 'red' || p.rag_status?.toLowerCase() === 'issue';
      return true;
    });

    const workflowStatuses = ['All', 'Draft', 'Pending Approval', 'Approved', 'Active', 'On Hold', 'Complete', 'Cancelled'];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8FAFC' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 2rem', background: 'white', borderBottom: '1px solid #E2E8F0' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Project Registry</h2>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: '#64748B' }}>Manage the end-to-end lifecycle of infrastructure initiatives.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn" style={{ background: 'white', border: '1px solid #E2E8F0', color: '#374151', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 500 }}>Export List</button>
            <button className="btn btn-primary" style={{ background: '#2563EB', color: 'white', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 500 }} onClick={() => setShowIntakeModal(true)}>+ New Project</button>
          </div>
        </div>

        {/* Workflow Tabs */}
        <div style={{ display: 'flex', gap: '0.25rem', padding: '0 2rem', background: 'white', borderBottom: '1px solid #E2E8F0', overflowX: 'auto' }}>
          {workflowStatuses.map(status => {
            const count = projects.filter(p => (p.workflow_status || 'Draft') === status || (status === 'All')).length;
            return (
              <button
                key={status}
                onClick={() => setWorkflowFilter(status)}
                style={{
                  padding: '0.875rem 1rem',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: workflowFilter === status ? '2px solid #2563EB' : '2px solid transparent',
                  color: workflowFilter === status ? '#0F172A' : '#64748B',
                  fontWeight: workflowFilter === status ? 600 : 500,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {status}
                <span style={{
                  background: workflowFilter === status ? '#DBEAFE' : '#F1F5F9',
                  color: workflowFilter === status ? '#2563EB' : '#64748B',
                  padding: '0.125rem 0.375rem',
                  borderRadius: '10px',
                  fontSize: '0.6875rem'
                }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Panel - Project List */}
          <div style={{ width: '340px', background: 'white', borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Search */}
            <div style={{ padding: '1rem' }}>
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '0.875rem' }}
              />
            </div>

            {/* Sub-Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', padding: '0 1rem 1rem' }}>
              <button
                onClick={() => setProjectFilter('all')}
                style={{
                  padding: '0.375rem 0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: projectFilter === 'all' ? '#2563EB' : '#F1F5F9',
                  color: projectFilter === 'all' ? 'white' : '#64748B',
                  cursor: 'pointer'
                }}
              >All</button>
              <button
                onClick={() => setProjectFilter('p1')}
                style={{
                  padding: '0.375rem 0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: projectFilter === 'p1' ? '#2563EB' : '#F1F5F9',
                  color: projectFilter === 'p1' ? 'white' : '#64748B',
                  cursor: 'pointer'
                }}
              >P1</button>
              <button
                onClick={() => setProjectFilter('at-risk')}
                style={{
                  padding: '0.375rem 0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: projectFilter === 'at-risk' ? '#2563EB' : '#F1F5F9',
                  color: projectFilter === 'at-risk' ? 'white' : '#64748B',
                  cursor: 'pointer'
                }}
              >At Risk</button>
            </div>

            {/* Project List */}
            <div style={{ flex: 1, overflow: 'auto', maxHeight: 'calc(100vh - 320px)' }}>
              {filteredProjects.map(proj => (
                <div
                  key={proj.id}
                  onClick={() => setSelectedProjectId(proj.id)}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid #F1F5F9',
                    cursor: 'pointer',
                    background: selectedProjectId === proj.id ? '#EFF6FF' : 'white',
                    borderLeft: selectedProjectId === proj.id ? '3px solid #2563EB' : '3px solid transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{
                      background: getPriorityLabel(proj.priority) === 'P1' ? '#DC2626' :
                        getPriorityLabel(proj.priority) === 'P2' ? '#F59E0B' :
                          getPriorityLabel(proj.priority) === 'P3' ? '#3B82F6' : '#6B7280',
                      color: 'white',
                      padding: '0.125rem 0.375rem',
                      borderRadius: '4px',
                      fontSize: '0.625rem',
                      fontWeight: 700
                    }}>{getPriorityLabel(proj.priority)}</span>
                    {proj.fiscal_year && (
                      <span style={{
                        background: '#EEF2FF',
                        color: '#4F46E5',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '4px',
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        border: '1px solid #C7D2FE'
                      }}>{proj.fiscal_year}</span>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0F172A', marginBottom: '0.125rem' }}>{proj.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                        <span style={{ color: '#64748B' }}>{proj.workflow_status || 'Draft'}</span>
                        <span style={{ color: '#CBD5E1' }}>•</span>
                        <span style={{
                          color: proj.rag_status?.toLowerCase() === 'red' ? '#EF4444' :
                            proj.rag_status?.toLowerCase() === 'amber' ? '#F59E0B' :
                              proj.rag_status?.toLowerCase() === 'issue' ? '#6366F1' : '#10B981',
                          fontWeight: 600
                        }}>{proj.rag_status || 'Healthy'}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                      <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>{proj.target_end_date ? `Due ${new Date(proj.target_end_date).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}` : 'No date'}</span>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: getStatusColor(proj.rag_status || 'green')
                      }}></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel - Project Detail */}
          <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem 2rem' }}>
            {selectedProject ? (
              <>
                {/* Project Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <span style={{
                        background: getPriorityLabel(selectedProject.priority) === 'P1' ? '#DC2626' : '#3B82F6',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}>{getPriorityLabel(selectedProject.priority)}</span>
                      <h3 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>{selectedProject.name}</h3>

                      {/* Workflow Status Chip */}
                      <span style={{
                        background: '#F1F5F9',
                        color: '#475569',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        border: '1px solid #E2E8F0',
                        marginLeft: '0.5rem'
                      }}>
                        {selectedProject.workflow_status || 'DRAFT'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#64748B', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div>
                        {selectedProject.fiscal_year && <span style={{ fontWeight: 700, color: '#4F46E5', marginRight: '0.5rem', background: '#EEF2FF', padding: '0.125rem 0.375rem', borderRadius: '4px', border: '1px solid #C7D2FE', fontSize: '0.75rem' }}>{selectedProject.fiscal_year}</span>}
                        {selectedProject.project_number && <span style={{ fontWeight: 600, color: '#475569', marginRight: '0.5rem' }}>#{selectedProject.project_number}</span>}
                        Owner: {engineers.find(e => e.id === selectedProject.owner_id)?.name || 'Unassigned'} • {formatDate(selectedProject.start_date)} - {formatDate(selectedProject.target_end_date)}
                      </div>
                      {selectedProject.project_site && (
                        <a
                          href={selectedProject.project_site}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#2563EB', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>{selectedProject.project_site}</span>
                        </a>
                      )}
                    </div>
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ background: '#1E293B', color: 'white', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 500 }}
                    onClick={() => setManagingProjectId(selectedProject.id)}
                  >Edit Project</button>
                </div>

                {/* Status Badge - Dynamic from project data */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  {(() => {
                    const badge = getRagStatusBadge(selectedProject.rag_status);
                    return (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        background: badge.bg,
                        color: badge.color,
                        padding: '0.375rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: badge.dot }}></span>
                        {badge.label}
                      </span>
                    );
                  })()}
                  <span style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
                    Last updated: {formatDate(selectedProject.updated_at)}
                  </span>
                </div>

                {selectedProject.business_justification && (
                  <div style={{
                    marginBottom: '1.5rem',
                    padding: '1rem 1.25rem',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Project Description</div>
                    <p style={{ fontSize: '0.875rem', color: '#334155', margin: 0, lineHeight: '1.6' }}>{selectedProject.business_justification}</p>
                  </div>
                )}

                {/* Project Hardware Section - Display devices */}
                {(() => {
                  const projectDevices = allDevices.filter(d => d.project_id === selectedProject.id);
                  if (projectDevices.length === 0) return null;

                  return (
                    <div style={{
                      marginBottom: '1.5rem',
                      padding: '1rem 1.25rem',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px'
                    }}>
                      <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Project Hardware</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {projectDevices.map(device => {
                          const netChange = device.proposed_qty - device.current_qty;
                          return (
                            <div
                              key={device.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 0.75rem',
                                background: 'white',
                                border: '1px solid #E2E8F0',
                                borderRadius: '6px',
                                fontSize: '0.8125rem'
                              }}
                            >
                              <span style={{ fontWeight: 600, color: '#0F172A' }}>{device.device_type}</span>
                              <span style={{ color: '#94A3B8' }}>•</span>
                              <span style={{ color: '#64748B' }}>
                                {device.current_qty} → {device.proposed_qty}
                              </span>
                              {netChange !== 0 && (
                                <span style={{
                                  fontWeight: 600,
                                  color: netChange > 0 ? '#10B981' : '#EF4444',
                                  fontSize: '0.75rem'
                                }}>
                                  ({netChange > 0 ? '+' : ''}{netChange})
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Health Status Reason - Only if present and status is not Green */}

                {selectedProject.rag_reason && (selectedProject.rag_status === 'Red' || selectedProject.rag_status === 'Issue' || selectedProject.rag_status === 'Amber') && (
                  <div style={{
                    marginBottom: '1.5rem',
                    padding: '0.75rem 1rem',
                    background: selectedProject.rag_status === 'Red' ? '#FEF2F2' : selectedProject.rag_status === 'Amber' ? '#FFFBEB' : '#EEF2FF',
                    border: `1px solid ${selectedProject.rag_status === 'Red' ? '#FECACA' : selectedProject.rag_status === 'Amber' ? '#FDE68A' : '#C7D2FE'}`,
                    borderRadius: '8px',
                    color: selectedProject.rag_status === 'Red' ? '#B91C1C' : selectedProject.rag_status === 'Amber' ? '#B45309' : '#4338CA',
                    fontSize: '0.875rem'
                  }}>
                    <strong>Reason for Status:</strong> {selectedProject.rag_reason}
                  </div>
                )}

                {/* Project Status */}
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A', marginBottom: '1rem' }}>Project Status</h4>
                  {selectedProject.latest_status_update ? (
                    <div style={{
                      background: '#F0F9FF',
                      borderLeft: '4px solid #3B82F6',
                      padding: '1.25rem 1.5rem',
                      borderRadius: '0 6px 6px 0'
                    }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1D4ED8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                        Latest Update • {formatDate(selectedProject.status_updated_at)}
                      </div>
                      <div style={{ fontSize: '0.9375rem', color: '#1E293B', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                        {selectedProject.latest_status_update}
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      background: '#F8FAFC',
                      borderRadius: '8px',
                      padding: '1.5rem',
                      textAlign: 'center',
                      color: '#64748B',
                      fontSize: '0.875rem',
                      border: '1px dashed #E2E8F0'
                    }}>
                      No status updates yet.
                    </div>
                  )}
                </div>


                {/* KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                  <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1rem' }}>
                    <div style={{ fontSize: '0.6875rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.375rem' }}>Total Allocated</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A' }}>{currentProjectAllocations.reduce((sum, a) => sum + a.hours, 0)}h/wk</div>
                  </div>
                  <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1rem' }}>
                    <div style={{ fontSize: '0.6875rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.375rem' }}>Engineers</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A' }}>{new Set(currentProjectAllocations.map(a => a.engineer_id)).size}</div>
                  </div>
                  <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1rem' }}>
                    <div style={{ fontSize: '0.6875rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.375rem' }}>Timeline</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A' }}>{Math.ceil((new Date(selectedProject.target_end_date) - new Date(selectedProject.start_date)) / (1000 * 60 * 60 * 24 * 7)) || 0} wks</div>
                  </div>
                  <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1rem' }}>
                    <div style={{ fontSize: '0.6875rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.375rem' }}>% Complete</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F59E0B' }}>{selectedProject.percent_complete || 45}%</div>
                  </div>
                </div>

                {/* Resource Requirements & Allocation */}
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A', marginBottom: '1rem' }}>Resource Requirements & Allocation</h4>
                  <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#F8FAFC' }}>
                          <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Role Required</th>
                          <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Assigned Engineer</th>
                          <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Hours/Week</th>
                          <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projectAllocations.map((alloc, i) => (
                          <tr key={i} style={{ borderTop: '1px solid #E2E8F0' }}>
                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 500, color: '#0F172A' }}>{alloc.role}</td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  background: '#E0E7FF',
                                  color: '#4338CA',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.6875rem',
                                  fontWeight: 600
                                }}>{alloc.initials}</span>
                                <span style={{ fontSize: '0.875rem', color: '#374151' }}>{alloc.engineer}</span>
                              </div>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#374151' }}>{alloc.hours}h</td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                              <span style={{
                                background: '#DCFCE7',
                                color: '#15803D',
                                padding: '0.25rem 0.625rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 600
                              }}>{alloc.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Timeline Progress */}
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#0F172A', marginBottom: '1rem' }}>Timeline Progress</h4>
                  <div style={{ background: '#E2E8F0', borderRadius: '8px', height: '32px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{
                      background: '#3B82F6',
                      height: '100%',
                      width: `${selectedProject.percent_complete || 0}%`,
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: '1rem'
                    }}>
                      <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 600 }}>{selectedProject.percent_complete || 0}%</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{formatDate(selectedProject.start_date)}</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{formatDate(selectedProject.target_end_date)}</span>
                  </div>
                </div>

                {/* RID Log - Risks, Issues, Decisions */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: '#0F172A' }}>Risk, Issue & Decision Log</h4>
                    <button
                      className="btn btn-primary"
                      style={{ background: '#2563EB', color: 'white', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 500 }}
                      onClick={() => setShowAddRidModal(true)}
                    >+ Add Entry</button>
                  </div>
                  {projectRidEntries.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {projectRidEntries.map((entry) => {
                        const typeColors = {
                          Risk: { bg: '#FEF3C7', border: '#F59E0B', text: '#B45309' },
                          Issue: { bg: '#FEE2E2', border: '#EF4444', text: '#DC2626' },
                          Decision: { bg: '#DBEAFE', border: '#3B82F6', text: '#1D4ED8' },
                        };
                        const colors = typeColors[entry.type] || typeColors.Risk;
                        return (
                          <div key={entry.id} style={{
                            background: colors.bg,
                            borderLeft: `4px solid ${colors.border}`,
                            padding: '0.875rem 1rem',
                            borderRadius: '0 6px 6px 0'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{
                                  background: 'white',
                                  color: colors.text,
                                  padding: '0.125rem 0.375rem',
                                  borderRadius: '4px',
                                  fontSize: '0.625rem',
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
                              </div>
                              <span style={{ fontSize: '0.75rem', color: colors.text, fontWeight: 500 }}>
                                {formatDate(entry.created_at)}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#374151', marginBottom: entry.owner ? '0.25rem' : 0 }}>{entry.description}</div>
                            {entry.owner && (
                              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Owner: {entry.owner}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{
                      background: '#F8FAFC',
                      borderRadius: '8px',
                      padding: '1.5rem',
                      textAlign: 'center',
                      color: '#64748B',
                      fontSize: '0.875rem'
                    }}>
                      No risks, issues, or decisions recorded yet.
                    </div>
                  )}
                </div>

              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8' }}>
                Select a project to view details
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        {showIntakeModal && (
          <div className="modal-overlay active">
            <div className="modal" style={{ width: 500 }}>
              <div className="modal-header">
                <h3>Submit Project Request</h3>
                <button className="modal-close" onClick={() => setShowIntakeModal(false)}>&times;</button>
              </div>
              <form onSubmit={createProject}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Project Name <span className="required">*</span></label>
                    <input name="name" className="form-input" placeholder="e.g. Data Center Refresh" required />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Priority Level</label>
                      <select name="priority" className="form-select">
                        <option value="P1-Critical">P1 - Critical</option>
                        <option value="P2-Strategic">P2 - Strategic</option>
                        <option value="P3-Standard">P3 - Standard</option>
                        <option value="P4-Low">P4 - Low</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Target Date</label>
                      <input type="date" name="target_end_date" className="form-input" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Estimated Size</label>
                    <select name="size" className="form-select">
                      <option value="S">Small (3h/wk)</option>
                      <option value="M">Medium (5h/wk)</option>
                      <option value="L">Large (8h/wk)</option>
                      <option value="XL">Extra Large (13h/wk)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Business Justification <span className="required">*</span></label>
                    <textarea name="business_justification" className="form-textarea" placeholder="Why is this work important?" required style={{ minHeight: '100px' }}></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn" onClick={() => setShowIntakeModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Submit Request</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {managingProjectId && (
          <ProjectDetailModal
            project={projects.find(p => p.id === managingProjectId)}
            onClose={() => setManagingProjectId(null)}
            engineers={engineers}
            onProjectUpdate={fetchData}
          />
        )}

        {showAddRidModal && selectedProjectId && (
          <AddRidModal
            projectId={selectedProjectId}
            onClose={() => setShowAddRidModal(false)}
            onSave={() => {
              const fetchRidEntries = async () => {
                try {
                  const res = await fetch(`${API_BASE}/api/projects/${selectedProjectId}/rid-log`);
                  if (res.ok) {
                    const data = await res.json();
                    setProjectRidEntries(data);
                  }
                } catch (error) {
                  console.error('Failed to refresh RID entries:', error);
                }
              };
              fetchRidEntries();
            }}
          />
        )}
      </div>
    );
  };

  const renderSupport = () => (
    <div className="support-content">
      <div className="top-bar">
        <h2>Support & Documentation</h2>
      </div>
      <div className="card">
        <div className="card-header">Help Center</div>
        <div className="card-body">
          <p>Welcome to the Resource Manager Help Center.</p>
          <br />
          <h3>Getting Started</h3>
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li><a href="#">User Guide</a></li>
            <li><a href="#">FAQ</a></li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      <button
        className="mobile-toggle"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? '✕ Close Menu' : '☰ Menu'}
      </button>
      {/* Toast Notification */}
      {notification.show && (
        <div style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          padding: '1rem 1.5rem',
          background: notification.type === 'success' ? '#10B981' : '#EF4444',
          color: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {notification.type === 'success' ? '✅' : '❌'} {notification.message}
        </div>
      )}
      {renderSidebar()}
      <main className="main-content">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            Loading Resource Manager...
          </div>
        ) : (
          <>
            <Breadcrumb />
            {currentPage === 'dashboard' && renderDashboard()}
            {currentPage === 'roster' && renderWorkbench()}
            {currentPage === 'projects' && renderProjects()}
            {currentPage === 'my-week' && <EngineerDashboard engineers={engineers} allAllocations={allAllocations} projects={projects} />}
            {currentPage === 'fiscal-report' && <FiscalReportPage projects={projects} allDevices={allDevices} />}
            {currentPage === 'scenario' && (
              <div style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem', minHeight: 'calc(100vh - 120px)' }}>
                {/* Scenarios Sidebar */}
                <div style={{
                  width: '260px',
                  flexShrink: 0,
                  background: 'white',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0F172A' }}>Scenarios</h3>
                    <button
                      onClick={handleCloneScenario}
                      style={{
                        background: '#2563EB',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.375rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      + New
                    </button>
                  </div>

                  {/* Baseline - Current Live Plan */}
                  <div style={{
                    padding: '0.875rem',
                    background: '#F8FAFC',
                    borderRadius: '8px',
                    marginBottom: '0.5rem',
                    border: '1px solid #E2E8F0'
                  }}>
                    <div style={{ fontSize: '0.625rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.25rem' }}>BASELINE</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>Current Live Plan</div>
                    <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '0.25rem' }}>Last sync: 10 min ago</div>
                  </div>

                  {/* Scenario Items */}
                  {[
                    { name: 'Q3 Expansion Plan', date: 'Jan 8, 2025', active: true },
                    { name: 'Priority Shift Test', date: 'Jan 5, 2025', active: false },
                    { name: 'Delayed Timeline', date: 'Dec 20, 2024', active: false }
                  ].map((scenario, i) => (
                    <div key={i} style={{
                      padding: '0.875rem',
                      background: scenario.active ? '#EFF6FF' : 'white',
                      borderRadius: '8px',
                      marginBottom: '0.5rem',
                      border: scenario.active ? '2px solid #2563EB' : '1px solid #E2E8F0',
                      cursor: 'pointer'
                    }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>{scenario.name}</div>
                      <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '0.25rem' }}>Created: {scenario.date}</div>
                    </div>
                  ))}
                </div>

                {/* Main Content */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#0F172A' }}>Scenario Builder</h2>
                      <span style={{
                        background: '#FEF3C7',
                        color: '#D97706',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem'
                      }}>
                        ✏️ Editing: Q3 Expansion Plan
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button style={{
                        background: 'white',
                        color: '#64748B',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}>Discard Changes</button>
                      <button style={{
                        background: '#2563EB',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}>Apply to Live Plan</button>
                    </div>
                  </div>

                  {/* Simulation Controls */}
                  <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#0F172A' }}>Simulation Controls</h3>
                      <button style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '0.75rem', cursor: 'pointer' }}>Reset All</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                      {/* ADD RESOURCES */}
                      <div>
                        <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.75rem' }}>ADD RESOURCES</div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          <select style={{ flex: 1, padding: '0.5rem', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '0.875rem' }}>
                            <option>Network Engineer</option>
                            <option>Wireless Specialist</option>
                            <option>Cloud Architect</option>
                          </select>
                          <button style={{ background: '#2563EB', color: 'white', border: 'none', borderRadius: '6px', padding: '0.5rem 0.75rem', cursor: 'pointer' }}>+</button>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          <strong>2 TBD Resources</strong> added
                          <div style={{ marginTop: '0.25rem', color: '#94A3B8' }}>• Network Engineer (40h)</div>
                          <div style={{ color: '#94A3B8' }}>• Firewall Specialist (32h)</div>
                        </div>
                      </div>

                      {/* ADJUST TIMELINE */}
                      <div>
                        <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.75rem' }}>ADJUST TIMELINE</div>
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#0F172A', marginBottom: '0.5rem' }}>SD-WAN Migration</div>
                          <input type="range" min="-4" max="4" defaultValue="2" style={{ width: '100%' }} />
                          <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>Start: +2 weeks (Nov 18)</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#0F172A', marginBottom: '0.5rem' }}>Wireless Upgrade</div>
                          <input type="range" min="-4" max="4" defaultValue="-4" style={{ width: '100%' }} />
                          <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>Start: -4 weeks (Sep 23)</div>
                        </div>
                      </div>

                      {/* PRIORITY REORDER */}
                      <div>
                        <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.75rem' }}>PRIORITY REORDER</div>
                        {[
                          { priority: 'P1', name: 'Core Router Refresh', color: '#FEE2E2' },
                          { priority: 'P2', name: 'Wireless Upgrade ↑', color: '#FEF3C7' },
                          { priority: 'P2', name: 'SD-WAN Migration', color: '#FEF3C7' }
                        ].map((p, i) => (
                          <div key={i} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 0.75rem',
                            background: p.color,
                            borderRadius: '6px',
                            marginBottom: '0.5rem',
                            fontSize: '0.8125rem',
                            cursor: 'grab'
                          }}>
                            <span style={{ fontWeight: 700, fontSize: '0.75rem' }}>{p.priority}:</span>
                            <span>{p.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Impact KPI Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                    {[
                      { label: 'VOID HOURS', value: '-120h', bg: '#1E293B', color: 'white' },
                      { label: 'OVER-ALLOCATED', value: '-1 Eng', bg: '#EF4444', color: 'white' },
                      { label: 'PROJECTS AFFECTED', value: '3', bg: '#3B82F6', color: 'white' },
                      { label: 'TIMELINE IMPACT', value: '+2 wks', bg: '#10B981', color: 'white' }
                    ].map((kpi, i) => (
                      <div key={i} style={{
                        background: kpi.bg,
                        color: kpi.color,
                        borderRadius: '8px',
                        padding: '1rem 1.25rem',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', opacity: 0.8, marginBottom: '0.25rem' }}>{kpi.label}</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{kpi.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Side-by-Side Comparison */}
                  <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1rem', fontWeight: 600, color: '#0F172A' }}>Side-by-Side Comparison</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                      {/* Current Live Plan */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                          <span style={{ width: 8, height: 8, background: '#64748B', borderRadius: '50%' }}></span>
                          <span style={{ fontWeight: 600, color: '#0F172A' }}>Current Live Plan</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(4, 1fr)', gap: '0.25rem', fontSize: '0.75rem' }}>
                          <div></div>
                          {['Oct 21', 'Oct 28', 'Nov 4', 'Nov 11'].map(w => <div key={w} style={{ textAlign: 'center', color: '#64748B', fontWeight: 500 }}>{w}</div>)}
                          {[
                            { name: 'S. Chen', vals: [95, 110, 105, 88] },
                            { name: 'M. Davis', vals: [80, 70, 40, 30] },
                            { name: 'J. Kim', vals: [90, 115, 105, 65] }
                          ].map(eng => (
                            <React.Fragment key={eng.name}>
                              <div style={{ fontWeight: 500, color: '#0F172A', padding: '0.25rem 0' }}>{eng.name}</div>
                              {eng.vals.map((v, i) => (
                                <div key={i} style={{
                                  background: v > 100 ? '#EF4444' : v > 85 ? '#F59E0B' : v > 60 ? '#10B981' : '#3B82F6',
                                  color: 'white',
                                  borderRadius: '4px',
                                  padding: '0.375rem',
                                  textAlign: 'center',
                                  fontWeight: 600
                                }}>{v}%</div>
                              ))}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>

                      {/* Q3 Expansion Plan */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                          <span style={{ width: 8, height: 8, background: '#2563EB', borderRadius: '50%' }}></span>
                          <span style={{ fontWeight: 600, color: '#0F172A' }}>Q3 Expansion Plan</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(4, 1fr)', gap: '0.25rem', fontSize: '0.75rem' }}>
                          <div></div>
                          {['Oct 21', 'Oct 28', 'Nov 4', 'Nov 11'].map(w => <div key={w} style={{ textAlign: 'center', color: '#64748B', fontWeight: 500 }}>{w}</div>)}
                          {[
                            { name: 'S. Chen', vals: [75, 90, 85, 70] },
                            { name: 'M. Davis', vals: [75, 70, 65, 50] },
                            { name: 'J. Kim', vals: [85, 95, 90, 65] }
                          ].map(eng => (
                            <React.Fragment key={eng.name}>
                              <div style={{ fontWeight: 500, color: '#0F172A', padding: '0.25rem 0' }}>{eng.name}</div>
                              {eng.vals.map((v, i) => (
                                <div key={i} style={{
                                  background: v > 100 ? '#EF4444' : v > 85 ? '#F59E0B' : v > 60 ? '#10B981' : '#3B82F6',
                                  color: 'white',
                                  borderRadius: '4px',
                                  padding: '0.375rem',
                                  textAlign: 'center',
                                  fontWeight: 600
                                }}>{v}%</div>
                              ))}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    <div style={{ background: '#1E293B', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>VOID WORK CLEARED</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10B981' }}>120h</div>
                    </div>
                    <div style={{ background: '#10B981', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' }}>OVER-ALLOCATED FIXED</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>1</div>
                    </div>
                    <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '1rem', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>NEW COST (2 TBD)</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A' }}>+$200k/yr</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {currentPage === 'support' && renderSupport()}
          </>
        )}
      </main>

      {/* Engineer Profile Modal - rendered at top level for proper z-index */}
      {profileEngineer && (
        <EngineerProfileModal
          engineer={profileEngineer}
          allocations={allAllocations.filter(a => a.engineer_id === profileEngineer.id)}
          projects={projects}
          onClose={() => setProfileEngineer(null)}
        />
      )}
    </div>
  );
}

// Wrapper component that handles authentication
function AppWithAuth() {
  const { isAuthenticated, loading, logout, user } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F8FAFC'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.25rem', color: '#64748B' }}>Loading...</div>
        </div>
        {/* Admin Page Content */}
        {currentPage === 'admin' && (
          <div style={{ height: 'calc(100vh - 64px)', overflowY: 'auto', background: '#F8FAFC' }}>
            <ActivityLog API_BASE={API_BASE} />
            <div style={{ borderTop: '1px solid #E2E8F0', marginTop: '2rem' }}></div>
            <SnapshotManager API_BASE={API_BASE} />
          </div>
        )}
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage showIntake={() => window.dispatchEvent(new CustomEvent('show-intake'))} />
        <App isGuestMode={true} />
      </>
    );
  }

  return <App />;
}

// Export with AuthProvider wrapper
export default function AppWrapper() {
  return (
    <AuthProvider>
      <AppWithAuth />
    </AuthProvider>
  );
}
