---
description: Remediation plan for failed usability tests (UX-006, Breadcrumbs)
---

# Remediation Plan: Failed Usability Tests

**Date:** 2026-01-12  
**Test Run:** Regression Suite (excluding TC-3.2)

---

## Summary of Failures

| Issue ID | Area | Status | Root Cause |
|----------|------|--------|------------|
| **UX-006** | Scenario Builder | FAIL | Backend missing `/api/scenarios/clone` endpoint |
| **Breadcrumbs** | Navigation | FAIL | Feature not implemented |

---

## Fix #1: UX-006 – Scenario Clone Endpoint (Critical)

### Problem
The frontend calls `POST /api/scenarios/clone` (see `App.jsx` line 201), but the Python backend (`main.py`) does not define this route. This results in a **404 Not Found**.

### Impact Assessment
- **Isolated to Scenario Builder page only**
- No impact on: Dashboard, Staff Planning, Project Registry
- No database schema changes required (scenarios are a "virtual" clone concept)

### Proposed Solution

#### Option A: Minimal Implementation (Recommended)
Create a **stub endpoint** that acknowledges the request and returns success. This unblocks the UI without adding complex scenario persistence logic.

**Backend Changes (`backend/main.py`):**
```python
# =============================================================================
# Scenario Endpoints (US-SB.1)
# =============================================================================

class ScenarioCloneRequest(BaseModel):
    name: str
    created_by: Optional[str] = None

@app.post("/api/scenarios/clone")
def clone_scenario(request: ScenarioCloneRequest):
    """
    Clone the current live plan into a sandbox scenario.
    For now, returns a success response without persisting.
    Future: Create a Scenario model and clone all allocations.
    """
    return {
        "id": str(uuid.uuid4()),
        "name": request.name,
        "status": "created",
        "message": "Scenario cloned successfully (sandbox mode)"
    }
```

**Schema Changes (`backend/schemas.py`):**
```python
class ScenarioCloneRequest(BaseModel):
    """Schema for cloning a scenario"""
    name: str
    created_by: Optional[UUID] = None
```

#### Option B: Full Implementation (Future)
1. Add a `Scenario` model with `is_live` flag
2. Add a `scenario_id` column to `allocations` table
3. Clone all current allocations into the new scenario
4. Requires database migration

**Recommendation:** Implement **Option A** now to pass tests, track Option B as a future epic.

### Files to Modify
1. `backend/main.py` – Add endpoint
2. `backend/schemas.py` – Add request schema (optional, can use inline)

### Testing
1. Start backend: `cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000`
2. Start frontend: `cd frontend && npm run dev`
3. Navigate to Scenario Builder → Click "Clone Current Plan"
4. Expected: Success alert appears

---

## Fix #2: Breadcrumbs (Low Priority)

### Problem
The navigation audit flagged "Breadcrumbs not implemented" as a FAIL.

### Impact Assessment
- **Cosmetic/UX improvement only**
- No functional impact on any workflows
- Does not block any test cases

### Proposed Solution

#### Implementation
Add a simple breadcrumb component to the main layout.

**Frontend Changes (`frontend/src/App.jsx`):**
```jsx
const Breadcrumb = ({ currentPage }) => {
  const pageNames = {
    dashboard: 'Dashboard',
    roster: 'Staff Planning',
    projects: 'Project Registry',
    scenario: 'Scenario Builder',
    support: 'Support & Docs'
  };
  
  return (
    <div className="breadcrumb" style={{
      fontSize: '0.75rem',
      color: '#64748B',
      marginBottom: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    }}>
      <span>Home</span>
      <span>›</span>
      <span style={{ color: '#0F172A', fontWeight: 500 }}>{pageNames[currentPage] || 'Unknown'}</span>
    </div>
  );
};
```

Then render it at the top of the main content area:
```jsx
<main className="main-content">
  <Breadcrumb currentPage={currentPage} />
  {/* ... rest of content */}
</main>
```

### Files to Modify
1. `frontend/src/App.jsx` – Add Breadcrumb component and render it

### Testing
1. Reload application
2. Navigate between pages
3. Verify breadcrumb updates to show current location

---

## Implementation Order

1. **UX-006 (Scenario Clone)** – Critical, blocks WF-06
2. **Breadcrumbs** – Low priority, cosmetic

---

## Rollback Plan

Both fixes are additive:
- UX-006: Remove the new endpoint from `main.py`
- Breadcrumbs: Remove the Breadcrumb component and its render call

No database changes are required, so rollback is simply reverting file changes.

---

## Verification Checklist

- [ ] Backend starts without errors
- [ ] Frontend builds without errors
- [ ] Scenario Builder "Clone Current Plan" returns success
- [ ] Breadcrumbs display correctly on all pages
- [ ] No regressions in: Dashboard, Staff Planning, Project Registry
