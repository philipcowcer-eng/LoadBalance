# Project Element Lifecycle: Request to Close

This document defines the standard lifecycle for project elements within the Network Engineering Resource Manager. This lifecycle ensures structured onboarding, disciplined technical triage, executive alignment, and clean resource release.

## Lifecycle States Overview

| State | Primary Actor | Description | Exit Criteria |
| :--- | :--- | :--- | :--- |
| **Draft** | Stakeholder | Initial request with business justification. | Submitted for review. |
| **Pending Approval** | Resource Manager | Technical assessment, sizing, and duration set. | RM promotes to Pending. |
| **Approved** | Director / AVP | Final sanctioning and Apptio ID linkage. | Moved to Backlog. |
| **Active** | Manager / PM | Resources assigned and executing work. | Work is finishing. |
| **On Hold** | PM / RM | Project paused due to priority shift or blocker. | Resumed or Cancelled. |
| **Complete** | PM / RM | Deliverables finished; resources released. | Marked as Complete. |
| **Cancelled** | Stakeholder/AVP | Project terminated before completion. | Resources removed. |

---

## Stage-by-Stage Detail

### 1. Request (Intake)
*   **Initiator:** Senior IT Leadership / Stakeholders.
*   **Action:** Click "+ Submit Request" in the Project Registry.
*   **Inputs:** Name, Description, Business Justification, Target Date, Initial T-Shirt Size (S/M/L/XL).
*   **System Result:** Project created in `Draft` state. Not yet visible in the planning workbench.

### 2. Triage & Technical Assessment
*   **Initiator:** Resource Manager (RM).
*   **Action:** Reviews `Draft` projects. Adjusts t-shirt size based on technical complexity (e.g., S -> M).
*   **Refinement:** RM sets the expected **Duration (Weeks)** and suggested **Priority** (P1-P4).
*   **System Result:** RM promotes project to `Pending Approval`.

### 3. Executive Approval
*   **Initiator:** Director / AVP.
*   **Action:** Reviews `Pending Approval` list.
*   **Linkage:** Optionally adds **Apptio Project ID** for financial tracking.
*   **System Result:** Project moves to `Approved` status. It is now visible in the **Team Allocation Workbench** backlog ("The Void").

### 4. Planning & Resource Assignment
*   **Initiator:** Network Manager / Ops Lead.
*   **Action:** Drags project from "The Void" to specific Engineers in the Workbench.
*   **Coordination:** System auto-calculates **PM Overhead** based on developer headcount and project size.
*   **PM Assignment:** RM assigns a Lead PM from the dashboard dropdown.
*   **System Result:** Project transitions to `Active` state. Heatmaps update to show allocation load.

### 5. Execution, Feedback & Monitoring
*   **Initiator:** Project Manager (PM) & Engineers.
*   **PM Actions:** Updates **% Complete**, manages **RID Log** (Risks/Issues/Decisions), and updates **RAG Status** (Red/Amber/Green).
*   **Engineer Actions:** Provides **Accuracy Feedback** (Raise Hand - Under/Overestimated) from "My Week" view.
*   **Monitoring:** Leadership monitors the **Dashboard** for "Effectiveness Capacity" vs. "Demand" and "Burnout Risk".
*   **System Result:** Audit trail captured in the **Impact Log**.

### 6. On Hold (Pause)
*   **Initiator:** Project Manager / Resource Manager.
*   **Action:** Triggers "Put On Hold" from the project details view.
*   **Context:** Used when a project is deprioritized or blocked indefinitely (e.g., budget freeze, dependency wait).
*   **System Result:** Project status changes to `On Hold`. Allocations remain visible but are distinctly styled (e.g., striped/grayed out) to indicate "at risk" capacity. Usage does not burn toward "Effective Capacity" in utilization reports.

### 7. Cancellation (Termination)
*   **Initiator:** Stakeholder / AVP.
*   **Action:** Selects "Cancel Project" and provides a mandatory reason (e.g., "Strategy Shift", "Budget Cut").
*   **System Result:** Project moves to `Cancelled` state.
*   **Resource Impact:** All future allocations are hard-deleted. Used hours remain for historical reporting.
*   **Audit:** Cancellation reason is logged in the **Impact Log** for retrospective analysis.

### 8. Closure & Archival
*   **Initiator:** Project Manager / Resource Manager.
*   **Action:** Marks project as `Complete` once final milestones are hit.
*   **Resource Release:** All active allocations are automatically closed, freeing up engineer capacity in the heatmap for future weeks.
*   **System Result:** Project moved to archive. Final reports generated for budget justification.
