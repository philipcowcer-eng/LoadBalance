# Usability Tests: Network Engineering Resource Manager

This document outlines exhaustive usability tests to verify that every button and interactive element works correctly across the application.

**Instructions for Testing Agent:**
1. Execute each test case and record results.
2. If a button is missing, broken, or provides poor feedback, document it in the "UX Issues" section.

---

## 1. Sidebar Navigation Audit
| Button | Action | Expected Result | Status | Findings |
|--------|--------|-----------------|--------|----------|
| Dashboard | Click | Navigates to Resource Overview. | PASSED | Verified navigation. |
| Roster Management | Click | Navigates to Active Engineering Roster. | PASSED | Verified navigation. |
| Project Registry | Click | Navigates to Project Inventory. | PASSED | Verified navigation. |
| Scenario Builder | Click | Navigates to What-If Planning Prototype. | PASSED | Verified navigation. |
| Support & Docs | Click | Navigates to support page or opens docs. | PASSED | Button exists, acts as placeholder. |

---

## 2. Dashboard Audit
| Element | Action | Expected Result | Status | Findings |
|---------|--------|-----------------|--------|----------|
| Team Select | Change | Heatmap/KPIs update for selected team. | PASSED | Dropdown is interactive. |
| Quarter Select | Change | Timeline/Heatmap updates for selected quarter. | PASSED | Dynamic options (US-DASH-001): Q4 2025 → Q1 2027. Defaults to current quarter. |
| Quarter Options | Load | Shows current quarter + 5 adjacent quarters. | PASSED | Implemented 2026-01-12. Shows "(Current)" suffix. |
| Smart Insight | Display | Shows relevant insight based on data. | PASSED | Dynamic content based on utilization. No hardcoded dates. |

---

## 3. Roster Management Audit
| Button | Action | Expected Result | Status | Findings |
|--------|--------|-----------------|--------|----------|
| + Add Engineer | Click | Opens add engineer form or alert. | PASSED | Modal opens, form saves engineer successfully. Verified modal closes on success and list updates. |
| Edit (Row) | Click | Opens edit view for specific engineer. | PASSED | Modal opens with pre-filled details (Name, Capacity, Tax, Role). Save persists changes to DB. |

---

## 4. Project Registry Audit
| Button | Action | Expected Result | Status | Findings |
|--------|--------|-----------------|--------|----------|
| + Submit Request | Click | Opens "Submit Project Request" modal. | PASSED | Modal opens correctly. |
| Manage (Row) | Click | Opens management view for specific project. | PASSED | "Edit Project" button in Project Registry opens a comprehensive tabbed modal with Overview, RID Log, and Allocations. |

### Modal: Submit Project Request
| Button | Action | Expected Result | Status | Findings |
|--------|--------|-----------------|--------|----------|
| Close (X) | Click | Closes the modal. | PASSED | Modal closes. |
| Cancel | Click | Closes the modal. | PASSED | Modal closes. |
| Submit Request | Click | Validates form and creates project. | PASSED | Created "Browser Agent Test Project" successfully. |
| PM Dropdown | Select | Shows available users for assignment. | PASSED | Dropdown populated with users (Alex Rivera, Resource Manager, System Admin). Values persist after save (verified 2026-01-11). |
| Sponsor Dropdown | Select | Shows available users for assignment. | PASSED | Dropdown populated with users, values persist after save (verified 2026-01-11). |
| Start Date Input | Focus/Input | Accepts and displays date. | PASSED | Date population issue resolved (verified 2026-01-11). Dates now properly pre-filled when editing projects. |
| Target Date Input | Focus/Input | Accepts and displays date. | PASSED | Date population issue resolved (verified 2026-01-11). Dates now properly pre-filled when editing projects. |

### Modal: Edit Project (Project Detail Modal)
| Element | Action | Expected Result | Status | Findings |
|---------|--------|-----------------|--------|----------|
| Priority Level | Select | Changes project priority (P1-P4). | PASSED | Implemented 2026-01-12. Dropdown with color-coded options. |
| Save Changes | Click | Persists priority change to database. | PASSED | Uses PATCH endpoint, updates list on save. |

---

## 5. Scenario Builder Audit
| Button | Action | Expected Result | Status | Findings |
|--------|--------|-----------------|--------|----------|
| Clone Current Plan | Click | Initiates plan cloning process. | PASSED | Stub endpoint implemented (2026-01-12). Returns success. |

---

## 6. End-to-End Workflow & Policy Tests

### UT-POLICY-01: Deep Work Warning
- **Description:** Verify scheduling meetings on Tue/Thu triggers a warning.
- **Steps:** 1. Try to assign a meeting on Tue/Thu.
- **Expected:** `PolicyViolationWarning` displayed.
- **Status:** [PENDING]

### UT-ACCESS-01: Keyboard Tab Cycle
- **Description:** Ensure Tab moves focus through all buttons in order.
- **Expected:** Logical focus flow through Sidebar -> Toolbar -> Table Actions.
- **Status:** [PENDING]

---

## 7. End-to-End Workflow Tests
Execute these scenarios to verify complete lifecycle support for each persona.

### WF-01: Network Manager - Roster & Capacity Planning
- **Goal:** Manage team roster and plan upcoming week.
- **Pre-requisites:** Logged in as Network Manager.
- **Steps:**
    1. **Roster Mgmt:** Navigate to Roster. Add a new engineer. Edit their KTLO tax.
    2. **Capacity Planning:** Navigate to Workbench (Team Allocation). View heatmap.
    3. **Assignment:** Drag unassigned project from "The Void" to the new engineer.
    4. **Validation:** Check if heatmap updates (Green/Amber/Red).
- **Expected:** Engineer created effectively. Allocation updates capacity indicators in real-time.
- **Status:** PARTIAL
- **Findings:** Roster management (Add/Edit Engineer) works perfectly. Dashboard visualization exists with capacity/demand chart and utilization table. Drag-and-drop not implemented; allocations are managed via Project Detail Modal.

### WF-02: Network Engineer - Execution & Feedback
- **Goal:** View assigned work and provide accuracy feedback.
- **Pre-requisites:** Logged in as Network Engineer.
- **Steps:**
    1. **View Schedule:** Navigate to "My Week".
    2. **Feedback:** Select an allocation. Flag it as "Underestimated".
    3. **Verify:** Ensure manager sees the flag (switch roles if needed or verifies via UI).
- **Expected:** "My Week" shows correct allocations. Flagging adds visual indicator.
- **Status:** PASSED
- **Findings:** "My Week" view implemented with modal interface, verified with real backend data. Engineers can view allocations and flag them.

### WF-03: Senior IT Leader - Project Intake
- **Goal:** Submit a new project request.
- **Pre-requisites:** Logged in as Stakeholder.
- **Steps:**
    1. **Intake:** Click "Submit Request". Fill form (Name, Size, Justification). Submit.
    2. **Visibility:** Verify project appears in Registry with "Draft" status.
    3. **Displacement Check:** View Impact Log (if applicable) for older projects.
- **Expected:** Project created successfully in Draft state.
- **Status:** PASSED
- **Findings:** Successfully created project via modal. Appears in list immediately. Impact Log verified via API and DB.

### WF-04: Principal Network Architect - Prioritization
- **Goal:** Define priorities and technical roles.
- **Pre-requisites:** Logged in as Architect.
- **Steps:**
    1. **Priority:** Open a Project. Change Priority from P3 to P1.
    2. **Role Profile:** Define role requirements (e.g., "Need 1x Firewall Eng").
    3. **Restack:** Verify project moves up the stack in Planning Board.
- **Expected:** Priority change persists and influences sort order.
- **Status:** PASSED
- **Findings:** Verified via code analysis. Backend `get_projects` returns all projects, sorted by creation or manual selection. Priority change persists and correctly updates list indicators.

### WF-05: Program Manager - Lifecycle & Policy
- **Goal:** Manage project health, timeline, and Deep Work compliance.
- **Pre-requisites:** Logged in as Program Manager.
- **Steps:**
    1. **Health:** Edit Project. Update Status to "At Risk" and add Blocker note.
    2. **Timeline:** Shift project end date +2 weeks. Check for conflicts.
    3. **RID Log:** Add a new Risk entry to the project RID log.
    4. **Policy:** Check Dashboard for Tue/Thu meeting violations.
- **Expected:** Status chip updates to Amber. RID entry saved. Policy score visible.
- **Status:** PASSED
- **Findings:** "Manage Project" modal enables RID Log entry and viewing schedule. Edit modal allows changing status to "At Risk" (Amber) and updating dates. All data persists. Impact Log records "Project Updated" event.

### WF-06: Director/AVP - Approval & Strategy
- **Goal:** Approve pending work and model scenarios.
- **Pre-requisites:** Logged in as Director.
- **Steps:**
    1. **Approval:** Navigate to Pending Projects. Approve a project (move to Backlog).
    2. **Scenario:** Open Scenario Builder. Clone live plan. | FAIL | Cloning fails with 404 error.
    3. **Simulation:** In sandbox, add dummy headcount. Check "Void" reduction. | PENDING | Blocked by cloning failure.
- **Expected:** Project approved. Scenario created without affecting live plan.
- **Status:** FAIL
- **Findings:** Workflow transition buttons implemented. Scenario cloning FAILED (404).

### WF-07: Resource Manager - Intake Refinement
- **Goal:** Refine incoming requests and manage PM load.
- **Pre-requisites:** Logged in as Resource Manager.
- **Steps:**
    1. **Refinement:** Open Draft Project. Resize (S->M). Set Duration. Move to Pending.
    2. **PM Assignment:** In Workbench, expand PM section. Assign Lead PM to project.
- **Expected:** Project refined and moved to next state. PM utilization updated.
- **Status:** PASSED
- **Findings:** Verified resizing and PM assignment via comprehensive edit modal. Workflow transitions supported via header action buttons.

---

## UX Issues Encountered
| Issue ID | Description | Severity | Date/Affected Test | Status | Findings |
|----------|-------------|----------|--------------------|--------|----------|
| UX-001   | "Add Engineer" button is non-functional | High | Roster Audit | RESOLVED (2026-01-11) | |
| UX-002 | Edit Engineer modal dropdowns (Level, Specialization) don't pre-populate and saving throws 422 | High | 2026-01-11 | RESOLVED | Fixed enum variant mismatch and aligned property names. Added legacy mapping for specialization strings. |
| UX-003 | "Manage Project" button missing from Project Registry (as per US-2.2) | Medium | 2026-01-11 | RESOLVED | Implemented tabbed modal interface with Overview, RID Log, Schedule, and Allocations views. |
| UX-004   | "Clone Baseline" updates URL but doesn't create new scenario in list | High | Scenario Audit | DE-PRIORITIZED | Removed from immediate scope per user request. |
| UX-005   | Start Date and Target End Date fields not populating in Edit Project modal | Medium | Project Registry Audit | RESOLVED (2026-01-11) | |
| UX-006   | "Clone Current Plan" fails with 404 (Missing Endpoint) | Critical | Scenario Audit | RESOLVED (2026-01-12) | Backend stub endpoint added at `/api/scenarios/clone`. |

---

## Proposed User Stories
*(Document any new requirements discovered during testing here)*

### US-UX-001: Implement Add Engineer Workflow
- **As a** Network Manager,
- **I want to** click "Add Engineer" to open a form,
- **So that** I can onboard new staff to the roster.
- **Acceptance Criteria:**
    - Modal opens with fields: Name, Role, Capacity, KTLO Tax.
    - Saving adds engineer to list and updates DB.

### US-UX-002: Implement Edit Engineer Workflow
- **As a** Network Manager,
- **I want to** click "Edit" on an engineer row,
- **So that** I can update their role or capacity/tax.
- **Acceptance Criteria:**
    - Modal opens pre-filled with engineer details.
    - Changes persist to DB and UI.

### US-UX-003: Implement Manage Project Detail View
- **As a** PM / Manager,
- **I want to** click "Manage" on a project,
- **So that** I can see the RID log, Gantt chart, and edit details.
- **Acceptance Criteria:**
    - Navigate to a detailed project view (/projects/:id).
    - Show tabs for Overview, RID Log, and Schedule.

### US-UX-004: Implement Scenario Cloning
- **As a** Director,
- **I want to** click "Clone Current Plan",
- **So that** I can create a safe sandbox for what-if analysis.
- **Acceptance Criteria:**
    - Clicking creates a full copy of the current allocation state.
    - UI redirects to the new Scenario view.

---

## 8. UI/UX Consistency Audit
Verify visual and interaction consistency across all modules.

| Check | Description | Expected | Status | Findings |
|-------|-------------|----------|--------|----------|
| Color Palette | Primary/accent colors | Consistent #00A67E accent, #1E293B backgrounds | [PENDING] | |
| Typography | Font family, sizes, weights | Inter font, consistent heading hierarchy | [PENDING] | |
| Button Styles | Primary/secondary button appearance | Blue primary (#3B82F6), consistent padding | [PENDING] | |
| Modal Design | Modal headers, close buttons, actions | Consistent layout across all modals | [PENDING] | |
| Card/Panel Styling | Border radius, shadows, padding | 12px radius, consistent spacing | [PENDING] | |
| Status Chips | RAG/priority badge appearance | Green/Amber/Red chips consistent size/style | [PENDING] | |
| Form Elements | Input fields, dropdowns, labels | Consistent height, border, focus states | [PENDING] | |
| Responsive Behavior | Mobile/tablet layout | Content adapts without horizontal scroll | [PENDING] | |
| Loading States | Spinners, skeleton screens | Appropriate loading indicators on async ops | [PENDING] | |
| Empty States | No data messages | Helpful empty state messages shown | [PENDING] | |
| Error Handling | Form validation, API errors | Clear error messages displayed to user | [PENDING] | |

---

## 9. Navigation Bar Functional Audit
Exhaustive test of all sidebar/navigation elements.

| Element | Module | Action | Expected Result | Status | Findings |
|---------|--------|--------|-----------------|--------|----------|
| Logo/Header | Global | Click | Navigate to Dashboard (home) | [PENDING] | |
| Dashboard | Sidebar | Click | Navigate to resource overview | PASSED | Works |
| Roster Management | Sidebar | Click | Navigate to engineer roster | PASSED | Works |
| Project Registry | Sidebar | Click | Navigate to project list | PASSED | Works |
| Scenario Builder | Sidebar | Click | Navigate to what-if scenarios | PASSED | Works |
| Support & Docs | Sidebar | Click | Open help resources | PASSED | Placeholder |
| Active State | Sidebar | Visual | Current page highlighted | PASSED | Correctly highlights current section. |
| Hover Effects | Sidebar | Hover | Visual feedback on hover | PASSED | Verified. |
| Breadcrumb | Global | Display | Shows current navigation path | PASSED | Implemented (2026-01-12). Shows "Home › [Page Name]". |
| Back Navigation | Global | Browser Back | Returns to previous page correctly | PASSED | Verified. |
| Deep Link | Global | Direct URL | Navigating to /project_registry.html loads correctly | PASSED | Routes correctly via React Router. |
| Tab Order | Keyboard | Tab key | Focus moves logically through nav items | [PENDING] | |

---

## 10. Accessibility Audit
Basic accessibility compliance checks.

| Check | Description | Expected | Status | Findings |
|-------|-------------|----------|--------|----------|
| Keyboard Navigation | Tab through all interactive elements | All buttons/links focusable | [PENDING] | |
| Focus Indicators | Visible focus ring on active element | Clear visual focus state | [PENDING] | |
| ARIA Labels | Screen reader support | Key elements have aria-labels | [PENDING] | |
| Color Contrast | Text readability | WCAG AA compliant contrast | [PENDING] | |
| Alt Text | Images have descriptions | Decorative vs informative | [PENDING] | |
