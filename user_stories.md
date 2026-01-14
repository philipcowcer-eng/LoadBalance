# User Stories: Network Engineering Resource Manager

## Epic 1: Foundation & Roster Management
*Goal: Establish the team structure and define "Effective Capacity".*

*   **US-1.1: Environment Configuration (Network Ops Lead)**
    *   **As a** Network Ops Lead,
    *   **I want to** ensure the application identifies "Effective Capacity" correctly during setup,
    *   **So that** I don't over-allocate my engineering team on day one.
    *   **Acceptance Criteria:**
        *   System calculates `Total Capacity - KTLO Tax` accurately.
        *   Default weekly total is set to 40 hours unless overridden.

*   **US-1.2: Manage Engineer Roster (Network Manager)**
    *   **As a** Network Manager,
    *   **I want to** add, edit, and remove team members (Name, Role, Total Hours),
    *   **So that** my planning roster reflects the current team reality (e.g., Wireless Engineers, Architects).
    *   **Acceptance Criteria:**
        *   Must be able to define specific network engineering roles.
        *   Deleting an engineer prompts a warning if they have active allocations.

*   **US-1.3: Define Dynamic KTLO / Ops Tax (Program Manager)**
    *   **As a** Program Manager,
    *   **I want to** assign a high "Ops Tax" to operational resources,
    *   **So that** I account for a significant reduction in their project availability (often <50% of total time).
    *   **Acceptance Criteria:**
        *   Visual indicator if KTLO/Ops tax exceeds 50% of total capacity.
        *   Ability to set a "New Hire Training Tax" that tapers over time.

*   **US-1.4: Skill & Certification Inventory (Network Ops Lead)**
    *   **As a** Network Ops Lead,
    *   **I want to** tag engineers with specific skills (e.g., WAN, Security, Cloud) and certs,
    *   **So that** I can ensure critical projects are staffed with correctly qualified resources.
    *   **Acceptance Criteria:**
        *   Roster search is filterable by Skill tags.
        *   Alert if a project requires "Security" but the assigned resource lacks the tag.

*   **US-1.5: Integrated PTO/Leave Management (Network Manager)**
    *   **As a** Network Manager,
    *   **I want to** enter planned holidays and training dates for each engineer,
    *   **So that** their "Effective Capacity" is automatically zeroed out for those specific weeks.
    *   **Acceptance Criteria:**
        *   PTO entries reflect as striped "PTO" blocks in the utilization heatmap.
        *   Bulk PTO entry (e.g., for team-wide holidays).

*   **US-1.6: Resource Profile & Detailed Assignment View (Network Manager)**
    *   **As a** Network Manager,
    *   **I want to** click into an individual engineer's profile to see their specific project assignments and allocated hours in detail,
    *   **So that** I can understand exactly what is consuming their capacity and identify potential burn-out or under-utilization.
    *   **Acceptance Criteria:**
        *   Profile view shows a breakdown of project allocations for the selected week.
        *   Shows balance of KTLO/Ops Tax vs. Project work.
        *   Visual indicators for "Deep Work" compliance (meetings vs. heads-down time).

## Epic 2: Project Registry & Prioritization
*Goal: Define WHAT we are working on and HOW important it is.*

*   **US-2.1: Project Registry (Principal Network Architect)**
    *   **As a** Principal Network Architect,
    *   **I want to** create a central list of Projects and assign a Priority (P1-Critical to P4-Low),
    *   **So that** everyone agrees on the relative importance of work.
    *   **Acceptance Criteria:**
        *   Only P1-P4 priority levels allowed.
        *   Project list is searchable and filterable by status (Healthy/At Risk).

*   **US-2.2: The "Displacement" Notification (Stakeholder)**
    *   **As a** Stakeholder,
    *   **I want to** see an "Impact Log" when my project's hours are reduced,
    *   **So that** I can adjust external expectations immediately.
    *   **Acceptance Criteria:**
        *   Log entry must include: Date, Project, Previous Hours, New Hours, and Reason for Bump.

*   **US-2.3: Impact Remediation (Lead PM)**
    *   **As a** Lead PM,
    *   **I want** displaced work to automatically move to "The Void" with a high-priority flag,
    *   **So that** it isn't lost and is addressed in the next planning cycle.
    *   **Acceptance Criteria:**
        *   Displaced items show as "Recently Bumped" in the Dashboard.

*   **US-2.4: Project Health Self-Reporting (Project Lead)**
    *   **As a** Project Lead,
    *   **I want to** update my project's RAG status (Red/Amber/Green) and add a "Blocker" note,
    *   **So that** leadership is warned of delivery risks that aren't purely resource-related.
    *   **Acceptance Criteria:**
        *   Status updates are time-stamped in the Project Registry details view.
        *   "Red" projects surface with a warning icon on the main Dashboard.

*   **US-2.5: Resource Requirement Profiling (Principal Network Architect)**
    *   **As a** Principal Network Architect,
    *   **I want to** define the "Role Profile" needed for a project (e.g., "Need 1x Firewall Specialist"),
    *   **So that** the system can intelligently suggest available engineers from the roster.
    *   **Acceptance Criteria:**
        *   Projects can define multiple role requirements with estimated hours per week.

## Epic 3: Manager-Centric Allocation
*Goal: Empower the manager to efficiently distribute work across the team.*

*   **US-3.1: Team Allocation Workbench (Network Manager)**
    *   **As a** Network Manager,
    *   **I want to** view my entire team's capacity and project assignments in a single unified view,
    *   **So that** I can balance the workload across the team without opening individual profiles.
    *   **Acceptance Criteria:**
        *   View displays all team members as rows with their weekly capacity (e.g., Gantt or Timeline style).
        *   Unassigned project backlog is visible alongside the team schedule.

*   **US-3.2: Drag-and-Drop Assignment (Network Manager)**
    *   **As a** Network Manager,
    *   **I want to** drag unassigned project tasks from a backlog onto specific engineers,
    *   **So that** I can quickly assign work based on availability.
    *   **Acceptance Criteria:**
        *   Dragging a task updates the engineer's allocated hours instantly.
        *   Visual feedback if the assignment exceeds the engineer's remaining capacity.

*   **US-3.3: Utilization & Impact Indicators (Network Manager)**
    *   **As a** Network Manager,
    *   **I want to** see real-time "Over/Under" utilization indicators as I modify the plan,
    *   **So that** I can ensure no one is overloaded while ensuring all P1 work is covered.
    *   **Acceptance Criteria:**
        *   Engineer's row turns Red if >100% capacity.
        *   Impact summary shows total unassigned hours remaining for the selected project.

## Epic 4: Policy, Culture & Safety
*Goal: Drive behavioral change and provide transparency.*

*   **US-4.1: The "Deep Work" Guardian (Lead PM)**
    *   **As a** Lead PM,
    *   **I want** a visual warning for any meetings scheduled on Tue/Thu,
    *   **So that** we adhere to the organizational "Deep Work" policy.
    *   **Acceptance Criteria:**
        *   Warning is non-blocking but requires a "Policy Violation Reason" if ignored.

*   **US-4.2: Burnout Alerting (Director level PgM)**
    *   **As a** Director level PgM,
    *   **I want to** see red heatmap warnings when utilization exceeds effective capacity,
    *   **So that** I can intervene before mental fatigue sets in.
    *   **Acceptance Criteria:**
        *   Heatmap cells turn Red when `Allocated > Effective Capacity`.
        *   Dashboard shows a count of "Over-Allocated Engineers" for the coming week.

*   **US-4.3: Policy Compliance Reporting (Director level PgM)**
    *   **As a** Director level PgM,
    *   **I want to** see a weekly "Compliance Score" for Deep Work adoption across the org,
    *   **So that** I can assess cultural health during leadership reviews.
    *   **Acceptance Criteria:**
        *   Score calculation: `% of engineers with 0 meetings on Tue/Thu`.
        *   Trend line shows compliance over the last 12 weeks.

*   **US-4.4: Budget Justification Reporting (Director level PgM)**
    *   **As a** Director level PgM,
    *   **I want to** visualize the total hours in "The Void" (Unassigned Demand) over time,
    *   **So that** I can justify supplemental budget or headcount requests to senior leadership.
    *   **Acceptance Criteria:**
        *   Report shows historical trend of unassigned hours.

## Epic 5: Engineer Feedback & Accuracy (New)
*Goal: Low-friction feedback loop to improve planning accuracy.*

*   **US-5.1: The "Raise Hand" Flag (Network Engineer)**
    *   **As a** Network Engineer,
    *   **I want to** flag an allocation as "Too Short" or "Too Long" with one click,
    *   **So that** I can signal planning errors without writing an email.
    *   **Acceptance Criteria:**
        *   Clicking "Underestimated" adds a Red dot to the allocation.
        *   Clicking "Overestimated" adds a Blue dot to the allocation.
        *   Action must be reversible.

*   **US-5.2: Feedback Resolution (Network Manager)**
    *   **As a** Network Manager,
    *   **I want to** see flagged allocations on my planning board,
    *   **So that** I can adjust the plan or discuss scope with the engineer.
    *   **Acceptance Criteria:**
        *   Allocations with feedback are visually distinct on the Manager Board.
        *   Manager can "Resolve" the flag (clearing the indicator) after taking action.

## Epic 6: Scenario Builder (New Module)
*Goal: Model "What-If" outcomes without breaking the current live plan.*

*   **US-6.1: Sandbox Branching (Director level PgM)**
    *   **As a** Director level PgM,
    *   **I want to** clone the "Current Plan" into a private sandbox,
    *   **So that** I can model radical priority shifts or re-orgs safely.
    *   **Acceptance Criteria:**
        *   "Discard changes" option to return to the live plan.
        *   Ability to name and save multiple scenarios (e.g., "Q3 Expansion Plan").

*   **US-6.2: "Add-a-Head" Simulation (Director level PgM)**
    *   **As a** Director level PgM,
    *   **I want to** add temporary "TBD Resources" to a scenario,
    *   **So that** I can demonstrate how much "Void Work" could be cleared with more headcount.
    *   **Acceptance Criteria:**
        *   Scenario report shows delta in "Void Hours" after adding simulation resources.

*   **US-6.3: Timeline Shift Sensitivity (Network Manager)**
    *   **As a** Network Manager,
    *   **I want to** slide a project start date forward/backward in a scenario,
    *   **So that** I can find the "Least Friction" entry point for team capacity.
    *   **Acceptance Criteria:**
        *   Real-time heatmap updates as project dates are dragged.

## Epic 7: Project Intake & Approval
*Goal: Enforce disciplined project onboarding with t-shirt sizing and PM overhead tracking.*

*   **US-7.1: Submit Project Request (Senior IT Leadership)**
    *   **As a** Senior IT Leader,
    *   **I want to** submit a new project request with business justification and t-shirt size estimate,
    *   **So that** my need enters the formal intake queue for resource consideration.
    *   **Acceptance Criteria:**
        *   Form requires: Name, Description, Justification, Target Date, Size (S/M/L/XL).
        *   Optional field for "Requested Priority" (P1-P4 suggestion).
        *   Project created in **Draft** status visible to Resource Manager.

*   **US-7.2: Review & Refine Sizing (Resource Manager)**
    *   **As a** Resource Manager,
    *   **I want to** review incoming requests and adjust the t-shirt size based on technical assessment,
    *   **So that** the final size reflects realistic effort, not just the requestor's guess.
    *   **Acceptance Criteria:**
        *   Can override submitted size (S→M, M→L, etc.).
        *   Must set **Duration (Weeks)** for the project.
        *   Project moves to **Pending Approval** status after review.

*   **US-7.3: Approve & Link to Apptio (Director/AVP)**
    *   **As a** Director or AVP,
    *   **I want to** approve pending projects and optionally link them to Apptio Project IDs,
    *   **So that** only sanctioned work consumes team capacity and financial tracking is maintained.
    *   **Acceptance Criteria:**
        *   Approval screen shows: Name, Justification, Size, Requested vs. Assigned Priority.
        *   Optional field for Apptio Project ID (can be skipped).
        *   Approved projects move to **Approved** status and appear in Resource Manager's backlog.

*   **US-7.4: Auto-Calculate PM Overhead (System)**
    *   **As a** System,
    *   **I want to** automatically calculate PM hours when engineers are assigned to a project,
    *   **So that** coordination overhead is visible and tracked without manual entry.
    *   **Acceptance Criteria:**
        *   Formula: `PM Hours = (Project Size - 1 Fibonacci) + (1h if ≥2 engineers)`.
        *   PM hours display as a badge on the project card in Team Workbench.
        *   Warning icon (⚠️ "PM Capacity Limited") appears if no PM has available hours.

*   **US-7.5: Assign PM to Project (Resource Manager)**
    *   **As a** Resource Manager,
    *   **I want to** manually select which PM handles a project from a dropdown showing current utilization,
    *   **So that** I can balance PM workload across the team.
    *   **Acceptance Criteria:**
        *   Clickable "Assign PM" action on project cards after engineers are assigned.
        *   Dropdown shows all PMs with current capacity (e.g., "Alex Rivera: 24h/40h").
        *   Selected PM receives the auto-calculated hours in their allocation view.

*   **US-7.6: PM Capacity Visibility (Resource Manager)**
    *   **As a** Resource Manager,
    *   **I want to** view a collapsible PM section in the Team Workbench,
    *   **So that** I can monitor PM utilization without cluttering the main engineer view.
    *   **Acceptance Criteria:**
        *   PM section is **collapsed by default**.
        *   Expanding shows PM rows with auto-assigned projects (read-only).
        *   PM rows have light blue background tint to distinguish from engineers.
## Epic 8: Program Manager / Lead PM Operations
*Goal: Enable detailed project lifecycle management and health tracking.*

*   **US-8.1: Detailed Project Maintenance (Program Manager)**
    *   **As a** Program Manager,
    *   **I want to** edit the project description, status, and timeline (start/end dates),
    *   **So that** the project record remains accurate as scope and schedules evolve.
    *   **Acceptance Criteria:**
        *   Ability to update project name and long-form description.
        *   Ability to change project duration or specific start/end dates.
        *   Timeline changes trigger a capacity conflict check for assigned resources.

*   **US-8.2: Project Status Chip (Program Manager)**
    *   **As a** Program Manager,
    *   **I want** a highly visible status chip (Healthy/At Risk/Deprioritized) on all project views,
    *   **So that** I can instantly identify projects requiring attention.
    *   **Acceptance Criteria:**
        *   Color-coded chips: Green (Healthy), Amber (At Risk), Red (Critical/Deprioritized).
        *   Status chip is clickable to jump to the RID log or health details.

*   **US-8.3: Risk, Issues, and Decisions (RID) Log (Program Manager)**
    *   **As a** Program Manager,
    *   **I want to** maintain an integrated log of Risks, Issues, and Decisions for each project,
    *   **So that** there is a centralized audit trail of delivery blockers and choices.
    *   **Acceptance Criteria:**
        *   Log entries categorized as Risk, Issue, or Decision.
        *   Entries include: Description, Severity (Low/Med/High), Owner, and Status (Open/Resolved).
        *   Resolved entries are archived but remain searchable.

*   **US-8.4: Automated Timeline Impact (Program Manager)**
    *   **As a** Program Manager,
    *   **I want** the system to highlight when a project's timeline shift overlaps with an engineer's existing PTO or high-priority project,
    *   **So that** I can proactively remediate scheduling conflicts.
    *   **Acceptance Criteria:**
        *   Visual warning on the project edit screen if dates overlap with known conflicts.
        *   "Conflict Resolution" suggestion tool (e.g., "Move 1 week later to avoid [Engineer Name] PTO").
## Epic 9: UX Improvements (From Usability Testing)
*Goal: Address critical usability gaps identified during testing.*

*   **US-9.1: Implement Add Engineer Workflow (Network Manager)**
    *   **As a** Network Manager,
    *   **I want to** click "Add Engineer" to open a form,
    *   **So that** I can onboard new staff to the roster.
    *   **Acceptance Criteria:**
        *   Modal opens with fields: Name, Role, Capacity, KTLO Tax.
        *   Saving adds engineer to list and updates DB.

*   **US-9.2: Implement Edit Engineer Workflow (Network Manager)**
    *   **As a** Network Manager,
    *   **I want to** click "Edit" on an engineer row,
    *   **So that** I can update their role or capacity/tax.
    *   **Acceptance Criteria:**
        *   Modal opens pre-filled with engineer details.
        *   Changes persist to DB and UI.

*   **US-9.3: Implement Manage Project Detail View (PM / Manager)**
    *   **As a** PM / Manager,
    *   **I want to** click "Manage" on a project,
    *   **So that** I can see the RID log, Gantt chart, and edit details.
    *   **Acceptance Criteria:**
        *   Navigate to a detailed project view (/projects/:id).
        *   Show tabs for Overview, RID Log, and Schedule.

*   **US-9.4: Implement Scenario Cloning (Director)**
    *   **As a** Director,
    *   **I want to** click "Clone Current Plan",
    *   **So that** I can create a safe sandbox for what-if analysis.
    *   **Acceptance Criteria:**
        *   Clicking creates a full copy of the current allocation state.
        *   UI redirects to the new Scenario view.

## Epic 10: Full Lifecycle Management
*Goal: Ensure the project can be tracked from initial inception to final archival.*

*   **US-10.1: Project Closure Workflow (PM / RM)**
    *   **As a** PM or Resource Manager,
    *   **I want to** mark a project as "Complete",
    *   **So that** all engineering allocations are automatically released and the project is archived.
    *   **Acceptance Criteria:**
        *   Project status changes to **Complete**.
        *   All associated active allocations are updated to **Removed** status.
        *   Engineer heatmaps immediately show reclaimed capacity.

*   **US-10.2: Project Cancellation (AVP / RM)**
    *   **As an** AVP or Resource Manager,
    *   **I want to** "Cancel" a project that is no longer prioritized,
    *   **So that** it is removed from the active queue and resources are freed.
    *   **Acceptance Criteria:**
        *   Status changes to **Cancelled**.
        *   **Mandatory cancellation reason** is required (e.g., "Strategy Shift", "Budget Cut").
        *   Reason is captured in the **Impact Log** for audit.
        *   All future allocations are deleted; historical hours remain for reporting.

*   **US-10.3: Put Project On Hold (PM / RM)**
    *   **As a** PM or Resource Manager,
    *   **I want to** pause a project without deleting its allocations,
    *   **So that** I can signal a temporary deprioritization while preserving planned capacity.
    *   **Acceptance Criteria:**
        *   Status changes to **On Hold**.
        *   Allocations remain visible but are styled distinctly (e.g., striped/grayed).
        *   Allocations **do not count** toward "Effective Capacity" burn in utilization reports.
        *   Project can be resumed to **Active** or moved to **Cancelled**.

*   **US-10.4: End-to-End Lifecycle Visibility (Leadership)**
    *   **As a** Senior IT Leader,
    *   **I want to** see a report of projects by lifecycle stage (Draft, Pending, Active, On Hold, Complete, Cancelled),
    *   **So that** I can assess the health and throughput of our project intake process.
    *   **Acceptance Criteria:**
        *   Dashboard includes a "Lifecycle Funnel" charting project counts at each stage.
        *   "On Hold" count is displayed with an amber indicator.

## Epic 11: Project Modal Editing Capabilities
*Goal: Enable comprehensive in-modal editing of project attributes, RID log entries, and resource allocations.*

*   **US-11.1: Edit Project Ownership (PM / RM)**
    *   **As a** PM or Resource Manager,
    *   **I want to** change the Project Owner and assigned Project Manager from within the project modal,
    *   **So that** I can reassign accountability without navigating away from the project view.
    *   **Acceptance Criteria:**
        *   "Project Owner" field displays a searchable dropdown of available stakeholders.
        *   "Project Manager" field displays a searchable dropdown filtered to users with PM role.
        *   Changes persist to the database on "Save Changes".
        *   An **Impact Log entry** is created: "Owner changed from [Old] to [New] by [User]".
        *   The project detail view updates immediately after save.

*   **US-11.2: Update RAG Health Status (PM)**
    *   **As a** Project Manager,
    *   **I want to** update the project's RAG (Red/Amber/Green) health status via a clickable chip,
    *   **So that** I can quickly signal delivery health without opening a separate form.
    *   **Acceptance Criteria:**
        *   RAG chip in the Overview tab is **clickable**.
        *   Clicking opens a dropdown with options: Green, Amber, Red, or Issue (for external blockers).
        *   Selecting a new status updates the chip color **immediately** (optimistic UI).
        *   Backend persists the new RAG status.
        *   If changed to **Red** or **Issue**, a mandatory "Reason" text field appears before save.
        *   Change is logged in the **Impact Log** with timestamp and user.

*   **US-11.3: Update Percent Complete (PM)**
    *   **As a** Project Manager,
    *   **I want to** update the "% Complete" value for a project,
    *   **So that** stakeholders can track progress at a glance.
    *   **Acceptance Criteria:**
        *   % Complete displays as an **editable input** (0-100) or a slider.
        *   Input is validated: must be a whole number between 0 and 100.
        *   The progress bar in the modal updates **in real-time** as the value changes.
        *   Value persists to the database on "Save Changes".
        *   Setting to **100%** prompts: "Mark project as Complete?" confirmation.

*   **US-11.4: Edit Project Timeline Dates (PM / RM)**
    *   **As a** PM or Resource Manager,
    *   **I want to** modify the Start Date and Target End Date for a project,
    *   **So that** I can adjust schedules as priorities shift.
    *   **Acceptance Criteria:**
        *   Both dates appear as **date picker** inputs in the Schedule tab.
        *   Start Date cannot be set after End Date (validation error displayed).
        *   Changes persist on "Save Changes" and update the Timeline Progress bar.
        *   An **Impact Log entry** is created: "Timeline changed: [Old Range] → [New Range]".
        *   **Backlog:** PTO conflict check and warning banner for affected engineers.

*   **US-11.5: Edit Business Justification (PM / Stakeholder)**
    *   **As a** PM or Stakeholder,
    *   **I want to** edit the Business Justification text for a project,
    *   **So that** I can refine the rationale as the project evolves.
    *   **Acceptance Criteria:**
        *   Business Justification section displays as an **editable textarea** (min 50 chars, max 2000 chars).
        *   Character count indicator shown below the field.
        *   Changes persist on "Save Changes".
        *   Placeholder text guides the user: "Describe the business value and expected outcomes..."

*   **US-11.6: Promote RID Log Entry Type (PM)**
    *   **As a** Project Manager,
    *   **I want to** promote a Risk to an Issue, or an Issue to a Decision,
    *   **So that** I can track the natural progression of project blockers through resolution.
    *   **Acceptance Criteria:**
        *   Each RID entry card includes an **overflow menu** (⋮) with options:
            *   "Promote to Issue" (visible only on Risk entries).
            *   "Promote to Decision" (visible only on Issue entries).
            *   "Edit Entry" (all types).
            *   "Delete Entry" (all types, with confirmation).
        *   Promoting an entry changes its type badge and logs the transition.
        *   The entry's **date updated** timestamp is refreshed.
        *   Original type is preserved in a "Previously: [Type]" note on the card.

*   **US-11.7: Add RID Log Entry (PM)**
    *   **As a** Project Manager,
    *   **I want to** add a new Risk, Issue, or Decision entry to the RID Log,
    *   **So that** I can document blockers and key choices as they arise.
    *   **Acceptance Criteria:**
        *   "+ Add Entry" button opens a modal/inline form with fields:
            *   Type: Radio buttons (Risk / Issue / Decision).
            *   Description: Textarea (required, min 10 chars).
            *   Severity: Dropdown (Low / Medium / High) - required for Risk/Issue.
            *   Owner: Searchable dropdown of team members.
        *   Form validates and persists on submit.
        *   New entry appears at the **top** of the RID list with "Just now" timestamp.
        *   Entry is saved in a `project_rid_log` table linked to the project.

*   **US-11.8: Add Resource Allocation (Manager / RM)**
    *   **As a** Network Manager or Resource Manager,
    *   **I want to** add a new engineer allocation to a project from within the modal,
    *   **So that** I can staff projects without leaving the project detail view.
    *   **Acceptance Criteria:**
        *   "+ Add Resource" button opens an inline form with fields:
            *   Engineer: Searchable dropdown showing name + current utilization %.
            *   Role: Text input or dropdown of common roles.
            *   Hours/Week: Number input (2-40, validated in 2h increments).
            *   Start Week / End Week: Date pickers (optional, defaults to project dates).
        *   Form validates: engineer cannot be double-booked > 100% capacity.
        *   On save, allocation appears in the table and **heatmaps update**.
        *   Allocation created in `project_allocations` table via API.

*   **US-11.9: Remove Resource Allocation (Manager / RM)**
    *   **As a** Network Manager or Resource Manager,
    *   **I want to** remove an engineer allocation from a project,
    *   **So that** I can free up their capacity for other work.
    *   **Acceptance Criteria:**
        *   Each allocation row includes a **delete icon** (🗑️ or ✕).
        *   Clicking triggers a confirmation modal: "Remove [Engineer] from [Project]?"
        *   If allocation has logged hours, display warning: "This allocation has X logged hours which will be preserved for reporting."
        *   On confirm, row removed from UI and allocation status set to "Removed" in DB.
        *   Engineer's **heatmap immediately reflects** freed capacity.
        *   An **Impact Log entry** is created: "[Engineer] removed from project by [User]".

*   **US-11.10: Edit Resource Allocation Hours (Manager / RM)**
    *   **As a** Network Manager or Resource Manager,
    *   **I want to** adjust the hours/week for an existing allocation,
    *   **So that** I can rebalance workload without removing and re-adding the engineer.
    *   **Acceptance Criteria:**
        *   Hours/Week cell is **inline-editable** (click to edit, blur to save).
        *   Input validated: 2-40 hours, 2h increments.
        *   If new hours would exceed engineer's capacity, a warning displays.
        *   Changes logged to the **Impact Log**: "Allocation for [Engineer] changed: [Old]h → [New]h".
        *   Heatmaps update in real-time after save.

*   **US-11.11: Filter and Search At Risk Projects (PM / RM / Leadership)**
    *   **As a** PM, Resource Manager, or Senior Leader,
    *   **I want to** filter and search for projects that are Red, Amber, or have Issues,
    *   **So that** I can quickly identify and prioritize projects requiring attention.
    *   **Acceptance Criteria:**
        *   Project Registry sidebar includes an **"At Risk"** filter tab (alongside All, P1).
        *   Clicking "At Risk" shows only projects where `rag_status` is **Amber**, **Red**, or **Issue**.
        *   Projects in the filtered list display their RAG indicator dot with appropriate color.
        *   The **search box** filters results by project name within the selected filter.
        *   Search is **case-insensitive** and matches partial strings.
        *   Filter and search states persist during the session (not reset on project selection).
        *   Empty state message displayed if no projects match: "No projects at risk. 🎉"

## Epic 12: Engineer Personal Experience
*Goal: Provide individual contributors with clarity on their assignments and a simple way to manage their time.*

*   **US-12.1: "My Week" Dashboard (Network Engineer)**
    *   **As a** Network Engineer,
    *   **I want to** see a focused view of *only my* assignments for the current week,
    *   **So that** I know exactly what to work on without filtering the full team roster.
    *   **Acceptance Criteria:**
        *   Dashboard shows a list of projects allocated to me for the current week.
        *   Display includes: Project Name, Role, Allocated Hours, and Daily Average (Hours/5).
        *   Total allocated hours for the week is summed up at the bottom.
        *   Visual warning if total allocation > 40 hours.

*   **US-12.2: Upcoming Schedule Lookahead (Network Engineer)**
    *   **As a** Network Engineer,
    *   **I want to** toggle to view "Next Week" or "Next 4 Weeks",
    *   **So that** I can plan for upcoming project starts or high-load periods.
    *   **Acceptance Criteria:**
        *   "Next Week" button slides the view window forward.
        *   "Month View" shows a high-level heatmap of my own capacity (Red/Green) for the next 4 weeks.

*   **US-12.3: Quick-Log "Actuals" (Network Engineer)**
    *   **As a** Network Engineer,
    *   **I want to** confirm if I actually spent the allocated time (e.g., "Yes" or "No - Adjusted"),
    *   **So that** future planning data is based on reality.
    *   **Acceptance Criteria:**
        *   Simple "Confirm" button next to each allocation.
        *   Option to enter a different "Actual" number if the allocation was wrong.
        *   (Note: This is lightweight time tracking, not full timesheets).

*   **US-12.4: Mobile-Friendly "On the Go" View (Field Engineer)**
    *   **As a** Field Engineer (Wireless/Deploy),
    *   **I want to** check my assignments from a mobile device,
    *   **So that** I can see where I need to be while on site.
    *   **Acceptance Criteria:**
        *   "My Week" view is responsive and stackable on mobile screens.
        *   No horizontal scrolling required to see project names and hours.

## Epic 13: Fiscal Planning & Volume Tracking
*Goal: Align project execution with financial cycles (Fiscal Years) and track tangible asset impact.*

*   **US-13.1: Fiscal Year Designation (PM / Manager)**
    *   **As a** Project Manager or Resource Manager,
    *   **I want to** tag a project with its primary Fiscal Year (e.g., FY25, FY26),
    *   **So that** I can group matching funding cycles with execution schedules.
    *   **Acceptance Criteria:**
        *   "Fiscal Year" is a required dropdown field (e.g., FY24, FY25, FY26, FY27).
        *   System auto-suggests FY based on the Target End Date (e.g., dates in 2025 default to FY25).
        *   Multi-year projects can select "Split FY" enabled by tagging allocations to specific years.

*   **US-13.2: Device Refresh Volume Tracking (PM)**
    *   **As a** Project Manager,
    *   **I want to** enter the estimated "Device Volume" (count of hardware units) for a project,
    *   **So that** we can track the scale of infrastructure modernization.
    *   **Acceptance Criteria:**
        *   Field for "Device Count" (Integer) available in project details.
        *   Optional "Device Type" classification (e.g., Access Points, Switches, Routers).
        *   Volume data is aggregable for reporting.

*   **US-13.3: Aggregate Fiscal Volume Report (Manager / Director)**
    *   **As a** Resource Manager or Director,
    *   **I want to** run a report showing "Total Devices Refreshed" grouped by Fiscal Year,
    *   **So that** I can demonstrate the team's output and ROI to leadership.
    *   **Acceptance Criteria:**
        *   Report displays a bar chart of Device Counts per FY.
        *   Drill-down capability to see which projects contributed to the total volume.
        *   Exportable to CSV for executive presentations.

*   **US-13.4: Multi-Device Volume Tracking (PM)**
    *   **As a** Project Manager,
    *   **I want to** add multiple line items for hardware to a single project (e.g., 50x Switches AND 200x APs),
    *   **So that** I can accurately capture the full scope of a complex refresh without creating separate projects.
    *   **Acceptance Criteria:**
        *   "Device Volume" section allows adding multiple rows.
        *   Each row has its own "Device Type" and "Count".
        *   Total volume is the sum of all rows.

*   **US-13.5: Net Growth Calculation (Current vs. Proposed) (PM)**
    *   **As a** Project Manager,
    *   **I want to** specify the "Current Quantity" (devices being removed/refreshed) and "Proposed Quantity" (devices to be deployed) for each line item,
    *   **So that** we can calculate the true "Net Growth" of the managed fleet.
    *   **Acceptance Criteria:**
        *   Each volume row has fields for:
            *   **Current Qty** (Default 0).
            *   **Proposed Qty** (Required).
        *   System automatically calculates **Net Change** (Proposed - Current).
        *   Example: Replace 50 APs with 60 APs = 50 Current, 60 Proposed, +10 Net Growth.
    
*   **US-13.6: Managed Device Growth Reporting (Director)**
    *   **As a** Director,
    *   **I want to** see a chart showing Total Current vs Total Proposed by device type, filterable by date and FY,
    *   **So that** I can confidently state fleet status by specific milestones (e.g., "By Sept 2026, we will have refreshed X APs").
    *   **Acceptance Criteria:**
        *   Report displays clustered bars: "Current" vs "Future" state by Device Type.
        *   "Net Growth" count is highlighted for each category.
        *   **Filters**:
            *   **Fiscal Year**: Multi-select (e.g., FY25 + FY26).
            *   **Target Date Range**: "Projects completing by [Month/Year]" (uses Target End Date).
            *   **Device Type**: Multi-select (e.g., Access Points, Switches).
        *   Drill-down available to see which projects drive the growth.
