# Issues Tracker: Test Case Execution

**Date:** 2026-01-11  
**Tester:** Antigravity Agent  
**Backend:** Python FastAPI (port 8001)  
**Frontend:** React (port 5173)

---

## Executive Summary
This document tracks issues discovered during systematic testing of the Network Engineering Resource Manager. All critical items identified in the initial React frontend audit have been resolved.

---

## Test Execution Results

### Epic 1: Foundation & Roster Management

#### TC-1.1: Effective Capacity Calculation
- **Status:** ✅ PASSED
- **Test Date:** 2026-01-11
- **Method:** API + Frontend (Roster Table)
- **Result:** Engineer created/edited correctly shows `effective_capacity = total_capacity - ktlo_tax`.

#### TC-1.2: Manage Engineer Roster
- **Status:** ✅ PASSED
- **Test Date:** 2026-01-11
- **Method:** Frontend (Add/Edit Engineer Modal)
- **Result:** Engineers can be added and edited. Fixed 422 errors by aligning Enum values and property names.

#### TC-1.3: High Ops Tax Visual Indicator
- **Status:** ✅ PASSED
- **Result:** Dashboard KPI cards showing "Adjusted for 24h OPS/KTLO" correctly reflects team-wide tax.

---

### Epic 2: Project Registry & Prioritization

#### TC-2.1: Project Creation and Priority
- **Status:** ✅ PASSED
- **Test Date:** 2026-01-11
- **Method:** Frontend (New Project Modal)
- **Result:** Projects created with correct priority and status.

#### TC-2.2: Displacement Tracking (Impact Log)
- **Status:** ✅ PASSED
- **Test Date:** 2026-01-11
- **Method:** Frontend + API
- **Result:** **RESOLVED BUG-001.** Impact logs are now correctly retrieved and displayed (verified via curl and DB dump). PATCH operations on projects correctly trigger impact log entries.

---

### Epic 5: Engineer Feedback

#### TC-5.1: Raise Hand (Underestimated/Overestimated)
- **Status:** ✅ PASSED
- **Method:** Frontend ("My Week" Modal)
- **Result:** Engineers can view their allocations and flag them as Under/Overestimated.

---

### Epic 7: Project Intake & Approval

#### TC-7.1: Submit Project Request
- **Status:** ✅ PASSED
- **Result:** "New Project" workflow in Registry works correctly.

#### TC-7.2: Review & Approve Project
- **Status:** ✅ PASSED
- **Test Date:** 2026-01-11
- **Method:** Frontend (Project Detail Modal)
- **Result:** Implemented context-specific workflow buttons (e.g., "Submit for Approval", "Approve", "Activate"). verified that clicking them updates the project's `workflow_status` in the DB and reflects immediately in the UI.

#### TC-7.4: Assign PM to Project
- **Status:** ✅ PASSED
- **Result:** Project PM can be assigned via the Manage Project modal.

#### TC-0.1: Project as Shared Domain Entity
- **Status:** ✅ PASSED
- **Test Date:** 2026-01-11
- **Method:** Roster Screen Side Panel
- **Result:** Successfully implemented "Engineer Details" panel in Roster view that fetches real-time allocations for the selected engineer. Updates to projects (e.g., status changes) are reflected across all screens.

---

## Critical Blockers Summary
1.  **BUG-001 (RESOLVED):** Impact Log retrieval endpoint fixed (cast UUID to string in filter).
2.  **BUG-002 (RESOLVED):** Port mismatch resolved (all components updated to port 8001).
3.  **BUG-003 (RESOLVED):** Empty role field fixed (aligned `role` property across frontend and backend).
4.  **BUG-004 (RESOLVED):** Pre-population and save errors in Project Modal fixed.

---

## Detailed Findings

### Successfully Tested (React Frontend)
- ✅ **Roster Management:** Full CRUD with role alignment.
- ✅ **Project Registry:** Comprehensive management modal with RID and Allocations.
- ✅ **Dashboard:** KPI cards and utilization table working with real data.
- ✅ **Impact Logs:** Verified end-to-end tracking of changes.

### Recommendations
1.  **Refinement:** Improve the "Add Allocation" form's validation feedback (show why button is disabled).
2.  **Backend:** Implement auto-calculation for PM overhead as a background task.
3.  **UI:** Move "Project Status" section higher in the Project Detail Modal for better visibility.

---

## Test Execution Log

### 2026-01-11 - Lifecycle & Shared Entity Session
- **BUG-001:** Verified fix for Impact Log retrieval.
- **BUG-005 (RESOLVED):** RID Log Retrieval fixed (cast UUID to string in filter).
- **TC-7.2:** Implemented full lifecycle transition UI in Registry.
- **TC-0.1:** Added cross-screen visibility by linking Roster to Project Allocations.
- **Intake:** Aligned Project Intake form with `project_lifecycle.md` requirements.
