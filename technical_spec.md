# Technical Specification: Network Engineering Resource Manager

## 1. Executive Summary
A web-based capacity planning tool designed for Network Engineering leadership. It provides transparency into staff allocation, prevents burnout by visualizing effective capacity, and enforces organizational meeting policies ("Deep Work" days).

**Core Philosophy:** Macro-level planning over micro-level tracking. "Unassigned work is better than invisible burnout." **"Zero-Sum Prioritization."**
**Target Audience:** Engineering Managers, Program Managers, Leadership.

## 1.1 Deliverables (MVP Scope)
1.  **Staffing Database:** A structured registry of engineers, roles, and capacity rules (sqlite).
2.  **Leadership Dashboard:** A web interface providing heatmaps of utilization and a "Risk Register" for displaced work.
3.  **Planning Board:** A drag-and-drop calendar interface that enforces "Deep Work" policies and priority stacking.
4.  **Impact Notification System:** An automated log that records every instance of work displacement.

## 1.2 Success Metrics & Budget justification (Lead PM Objective)
*   **Deep Work Protection:** % of engineers with >20 hours/week unallocated to meetings on Tue/Thu.
*   **Displacement Accuracy:** % of P1 projects that successfully displaced lower priority work without manual escalation.
*   **Burnout Mitigation:** Reduction in the number of weeks engineers spend at >100% effective capacity.
*   **Budget Justification (Full Allocation Visibility):** Average hours sitting in "The Void" (Unassigned Demand). A sustained >40 hours/week in the Void provides data-backed justification for supplemental headcount or budget.

## 2. Architecture Overview
*   **Frontend:** React (Vite) + Bootstrap 5.
*   **Backend:** Python (FastAPI).
*   **Data Persistence:** SQLite (Local file) - *Chosen for better data integrity during displacement logging and easier historical reporting.*

## 3. Data Entities & Models

### 3.1 Engineer (Resource)
*   **ID:** UUID
*   **Name:** String
*   **Role:** Enum (Network Engineer, Wireless Engineer, Project Manager, Architect)
*   **Total Capacity (Weekly):** Integer (Default: 40 hours)
*   **KTLO Tax:** Integer (Hours/week reserved for "Keep The Lights On" tasks). *Includes dynamic onboarding tax for new hires and high 'Ops Tax' for network operations resources (often >50% reduction in project availability).*
*   **Effective Capacity:** Calculated (`Total Capacity` - `KTLO Tax`).

### 3.2 Project (New Entity)
*   **ID:** UUID
*   **Name:** String
*   **Priority:** Enum (P1-Critical, P2-Strategic, P3-Standard, P4-Low)
*   **Status:** Enum (Healthy, At Risk, Deprioritized)

### 3.3 Allocation (Demand)
*   **ID:** UUID
*   **EngineerID:** UUID (Foreign Key) OR "UNASSIGNED"
*   **ProjectID:** UUID (Foreign Key)
*   **Category:** Enum (Project Work, Operational Support, Meetings)
*   **Day:** Enum (Mon, Tue, Wed, Thu, Fri)
*   **Hours:** Integer (Min: 2, Max: 24)
*   **FeedbackStatus:** Enum (None, Underestimated, Overestimated) - *Engineers can flag this to signal accuracy issues.*

### 3.4 Impact Log (The Notification System)
*   **ID:** UUID
*   **ProjectID:** UUID
*   **Date:** Timestamp
*   **Event:** String (e.g., "Hours reduced from 10 to 0")
*   **Reason:** String (e.g., "Displaced by P1 Incident")

## 4. Business Logic & Constraints

### 4.1 The "Effective Capacity" Rule
Utilization is based on *Effective Capacity* (Total - KTLO).

### 4.2 The "2-Hour Block" Constraint
Allocations must be in increments of **2 hours**.

### 4.3 The "Deep Work" Guardian
Meetings on Tue/Thu trigger a `PolicyViolationWarning`.

### 4.4 Burnout & Prioritization Protection
*   **P1 Locking:** P1 allocations have a distinct visual style (e.g., Lock Icon).
*   **Displacement Tracking:** If an allocation is reduced or removed, the system prompts for a reason and logs it to the **Impact Log**, automatically flagging the project as "At Risk".
*   **Remediation Workflow:** Displaced hours are moved back to "The Void" with a "Recently Bumped" metadata tag for high-visibility re-prioritization.

## 5. User Interface (UI) Specifications

### 5.1 Dashboard (Leadership View)
*   **Utilization Heatmap:** Color-coded utilization (Green=Optimal, Red=Over, Gray=Under).
*   **"The Void" (Unassigned Work):** Right-sidebar backlog containing unstaffed work cards.
*   **Risk Register:** A list of projects recently "bumped" or de-prioritized.

### 5.2 Roster Management
*   Add/Edit Engineers and their KTLO Tax.

### 5.3 Project Registry (New)
*   Define Projects and assign their **Priority (P1-P4)**.

### 5.4 Planning Board (Drag-and-Drop)
*   **Split-Row Layout:** Each engineer row displays a summary "Heatmap Bar" on top (showing daily % load) and a collapsible "Task Lane" below it.
*   **Unassigned Sidebar:** A persistent "Void" panel on the right for dragging unassigned projects onto engineer rows.
*   **Prioritized Stacking:** Allocations on the calendar are sorted vertically by priority (P1 at top).
*   **Conflict Resolution ("What-If" Analysis):** Before a P1 project displacement is committed, the system provides a preview: *"Moving this P1 project will bump [Project A] and [Project B] into 'The Void'. Do you want to proceed?"*

### 5.5 Engineer View ("My Week")
*   **Read-Only Calendar:** Simplified view of assigned allocations.
*   **"Raise Hand" Action:** Single-click action on any allocation to flag it as "Overestimated" (Blue) or "Underestimated" (Red).

### 5.6 Visual Design Guidelines (New)
*   **Look & Feel Template:** Based on industry-standard capacity planning tools (e.g., stacked gantt/heatmap hybrids).
*   **Color Palette:**
    *   **Danger / Over-Capacity (>100%):** `#EF4444` (Red) - Used for "Red Zone" blocks and "Underestimated" flags.
    *   **Warning / High-Load (85-100%):** `#F59E0B` (Amber).
    *   **Optimal (50-84%):** `#10B981` (Green).
    *   **Under-Utilized (<50%):** `#D1D5DB` (Gray).
    *   **Overestimated Flag:** `#3B82F6` (Blue).
*   **Typography:** Clean Sans-Serif (Inter or Roboto) for high data density.
*   **Component Style:**
    *   **Cards:** Flat white background, subtle border, rounded corners (4px).
    *   **Heatmap Cells:** Solid color blocks with white text for percentage overlay.

## 6. Future Considerations (Out of Scope for MVP)
*   Authentication/Login.
*   Historical reporting.
