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
