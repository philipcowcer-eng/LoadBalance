# Workflow Diagrams: Network Engineering Resource Manager

This document outlines the core workflows for each key end-user profile identified in the User Stories.

## 1. Network Manager / Ops Lead
**Goal:** Manage team roster, assign work, and monitor capacity.

```mermaid
graph TD
    Start([Start]) --> Login
    Login --> Dashboard{View Dashboard}
    
    subgraph "Roster Management"
        Dashboard -->|Manage Roster| ViewRoster[View Team Roster]
        ViewRoster --> AddEng[Add Engineer]
        ViewRoster --> EditEng[Edit Engineer Profile]
        EditEng --> SetKTLO[Set KTLO/Ops Tax]
    end
    
    subgraph "Capacity Planning"
        Dashboard -->|Plan Week| Workbench[Team Allocation Workbench]
        Workbench --> DragDrop[Drag Project from Void to Engineer]
        DragDrop --> CheckCap{Over Capacity?}
        CheckCap -->|Yes| Warning[Red Heatmap Warning]
        CheckCap -->|No| Assigned[Allocation Saved]
        
        Workbench --> ReviewFeedback[Review Engineer Flags]
        ReviewFeedback --> Resolve[Resolve Over/Under Estimates]
    end
    
    subgraph "Monitoring"
        Dashboard --> Monitor[Monitor Utilization Heatmap]
        Monitor --> Alerts[Check Burnout Alerts]
    end
```

## 2. Network Engineer
**Goal:** View schedule, execute work, and provide feedback.

```mermaid
graph TD
    Start([Start]) --> Login
    Login --> MyWeek[View 'My Week']
    
    subgraph "Execution & Feedback"
        MyWeek --> ReviewAlloc[Review Allocations]
        ReviewAlloc --> CheckAcc{Accuracy Check}
        CheckAcc -->|Too Little Time| FlagUnder[Flag 'Underestimated']
        CheckAcc -->|Too Much Time| FlagOver[Flag 'Overestimated']
        CheckAcc -->|OK| Execute[Execute Work]
        
        FlagUnder --> NotifyMgr[Manager Notified]
        FlagOver --> NotifyMgr
    end
```

## 3. Senior IT Leader / Stakeholder
**Goal:** Submit requests and track project status.

```mermaid
graph TD
    Start([Start]) --> Login
    
    subgraph "Project Intake"
        Login --> NewReq[Submit Project Request]
        NewReq --> Form[Fill Name, Justification, Size]
        Form --> Submit --> Draft[Project in 'Draft' Status]
    end
    
    subgraph "Visibility"
        Login --> ViewReg[View Project Registry]
        ViewReg --> Filter[Filter by My Projects]
        Filter --> CheckStatus{Check Status}
        CheckStatus -->|Healthy| Good[No Action]
        CheckStatus -->|At Risk| InvImpact[Investigate 'Impact Log']
        InvImpact --> ViewReason[See Displacement Reason]
    end
```

## 4. Principal Network Architect
**Goal:** Define priorities and technical requirements.

```mermaid
graph TD
    Start([Start]) --> Login
    Login --> Registry[Project Registry]
    
    subgraph "Prioritization"
        Registry --> CreateProj[Create/Edit Project]
        CreateProj --> SetPrio[Set Priority P1-P4]
        CreateProj --> DefineRoles[Define Resource Profiles]
    end
    
    subgraph "Review"
        Registry --> ReviewStack[Review Priority Stack]
        ReviewStack --> Adjust[Re-stack if needed]
    end
```

## 5. Project Manager
**Goal:** Deliver projects on time/budget and manage risks.

```mermaid
graph TD
    Start([Start]) --> Login
    
    subgraph "Project Execution"
        Login --> MyProj[Filter 'My Projects']
        MyProj --> CheckStatus{Status Check}
        CheckStatus -->|On Track| UpdateProg[Update % Complete]
        CheckStatus -->|At Risk| UpdateRAG[Set Status to Amber/Red]
        UpdateRAG --> LogRisk[Add to Risk/Issues Log]
        
        MyProj --> EditDet[Edit Details]
        EditDet --> ChangeDates[Update Start/End Dates]
        EditDet --> RequestRes[Request Resources]
    end
```

## 6. Director / AVP
**Goal:** Approve work, high-level planning, and budget justification.

```oermaid
graph TD
    Start([Start]) --> Login
    
    subgraph "Approval Workflow"
        Login --> Pending[View Pending Projects]
        Pending --> Review[Review Justification & Size]
        Review --> LinkApptio[Link Apptio ID]
        LinkApptio --> Decision{Approve?}
        Decision -->|Yes| Approved[Move to Backlog]
        Decision -->|No| Reject[Reject/Request Info]
    end
    
    subgraph "Strategic Planning"
        Login --> Scenario[Scenario Builder]
        Scenario --> Clone[Clone Live Plan]
        Clone --> Sim[Simulate 'Add Headcount']
        Sim --> ViewDelta[View Impact on 'The Void']
        
        Login --> Reports[Compliance Reports]
        Reports --> Justify[Budget Justification Report]
    end
```

## 6. Resource Manager
**Goal:** Refine intake and manage PM capacity.

```mermaid
graph TD
    Start([Start]) --> Login
    
    subgraph "Intake Refinement"
        Login --> Inbox[View Draft Projects]
        Inbox --> Assess[Technical Assessment]
        Assess --> Resize[Adjust T-Shirt Size]
        Resize --> SetDur[Set Duration]
        SetDur --> MovePending[Move to Pending Approval]
    end
    
    subgraph "PM Management"
        Login --> Workbench[Team Workbench]
        Workbench --> ExpandPM[Expand PM Section]
        ExpandPM --> AssignPM[Assign PM to Project]
        AssignPM --> Balance[Balance PM Load]
    end
```
