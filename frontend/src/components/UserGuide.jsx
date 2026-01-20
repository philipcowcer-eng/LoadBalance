import React, { useState } from 'react';

const UserGuide = () => {
    const [activeTab, setActiveTab] = useState('intro');

    const sections = {
        intro: 'Introduction',
        personas: 'User Roles',
        lifecycle: 'Project Life Cycle',
        faq: 'FAQ'
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '2rem' }}>
            {/* Sidebar Navigation for Docs */}
            <div style={{ width: '250px', flexShrink: 0 }}>
                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', position: 'sticky', top: '2rem' }}>
                    <div style={{ padding: '1rem', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontWeight: 600, color: '#0F172A' }}>
                        Documentation
                    </div>
                    <div>
                        {Object.entries(sections).map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '0.75rem 1rem',
                                    background: activeTab === key ? '#EFF6FF' : 'white',
                                    border: 'none',
                                    borderLeft: activeTab === key ? '3px solid #3B82F6' : '3px solid transparent',
                                    color: activeTab === key ? '#1D4ED8' : '#64748B',
                                    fontWeight: activeTab === key ? 600 : 400,
                                    cursor: 'pointer',
                                    fontSize: '0.875rem'
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1, color: '#334155', lineHeight: 1.6 }}>
                {activeTab === 'intro' && (
                    <div className="fade-in">
                        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#0F172A', marginBottom: '1rem' }}>Welcome to Resource Manager</h1>
                        <p style={{ fontSize: '1.125rem', marginBottom: '2rem' }}>
                            A comprehensive tool designed to streamline capacity planning, project tracking, and resource allocation for network engineering teams.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                <h3 style={{ color: '#0F172A', marginTop: 0 }}>Step 1: Intake</h3>
                                <p>Projects are ingested from downstream systems or created manually.</p>
                            </div>
                            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                <h3 style={{ color: '#0F172A', marginTop: 0 }}>Step 2: Plan</h3>
                                <p>Resource Managers assess capacity and assign engineers to projects.</p>
                            </div>
                            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                <h3 style={{ color: '#0F172A', marginTop: 0 }}>Step 3: Execute</h3>
                                <p>Engineers track tasks and update status in real-time.</p>
                            </div>
                            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                <h3 style={{ color: '#0F172A', marginTop: 0 }}>Step 4: Report</h3>
                                <p>Fiscal reports and utilization metrics drive future planning.</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'personas' && (
                    <div className="fade-in">
                        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#0F172A', marginBottom: '1.5rem' }}>User Roles & Personas</h1>

                        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
                            <img src="/persona_overview.png" alt="Persona Overview" style={{ maxWidth: '100%', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                            <p style={{ marginTop: '1rem', color: '#64748B', fontSize: '0.875rem' }}>The Resource Manager ecosystem connects various stakeholders.</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <PersonaCard
                                title="Resource Manager"
                                color="#2563EB"
                                description="Responsible for team capacity, assigning projects, and balancing workload."
                                responsibilities={[
                                    "Reviewing intake backlog",
                                    " allocating engineers to projects",
                                    "Monitoring team utilization (burnout prevention)",
                                    "Resolving resource conflicts"
                                ]}
                            />
                            <PersonaCard
                                title="Project Manager"
                                color="#7C3AED"
                                description="Focuses on project delivery, timelines, and milestones."
                                responsibilities={[
                                    "Creating new project requests",
                                    "Defining project requirements (RIDs)",
                                    "Tracking project status and blockers",
                                    "Collaborating with assigned engineers"
                                ]}
                            />
                            <PersonaCard
                                title="Engineer"
                                color="#059669"
                                description="The executor of technical work."
                                responsibilities={[
                                    "Viewing assigned tasks in 'My Week'",
                                    "Updating task status (Todo -> In Progress -> Done)",
                                    "Flagging blockers or risks",
                                    "Logging technical notes"
                                ]}
                            />
                            <PersonaCard
                                title="Admin"
                                color="#475569"
                                description="System configuration and user management."
                                responsibilities={[
                                    "Managing user accounts and roles",
                                    "Configuring system settings",
                                    "Performing database snapshots/backups",
                                    "Audit log review"
                                ]}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'lifecycle' && (
                    <div className="fade-in">
                        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#0F172A', marginBottom: '1.5rem' }}>Project Life Cycle</h1>

                        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
                            <img src="/project_lifecycle.png" alt="Project Lifecycle" style={{ maxWidth: '100%', borderRadius: '8px' }} />
                        </div>

                        <div style={{ borderLeft: '2px solid #E2E8F0', paddingLeft: '2rem', marginLeft: '1rem' }}>
                            <LifecycleStage
                                title="1. Intake & Triage"
                                content="Projects start in the backlog. They are either imported via CSV or created manually. At this stage, they are unassigned and require initial scoping."
                            />
                            <LifecycleStage
                                title="2. Resource Allocation"
                                content="Resource Managers review the backlog. Using the 'Staff Planning' view, they match project requirements with available engineer capacity. This creates an 'Allocation' record."
                            />
                            <LifecycleStage
                                title="3. Active Development"
                                content="Once staffed, the project moves to 'Active'. Engineers see the project in their dashboard. They break down work into tasks, update percentage complete, and log risks/issues (RAID log)."
                            />
                            <LifecycleStage
                                title="4. Verification & Closeout"
                                content="Upon completion, the project is marked as 'Done'. Resources are released back to the pool. The project data feeds into historical fiscal reports for future estimation."
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'faq' && (
                    <div className="fade-in">
                        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#0F172A', marginBottom: '1.5rem' }}>Frequently Asked Questions</h1>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <FAQItem
                                question="How do I add a new engineer to the system?"
                                answer="Go to Admin Settings > User Management, or use the 'Add Engineer' button on the Staff Planning screen (if you have permissions)."
                            />
                            <FAQItem
                                question="Why can't I edit a project?"
                                answer="Editing is restricted based on your role. Engineers can edit tasks but not high-level project details. Ensure you have the correct permissions or contact an Admin."
                            />
                            <FAQItem
                                question="What does 'KTLO' mean?"
                                answer="KTLO stands for 'Keep The Lights On'. It represents recurring operational work that reduces an engineer's available capacity for new projects."
                            />
                            <FAQItem
                                question="How do I change an engineer's KTLO tax?"
                                answer="Click on the engineer's name to open their profile. Select 'Edit Profile', modify the 'KTLO Tax (hrs)' field, and save your changes."
                            />
                            <FAQItem
                                question="How is 'Utilization' calculated?"
                                answer="Utilization = (Allocated Project Hours + KTLO) / Total Weekly Capacity. We target 80-90% utilization. Overloads (>100%) are highlighted in red in the 'Team Overload' banner."
                            />
                            <FAQItem
                                question="How do I add Skills to an engineer?"
                                answer="Click on an engineer's name in the Staff Planning grid to open their profile. Click 'Edit' and enter skills (e.g., 'BGP, Python') in the Skills field. You can then filter the schedule using the dropdown at the top."
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper Components
const PersonaCard = ({ title, description, responsibilities, color }) => (
    <div style={{ background: 'white', borderLeft: `4px solid ${color}`, padding: '1.5rem', borderRadius: '0 8px 8px 0', border: '1px solid #E2E8F0', borderLeftWidth: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <h3 style={{ color: color, marginTop: 0, fontSize: '1.25rem' }}>{title}</h3>
        <p style={{ fontStyle: 'italic', marginBottom: '1rem' }}>{description}</p>
        <h4 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: '#64748B', marginBottom: '0.5rem' }}>Key Responsibilities:</h4>
        <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
            {responsibilities.map((r, i) => <li key={i} style={{ marginBottom: '0.25rem' }}>{r}</li>)}
        </ul>
    </div>
);

const LifecycleStage = ({ title, content }) => (
    <div style={{ marginBottom: '2rem', position: 'relative' }}>
        <div style={{ position: 'absolute', left: '-2.4rem', top: '0', w: '16px', h: '16px', background: 'white', border: '4px solid #3B82F6', borderRadius: '50%', width: '16px', height: '16px' }}></div>
        <h3 style={{ marginTop: 0, color: '#0F172A' }}>{title}</h3>
        <p>{content}</p>
    </div>
);

const FAQItem = ({ question, answer }) => (
    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
        <h3 style={{ marginTop: 0, fontSize: '1.1rem', color: '#1E293B' }}>{question}</h3>
        <p style={{ margin: 0, color: '#475569' }}>{answer}</p>
    </div>
);

export default UserGuide;
