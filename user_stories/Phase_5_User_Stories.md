# User Stories: Roadmap Phase 5 (Market Gap Remediation)

This document details the user stories for **Phase 5**, focusing on **Competitive Parity** based on the recent Market Review. These features address critical gaps to ensure the application is production-ready and competitive with market leaders like Float and Runn.

---

## 🎯 Phase 5: Gap Remediation
*Goal: Address critical functionality gaps (Conflict Detection, Granular Skills) to achieve production readiness.*

### US-5.1: Skill Tags & Filtering
**As a** Resource Manager,
**I want to** assign specific skills (e.g., "BGP", "Python") to engineers and filter the planning view by them,
**So that** I can find the right person for a specialized task, not just any available body.

*   **PM Perspective:**
    *   **Value:** Precision Staffing. "Network Engineer" is too broad. We need to distinguish between a WiFi expert and a Firewall expert to prevent project failure.
    *   **Success Metric:** Filter used in > 30% of planning sessions.
    *   **Acceptance Criteria:**
        *   **AC-5.1.1:** "Add Engineer" and "Edit Engineer" modals include a "Skills" input field (comma-separated text).
        *   **AC-5.1.2:** Skills are saved to the database and persisted across sessions.
        *   **AC-5.1.3:** Staff Planning sidebar includes a "Filter by Skill" dropdown.
        *   **AC-5.1.4:** Dropdown dynamically populates with the unique list of all skills defined in the system.
        *   **AC-5.1.5:** Selecting a skill (e.g., "BGP") hides all engineers who do not possess that skill tag.
        *   **AC-5.1.6:** Clearing the filter restores the full team view.

*   **Engineering Perspective (FSE):**
    *   **Implementation:**
        *   **Database:** Add `skills` column (Text/JSON) to `Engineers` table in `models.py`.
        *   **Backend:** Serialize/Deserialize JSON string in `main.py` endpoints.
        *   **Frontend:** Update `AddEngineerModal` / `EditEngineerModal` with text input.
        *   **Frontend Check:** `availableSkills` computed derived from unique set of all engineer skills.
        *   **Frontend Check:** `engineerSchedules` filtered by `eng.skills.includes(selectedSkill)`.

---

### US-5.2: Automated Conflict Detection (Utilization Logic)
**As a** Resource Manager,
**I want to** see a reliable, system-wide alert when engineers are overloaded,
**So that** I don't accidentally burn out my team or schedule impossible work delivery.

*   **PM Perspective:**
    *   **Value:** Risk Mitigation. Visual cues are insufficient for huge rosters. We need a "Check Engine Light" for capacity.
    *   **Success Metric:** "Team Overload" count reduces to < 5% of staff week-over-week.
    *   **Acceptance Criteria:**
        *   **AC-5.2.1:** "Current Impact" banner at the top of the dashboard displays "Unassigned Hours" and "Team Overload" count.
        *   **AC-5.2.2:** Validation logic runs on the **Backend**, not just the current frontend view (ensuring accuracy even with pagination filters).
        *   **AC-5.2.3:** "Team Overload" counts any engineer whose total allocated hours > their effective capacity (Total - KTLO).
        *   **AC-5.2.4:** "Unassigned Hours" sums the gap between Project Requirements and actual Allocations across all active projects.
        *   **AC-5.2.5:** "At Risk" count highlights engineers with high utilization (e.g., > 85%) but not yet overloaded, acting as an early warning.

*   **Engineering Perspective (FSE):**
    *   **Implementation:**
        *   **Backend:** Create `/api/utilization/report` endpoint.
        *   **Logic:** Iterate all engineers → Sum Allocations → Compare vs Capacity.
        *   **Logic:** Iterate all Projects → Compare Requirements vs Allocations.
        *   **Frontend:** `App.jsx` fetches this report on load and binds it to the Impact Banner.
        *   **Performance:** Ensure logic is efficient (O(N) pass) to handle 100+ engineers without lag.

---

## 🗓 Roadmap Integration

| Story ID | Phase | Priority | Primary Stack | Effort |
|---|---|---|---|---|
| US-5.1 | 5 | High (P1) | Full Stack | Med |
| US-5.2 | 5 | Critical (P0) | Backend + UI | Med |

---

## 📋 Remediation Checklist Summary

| Check | Status | Owner |
|---|---|---|
| Skill Tags: DB Schema Updated | ✅ Complete | Engineering |
| Skill Tags: UI Filtering Works | ✅ Complete | Engineering |
| Conflict: Backend API Created | ✅ Complete | Engineering |
| Conflict: UI Banner Connected | ✅ Complete | Engineering |
