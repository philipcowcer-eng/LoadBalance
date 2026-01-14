# Test Cases: Network Engineering Resource Manager

This document outlines the test cases for the Network Engineering Resource Manager. 
**Note for Testing Agent:** Please fill in the "Findings" and "Status" sections for each test case during execution.

## Epic 1: Foundation & Roster Management

### TC-1.1: Effective Capacity Calculation
- **Description:** Verify that the system calculates `Effective Capacity = Total Capacity - KTLO Tax` correctly.
- **Prerequisites:** Access to Roster Management.
- **Steps:**
    1. Navigate to Roster Management.
    2. Add a new engineer with Total Capacity = 40 hours and KTLO Tax = 10 hours.
    3. Save the engineer.
- **Expected Result:** The engineer's Effective Capacity should display as 30 hours.
- **Agent Testing Results:**
    - **Status:** [PENDING/PASSED/FAILED]
    - **Findings:** 

### TC-1.2: Manage Engineer Roster
- **Description:** Verify that engineers can be added, edited, and roles assigned.
- **Prerequisites:** Access to Roster Management.
- **Steps:**
    1. Add an engineer named "Test Engineer" with role "Wireless Engineer".
    2. Edit "Test Engineer" and change role to "Architect".
    3. Verify the role change persists.
- **Expected Result:** Engineer details are updated correctly in the database and UI.
- **Agent Testing Results:**
    - **Status:** [PENDING/PASSED/FAILED]
    - **Findings:** 

### TC-1.3: High Ops Tax Visual Indicator
- **Description:** Verify a visual indicator appears when KTLO/Ops tax exceeds 50% of total capacity.
- **Prerequisites:** Access to Roster Management.
- **Steps:**
    1. Edit an engineer.
    2. Set Total Capacity = 40 hours and KTLO Tax = 25 hours (62.5%).
- **Expected Result:** A visual warning or indicator should be visible for this engineer's profile or row.
- **Agent Testing Results:**
    - **Status:** [PENDING/PASSED/FAILED]
    - **Findings:** 

### TC-1.4: Integrated PTO Management
- **Description:** Verify that PTO entries correctly reduce Effective Capacity to zero for the specific week.
- **Prerequisites:** Planning Board access.
- **Steps:**
    1. Select an engineer.
    2. Add a PTO entry for a full week.
- **Expected Result:** The engineer's heatmap for that week should show 0 capacity and display a striped "PTO" block.
- **Agent Testing Results:**
    - **Status:** [PENDING/PASSED/FAILED]
    - **Findings:** 

---

## Epic 2: Project Registry & Prioritization

### TC-2.1: Project Creation and Priority
- **Description:** Verify projects can be created with P1-P4 priorities.
- **Prerequisites:** Access to Project Registry.
- **Steps:**
    1. Create a new project "Test Project Alpha" with Priority = "P1-Critical".
    2. Create another project "Test Project Beta" with Priority = "P4-Low".
- **Expected Result:** Both projects appear in the registry with correct priority levels.
- **Agent Testing Results:**
    - **Status:** [PENDING/PASSED/FAILED]
    - **Findings:** 

### TC-2.2: Displacement Tracking (Impact Log)
- **Description:** Verify that reducing or removing an allocation logs a displacement event.
- **Prerequisites:** An engineer assigned to a project.
- **Steps:**
    1. Navigate to the Planning Board.
    2. Reduce an existing allocation for "Project X" from 10 hours to 0 hours.
    3. Provide a reason when prompted (e.g., "Displaced by P1").
- **Expected Result:** An entry is added to the Impact Log with Date, Project, Previous Hours (10), New Hours (0), and Reason.
- **Agent Testing Results:**
    - **Status:** [PENDING/PASSED/FAILED]
    - **Findings:** 

---

## Epic 3 & 4: Allocation & Policy

### TC-3.1: Drag-and-Drop Assignment
- **Description:** Verify dragging a project from the "Void" to an engineer assigns hours.
- **Prerequisites:** "The Void" has unassigned projects.
- **Steps:**
    1. Navigate to the Planning Board.
    2. Drag a project card from "The Void" sidebar onto an engineer's row.
- **Expected Result:** The project is assigned to the engineer, and their allocated hours update instantly.
- **Agent Testing Results:**
    - **Status:** [PENDING/PASSED/FAILED]
    - **Findings:** 

### TC-3.2: 2-Hour Block Constraint
- **Description:** Verify that allocations are enforced in increments of 2 hours.
- **Prerequisites:** Planning Board access.
- **Steps:**
    1. Attempt to assign an allocation of 3 hours to an engineer.
- **Expected Result:** The system should either round the value or prevent the entry, enforcing 2-hour increments (e.g., 2 or 4 hours).
- **Agent Testing Results:**
    - **Status:** [PENDING/PASSED/FAILED]
    - **Findings:** 

### TC-3.3: Utilization Heatmap Colors
- **Description:** Verify heatmap colors reflect utilization correctly.
- **Prerequisites:** Planning Board with various allocations.
- **Steps:**
    1. Assign work such that utilization is <50%.
    2. Assign work such that utilization is 85-100%.
    3. Assign work such that utilization is >100%.
- **Expected Result:**
    - <50%: Gray (`#D1D5DB`)
    - 85-100%: Amber (`#F59E0B`)
    - >100%: Red (`#EF4444`)
- **Agent Testing Results:**
    - **Status:** [PENDING/PASSED/FAILED]
    - **Findings:** 

### TC-3.4: Deep Work Guardian
- **Description:** Verify warning for meetings on Tue/Thu.
- **Prerequisites:** Planning Board access.
- **Steps:**
    1. Add an allocation of type "Meetings" on a Tuesday or Thursday.
- **Expected Result:** A `PolicyViolationWarning` should be displayed.
- **Agent Testing Results:**
    - **Status:** [PENDING/PASSED/FAILED]
    - **Findings:** 

---

## Epic 5: Engineer Feedback

### TC-5.1: Raise Hand (Underestimated/Overestimated)
- **Description:** Verify engineers can flag allocations.
- **Prerequisites:** Access to "My Week" view.
- **Steps:**
    1. Navigate to "My Week" view.
    2. Click "Underestimated" on an allocation.
    3. Click "Overestimated" on another allocation.
- **Expected Result:** Underestimated shows a Red dot; Overestimated shows a Blue dot. Flags are visible to the manager.
- **Agent Testing Results:**
    - **Status:** [PENDING/PASSED/FAILED]
    - **Findings:** 

---

## Epic 6: Scenario Builder

### TC-6.1: Sandbox Branching
- **Description:** Verify cloning the live plan into a sandbox.
- **Prerequisites:** Existing live plan with allocations.
- **Steps:**
    1. Navigate to Scenario Builder.
    2. Click "Clone Current Plan".
    3. Modify allocations in the sandbox.
    4. Discard changes.
- **Expected Result:** Live plan remains unchanged after sandbox modifications are discarded.
- **Agent Testing Results:**
    - **Status:** [PENDING/PASSED/FAILED]
    - **Findings:** 

---

## Epic 7: Project Intake & Approval

### TC-7.1: Submit Project Request
- **Description:** Verify project submission in "Draft" status.
- **Prerequisites:** Access to Project Intake form.
- **Steps:**
    1. Fill out intake form: Name, Description, Justification, Size (M).
    2. Submit request.
- **Expected Result:** Project is created with "Draft" status and is visible to the Resource Manager.
- **Agent Testing Results:**
    - **Status:** [PENDING/PASSED/FAILED]
    - **Findings:** 

### TC-7.2: Review & Approve Project
- **Description:** Verify project moves through Pending to Approved.
- **Prerequisites:** A project in "Draft" status.
- **Steps:**
    1. Resource Manager reviews Draft project, sets duration (4 weeks).
    2. Director/AVP approves the project.
- **Expected Result:** Project status changes from Draft -> Pending Approval -> Approved. It then appears in the backlog.
- **Agent Testing Results:**
    - **Status:** [PENDING/PASSED/FAILED]
    - **Findings:** 

### TC-7.3: Auto-Calculate PM Overhead
- **Description:** Verify PM hours are calculated correctly based on developer assignments.
- **Prerequisites:** Approved project.
- **Steps:**
    1. Assign 2 engineers to a "Medium" sized project.
- **Expected Result:** PM overhead is calculated using the formula: `(Project Size - 1 Fibonacci) + (1h if ≥2 engineers)`. Verify the badge value matches calculation.
- **Agent Testing Results:**
    - **Status:** [PENDING/PASSED/FAILED]
    - **Findings:** 

### TC-7.4: Assign PM to Project
- **Description:** Verify PM assignment and capacity update.
- **Prerequisites:** Project with calculated PM overhead.
- **Steps:**
    1. Use "Assign PM" dropdown to select a PM (e.g., Alex Rivera).
- **Expected Result:** PM "Alex Rivera" receives the calculated hours in their allocation view, and their capacity reflects the increase.
- **Agent Testing Results:**
    - **Status:** [PENDING/PASSED/FAILED]
    - **Findings:** 
