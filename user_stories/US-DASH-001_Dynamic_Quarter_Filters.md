# User Story: Dynamic Dashboard Date Filters

## US-DASH-001: Dynamic Quarter Filter with Current Date Context

**Epic:** Dashboard Enhancements  
**Priority:** P1-Critical  
**Estimated Effort:** 3 Story Points

---

### Problem Statement

The Dashboard date filters are **hardcoded** and do not align with the current date or project timelines:

| Issue | Current State | Expected State |
|-------|---------------|----------------|
| **Quarter Options** | Hardcoded: Q4 2024 → Q4 2025 | Dynamic: Current quarter ± 2 quarters |
| **Default Selection** | Q4 2024 (hardcoded) | Current quarter (Q1 2026 as of today) |
| **Smart Insight** | References "Dec 23" and "Nov 18" (2024 dates) | Should reference relevant upcoming dates |
| **Week Labels** | Show Oct-Dec 2024 by default | Should show Jan-Mar 2026 for current quarter |

**User Impact:** Managers viewing the dashboard see outdated data from 2024, making capacity planning impossible.

---

### User Story

**As a** Network Manager,  
**I want** the Dashboard quarter filter to dynamically generate options based on the current date,  
**So that** I can view capacity and utilization data for the current and upcoming quarters without manual configuration.

---

### Acceptance Criteria

#### AC-1: Dynamic Quarter Options
- [ ] Quarter dropdown dynamically generates options based on the current system date
- [ ] Options include: **Current Quarter**, **Previous Quarter**, and **Next 4 Quarters** (6 total)
- [ ] Example for Jan 12, 2026: Q4 2025, **Q1 2026**, Q2 2026, Q3 2026, Q4 2026, Q1 2027

#### AC-2: Default to Current Quarter
- [ ] On page load, the quarter filter defaults to the **current quarter** based on system date
- [ ] Current quarter is visually highlighted or marked (e.g., "(Current)" suffix)

#### AC-3: Week Labels Match Selected Quarter
- [ ] Week labels in charts/tables accurately reflect the selected quarter's date range
- [ ] Labels use format: "Jan 6", "Jan 13", etc. (already working, just needs correct input)

#### AC-4: Project Date Alignment
- [ ] Utilization calculations only show allocations for projects whose `start_date` to `target_end_date` overlaps with the displayed week
- [ ] Projects without dates continue to show in all weeks (current behavior is acceptable)

#### AC-5: Smart Insight Date Relevance
- [ ] The "Smart Insight" message references dates within the selected quarter
- [ ] If no relevant insight, display a placeholder or hide the card

---

### Technical Implementation Notes

**File to Modify:** `frontend/src/App.jsx`

#### 1. Replace hardcoded quarter options (lines ~520-524):
```jsx
// BEFORE (hardcoded):
<option>Q4 2024</option>
<option>Q1 2025</option>
...

// AFTER (dynamic):
{generateQuarterOptions().map(q => (
  <option key={q.value} value={q.value}>
    {q.label}{q.isCurrent ? ' (Current)' : ''}
  </option>
))}
```

#### 2. Add helper function:
```jsx
const generateQuarterOptions = () => {
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
  const currentYear = now.getFullYear();
  
  const options = [];
  // Previous quarter
  let q = currentQuarter - 1;
  let y = currentYear;
  if (q < 1) { q = 4; y--; }
  options.push({ value: `Q${q} ${y}`, label: `Q${q} ${y}`, isCurrent: false });
  
  // Current + next 4 quarters
  for (let i = 0; i < 5; i++) {
    q = ((currentQuarter - 1 + i) % 4) + 1;
    y = currentYear + Math.floor((currentQuarter - 1 + i) / 4);
    options.push({
      value: `Q${q} ${y}`,
      label: `Q${q} ${y}`,
      isCurrent: i === 0
    });
  }
  return options;
};
```

#### 3. Update default state (line ~51):
```jsx
// BEFORE:
const [dashboardQuarterFilter, setDashboardQuarterFilter] = useState('Q4 2024');

// AFTER:
const [dashboardQuarterFilter, setDashboardQuarterFilter] = useState(() => {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3) + 1;
  return `Q${q} ${now.getFullYear()}`;
});
```

#### 4. Update Smart Insight (lines ~576-580):
- Make the insight message dynamic based on selected quarter
- Or hide it if no relevant data exists

---

### Out of Scope

- Fiscal year support (all calculations assume calendar year quarters)
- Historical data archiving for past quarters
- Custom date range selection (future enhancement)

---

### Definition of Done

- [ ] Quarter filter dynamically generates based on current date
- [ ] Default selection is the current quarter (Q1 2026 as of today)
- [ ] Week labels in charts match selected quarter
- [ ] No regressions in: utilization calculations, project filtering, team filtering
- [ ] Manual QA verification across Dashboard, confirming dates are coherent

---

### Related Issues

- Fixes: Dashboard date misalignment reported 2026-01-12
- Blocks: None
- Blocked by: None

---

## Impact Analysis & Safety Verification

### Code Dependency Map

The `dashboardQuarterFilter` state is used in **4 locations**:

| Line | Usage | Risk Level | Mitigation |
|------|-------|------------|------------|
| 51 | State initialization | **LOW** | New default uses same `Qn YYYY` format |
| 335 | Input to `getWeeksForQuarter()` | **LOW** | Function already handles dynamic parsing via regex |
| 508 | `<select value={...}>` binding | **LOW** | No change to binding mechanism |
| 512 | Visual border styling comparison | **LOW** | Update comparison to use current quarter |

### Critical Safety Check: `getWeeksForQuarter()` Function

**Location:** Lines 301-334

**Analysis:** This function already uses a **regex parser** to extract quarter and year from the string format `Qn YYYY`:

```javascript
const match = quarterStr.match(/Q(\d)\s+(\d{4})/);
```

✅ **SAFE:** The function will correctly parse any dynamically generated quarter string (e.g., "Q1 2026", "Q3 2027") as long as it follows the `Qn YYYY` format.

✅ **FALLBACK EXISTS:** If parsing fails, the function recursively calls itself with the current quarter (lines 306-312).

### Downstream Data Flow

```
dashboardQuarterFilter (state)
        │
        ▼
getWeeksForQuarter(quarterStr)
        │
        ▼
weeks[] array (13 week objects with rawDate)
        │
        ├──► isProjectActiveInWeek(projectId, week.rawDate)
        │           │
        │           ▼
        │    Compares project.start_date / target_end_date with week.rawDate
        │    ✅ SAFE: Uses Date comparison, not string format
        │
        ├──► teamTotalData[] (utilization percentages)
        │    ✅ SAFE: Pure calculation, no format dependency
        │
        └──► engineerUtilization[] (per-engineer weekly data)
             ✅ SAFE: Pure calculation, no format dependency
```

### Changes That Require Careful Testing

| Component | Test Scenario | Expected Outcome |
|-----------|---------------|------------------|
| Quarter Dropdown | Page loads | Default = current quarter (Q1 2026) |
| Quarter Dropdown | Click dropdown | Shows 6 options: Q4 2025 → Q1 2027 |
| Week Labels | Select Q1 2026 | Shows Jan 6, Jan 13, ... Mar dates |
| Week Labels | Select Q4 2025 | Shows Oct, Nov, Dec 2025 dates |
| Utilization Chart | Select quarter with projects | Bars reflect correct project overlap |
| Utilization Chart | Select future quarter (no projects) | All bars show 0% (no allocations) |
| Team Filter | Change team while on Q1 2026 | Utilization recalculates correctly |

### Non-Breaking Guarantees

1. **Backend API unchanged** – No backend modifications required
2. **Data format unchanged** – `Qn YYYY` string format preserved
3. **Calculation logic unchanged** – `getWeeksForQuarter()` and utilization math untouched
4. **localStorage unchanged** – `currentPage` persistence unaffected (different key)

### Rollback Plan

If issues are discovered post-implementation:

1. Revert `dashboardQuarterFilter` default to hardcoded value
2. Revert dropdown `<option>` elements to hardcoded list
3. Both changes are in a single file (`App.jsx`), making rollback trivial

### Pre-Implementation Checklist

- [ ] Verify `getWeeksForQuarter()` correctly parses "Q1 2026" format (unit test optional)
- [ ] Ensure generated quarter strings match expected regex pattern
- [ ] Test with edge cases: Q4 → Q1 year transition, leap years
- [ ] Confirm no other files depend on `dashboardQuarterFilter` (grep confirmed: only App.jsx)
