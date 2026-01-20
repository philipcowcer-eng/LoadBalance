# User Stories: Roadmap Phase 1 & Phase 2

This document details the user stories for Phase 1 (High-Impact Wins) and Phase 2 (Operational Efficiency), incorporating perspectives from both a **Product Manager** (Value & Acceptance) and a **Full-Stack Engineer** (Implementation Details).

---

## � Quality & Standards (Definition of Done)
*Industry best practices to be applied to ALL stories below.*

*   **🧪 Testable:** All acceptance criteria must be verified with automated tests (Unit for backend logic, Component tests for UI).
*   **♿ Accessible:** All new UI elements must support keyboard navigation and pass WCAG AA contrast ratios (especially color-coded alerts).
*   **🔒 Secure:** All endpoints must enforce the RBAC permissions defined in `AuthContext`.
*   **📱 Responsive:** Features must fully render on mobile viewports (375px width) without breaking layout.

---

## �🚀 Phase 1: High-Impact "Win" Features
*Goal: Provide immediate strategic value to leadership and enforce organizational culture.*

### US-1.1: "Add-a-Head" Simulation (Strategic Weapon)
**As a** Director level PgM,  
**I want to** add theoretical resources (e.g., "TBD Contractor") to a sandbox scenario,  
**So that** I can demonstrate exactly how much "Void Work" (unassigned demand) could be cleared with more budget.

*   **PM Perspective:**
    *   **Value:** Turns the tool into a budget negotiation weapon. Shows ROI of headcount.
    *   **Success Metric:** ≥ 3 "Budget Simulation" scenarios created by leadership in Q1.
    *   **Acceptance Criteria:**
        *   Ability to add "Virtual Resources" with defined capacity (e.g., 40h).
        *   Dashboard shows "Void Hours Cleared" vs. "Remaining Void".
        *   Simulation report is exportable for executive reviews.
*   **Engineering Perspective (FSE):**
    *   **Implementation:** 
        *   Extend the `Scenario` model to support `VirtualResources` table.
        *   Modify the allocation engine to treat virtual resources identical to real ones in sandbox mode.
        *   Frontend: Add "+ Add Virtual Resource" button in Scenario Builder sidebar.
        *   Backend: Ensure virtual resources are NOT calculated in live capacity reports.

### US-1.2: "Deep Work" Guardian (Cultural Enforcement)
**As a** Lead PM,  
**I want** a visual warning when non-project allocations (Meetings, Admin, Ops) are scheduled on protected "Deep Work" days (Tue/Thu),  
**So that** we adhere to the culture of focused engineering time.

*   **PM Perspective:**
    *   **Value:** Enforces organizational behavior. Prevents "death by 1000 meetings".
    *   **Success Metric:** < 15% of engineering hours on Tue/Thu allocated to non-project categories.
    *   **Acceptance Criteria:**
        *   System flags allocations tagged as "Overhead/Meeting" on Tue/Thu with a yellow ⚠️.
        *   Requires a "Policy Justification" reason to override (drop-down: emergency/fixed-deadline/etc).
*   **Engineering Perspective (FSE):**
    *   **Implementation:** 
        *   Add a `global_policies` table to store protected days.
        *   Frontend: Enhance `AllocationRow` to check date against policy.
        *   Backend: Add `policy_violation` field to `Allocation` model (stores the reason string).
        *   Audit Log: Record all policy overrides for later compliance reporting.

---

## 🛠 Phase 2: Operational Efficiency
*Goal: Improve data accuracy, trust, and ease of use.*

### US-2.1: Dynamic Role-Based KTLO Tax
**As a** Program Manager,  
**I want to** define default KTLO (Keep The Lights On) tax rates based on job roles (e.g., Ops = 50%, Architect = 10%),  
**So that** I don't have to manually set it for every individual.

*   **PM Perspective:**
    *   **Value:** Reduces administrative friction and ensures realistic capacity by default.
    *   **Success Metric:** 90% of roster uses role-based defaults vs manual overrides.
    *   **Acceptance Criteria:**
        *   Admin can set global defaults per role in Settings.
        *   Individual overrides are still possible on a per-engineer basis.
*   **Engineering Perspective (FSE):**
    *   **Implementation:**
        *   Add `default_ktlo_tax` field to the `Roles` configuration/enum.
        *   Modify `Engineer` creation logic to inherit the role's tax if not specified.
        *   Add a migration to update existing engineers to role defaults.

### US-2.2: Secure Project Data (RBAC)
**As a** Security Officer,  
**I want to** ensure only authorized users can see sensitive project financial data or edit Snapshots,  
**So that** we maintain compliance and operational safety.

*   **PM Perspective:**
    *   **Value:** Trust. Enterprise ready. Prevents accidental data loss.
    *   **Success Metric:** 0 incidents of unauthorized snapshot restoration or financial data leakage.
    *   **Acceptance Criteria:**
        *   Granular permissions for: Snapshots, Financials, Roster Editing.
        *   "Viewer" role see read-only dashboards (Edit buttons hidden/disabled).
        *   **Empty State:** Unauthorized areas display "Access Restricted" friendly message.
*   **Engineering Perspective (FSE):**
    *   **Implementation:**
        *   Implement `require_permission` decorator in FastAPI.
        *   Modify `context/AuthContext.jsx` to cache specific permission flags (e.g., `canEditRoster: true`).
        *   Frontend: Hide/Disable buttons based on the `can` utility.

### US-2.3: Bulk Operations (Quality of Life)
**As a** Resource Manager,  
**I want to** bulk edit projects (e.g., "Move all Q2 projects to On Hold"),  
**So that** I can handle mass priority shifts in seconds rather than hours.

*   **PM Perspective:**
    *   **Value:** Time = Retention. High-volume environment support.
    *   **Success Metric:** Average time to re-plan a quarter reduced by 50%.
    *   **Acceptance Criteria:**
        *   Checkbox selection on Project Registry (with "Select All" header).
        *   "Action" bar appears on selection (Update Status, Assign PM, Change FY).
*   **Engineering Perspective (FSE):**
    *   **Implementation:**
        *   Create `PUT /api/projects/bulk` endpoint accepting a list of IDs and a payload.
        *   Use SQL `IN` operator for efficient mass updates.
        *   Frontend: Implement multi-select state in the list view.

### US-2.4: Work Breakdown Structure (Roadmap 2.5)
**As a** Project Lead,  
**I want to** define tasks and milestones within a project,  
**So that** I can track progress at a more granular level than just the overall project.

*   **PM Perspective:**
    *   **Value:** Precision tracking. Identifies exactly where a project is stalling.
    *   **Success Metric:** > 40% of Active projects utilize granular tasks/milestones.
    *   **Acceptance Criteria:**
        *   Add/Remove tasks within the Project Modal.
        *   Each task has: Name, Status, **Start Date**, **End Date**, and optional Assignee.
        *   **Roll-up:** Project Status is *not* auto-driven by tasks (manual override remains king).
*   **Engineering Perspective (FSE):**
    *   **Implementation:**
        *   Create `project_tasks` table with foreign key to `projects`.
        *   Schema includes: `start_date` and `end_date` columns.
        *   Frontend: Add a "Tasks" tab to the Project Modal.
        *   Backend: Add CRUD endpoints for tasks.

### US-2.5: Project Specific Roles (Roadmap 2.6)
**As a** Resource Manager,  
**I want to** define roles needed for a project (e.g., "SME", "Lead") separate from HR titles,  
**So that** I can clarify exactly what an engineer's contribution is on a specific initiative.

*   **PM Perspective:**
    *   **Value:** Accountability. Distinguishes between support staff and decision-makers on a project.
    *   **Success Metric:** "Lead Engineer" role assigned to 100% of P1/P2 projects.
    *   **Acceptance Criteria:**
        *   Dropdown in the Allocation form to select a "Project Role".
        *   Role appears in the engineer's "My Week" view.
*   **Engineering Perspective (FSE):**
    *   **Implementation:**
        *   Add `project_role` field to `ProjectAllocation` model.
        *   Frontend: Update the assignment dropdown to include role selection.

### US-2.6: Capacity Threshold Email Alerts (Roadmap 2.7)
**As a** Network Manager,  
**I want to** receive a **weekly summary email** highlighting engineers whose utilization exceeds 110%,  
**So that** I can spot burnout risks without having to manually scour the dashboard every day.

*   **PM Perspective:**
    *   **Value:** Proactive burnout prevention. Ensures the tool "pushes" data to users.
    *   **Success Metric:** Open rate of > 60% for weekly capacity digest.
    *   **Acceptance Criteria:**
        *   Global setting for "Alert Threshold" (default 110%).
        *   Email delivered at 09:00 AM every Monday (server time).
        *   Content includes: Engineer Name, Total Hours, and "Deep Work" violation count.
*   **Engineering Perspective (FSE):**
    *   **Implementation:**
        *   Integrate a mail service (e.g., SendGrid/Amazon SES).
        *   Create a Celery/Cron worker to run `calculate_weekly_burnout()` job.
        *   Template-based emails (Jinja2) with deep links back to the specific engineer's profile.

### US-2.7: Project Notes & Context (Roadmap 2.9)
**As a** Program Manager,  
**I want to** add timestamped notes/comments to a project,  
**So that** contextual info (e.g., "Vendor delay on hardware") is preserved in the audit trail.

*   **PM Perspective:**
    *   **Value:** Captures institutional knowledge. Explains the "Why" behind timeline shifts.
    *   **Success Metric:** Average of 3+ notes per month on "At Risk" projects.
    *   **Acceptance Criteria:**
        *   "Notes" feed in the Project Modal.
        *   Ability to @mention users or tag with categories (e.g., #BLOCKER).
*   **Engineering Perspective (FSE):**
    *   **Implementation:**
        *   Create `project_notes` table.
        *   Frontend: Real-time comment feed (using standard polling or WebSockets).
        *   Backend: Markdown support in note content.

---

## 🗓 Roadmap Integration

| Story ID | Phase | Priority | Primary Stack | Effort |
|---|---|---|---|---|
| US-1.1 | 1 | Critical | Backend + Data Viz | High |
| US-1.2 | 1 | High | Frontend + Policy Logic | Med |
| US-2.1 | 2 | Med | Backend | Low |
| US-2.2 | 2 | Critical | Full Stack (Security) | Med |
| US-2.3 | 2 | High | Frontend UX | Med |
| US-2.4 | 2 | Med | Full Stack | Med |
| US-2.5 | 2 | Med | Frontend/DB | Low |
| US-2.6 | 2 | High | Infrastructure/Worker | Med |
| US-2.7 | 2 | Med | Full Stack | Med |
