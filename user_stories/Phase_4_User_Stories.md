# User Stories: Roadmap Phase 4 (LTD Launch Readiness)

This document details the user stories for **Phase 4**, focusing on **Pre-Launch Blockers** to ensure the application is production-ready. It incorporates perspectives from both a **Product Manager** (Value & Acceptance) and a **Full-Stack Engineer** (Implementation Details).

---

## 🛡 Quality & Standards (Definition of Done)
*Industry best practices to be applied to ALL stories below.*

*   **🔒 Secure:** Guest mode must be disabled in production. All admin actions require authenticated sessions.
*   **📊 Testable:** Export functionality must be validated with sample datasets of 100+ records.
*   **📝 Audit Complete:** All critical operations (login, data changes, imports, restores) must be logged.
*   **💾 Recoverable:** Snapshot restore must be tested with rollback scenario before production.

---

## 🚀 Phase 4: LTD Launch Readiness
*Goal: Close all pre-launch blockers ensuring security, data portability, audit compliance, and data integrity.*

### US-4.1: Authentication & RBAC Polish
**As a** Security Officer,
**I want to** verify that authentication and role-based access control are production-ready,
**So that** only authorized users can access the system and perform appropriate actions.

*   **PM Perspective:**
    *   **Value:** Security & Compliance. Production systems must have proper gating. "Guest mode in production = audit failure."
    *   **Success Metric:** 100% of non-authenticated requests to protected endpoints return 401/403.
    *   **Acceptance Criteria:**
        *   **AC-4.1.1:** Login page renders correctly; valid credentials grant JWT token and redirect to Dashboard.
        *   **AC-4.1.2:** Invalid credentials display clear error message without exposing implementation details.
        *   **AC-4.1.3:** Registration flow creates user with appropriate default role (e.g., "viewer").
        *   **AC-4.1.4:** Admin users can update other users' roles via User Management screen.
        *   **AC-4.1.5:** Guest/demo mode is disabled or explicitly gated behind environment flag for production.
        *   **AC-4.1.6:** Session timeout enforced after 8 hours of inactivity; user redirected to login.
        *   **AC-4.1.7:** Protected routes (Staff Planning, Project Registry, Data Management) redirect to login if not authenticated.

*   **Engineering Perspective (FSE):**
    *   **Implementation:**
        *   **Verify:** Confirm `AuthContext.jsx` correctly handles token storage/validation.
        *   **Verify:** Check `GUEST_MODE` environment variable is read from backend config and defaults to `false`.
        *   **Test:** Attempt direct navigation to `/staff-planning` without auth → should redirect to `/login`.
        *   **Test:** Verify role-based button visibility (e.g., "Add Engineer" hidden for Viewer role).
        *   **Backend:** Ensure `require_permission` decorator is applied to all sensitive endpoints.

---

### US-4.2: Data Export (CSV)
**As a** Resource Manager,
**I want to** export Engineers and Projects data to CSV format,
**So that** I can create offline reports, share with stakeholders, or migrate data to other tools.

*   **PM Perspective:**
    *   **Value:** Data Portability. Users expect to "own" their data. Export is table-stakes for enterprise adoption.
    *   **Success Metric:** Export button used by ≥ 50% of Manager/Admin users within first month.
    *   **Acceptance Criteria:**
        *   **AC-4.2.1:** "Export CSV" button visible on Staff Planning page (within roster section).
        *   **AC-4.2.2:** Clicking triggers download of `engineers_export_YYYYMMDD.csv` containing all roster data.
        *   **AC-4.2.3:** Engineer CSV includes: `id, name, role, total_capacity, ktlo_tax, created_at`.
        *   **AC-4.2.4:** "Export CSV" button visible on Project Registry page.
        *   **AC-4.2.5:** Clicking triggers download of `projects_export_YYYYMMDD.csv` containing all project data.
        *   **AC-4.2.6:** Project CSV includes: `id, name, priority, workflow_status, rag_status, fiscal_year, start_date, target_end_date, pm_name, percent_complete`.
        *   **AC-4.2.7:** Export respects current filters (e.g., if filtering by P1, only P1 projects exported).
        *   **AC-4.2.8:** Large datasets (500+ records) complete export within 5 seconds.

*   **Engineering Perspective (FSE):**
    *   **Implementation:**
        *   **Backend:** Create `GET /api/export/engineers` and `GET /api/export/projects` endpoints.
        *   **Backend:** Use Python's `csv` module with `StreamingResponse` for large datasets.
        *   **Backend:** Include query params for filters: `?priority=P1&fiscal_year=FY25`.
        *   **Frontend:** Add "Export CSV" icon-button in Staff Planning header and Project Registry header.
        *   **Frontend:** Use `fetch` + `blob` download pattern for client-side file trigger.
        *   **Headers:** Set `Content-Type: text/csv` and `Content-Disposition: attachment; filename=...`.

---

### US-4.3: Audit Trail & Snapshots Verification
**As a** Compliance Officer,
**I want to** verify that all critical actions are logged and database snapshots can be restored,
**So that** we have a complete audit trail and disaster recovery capability.

*   **PM Perspective:**
    *   **Value:** Compliance & Recovery. "If it's not logged, it didn't happen." Snapshot restore is the safety net.
    *   **Success Metric:** Activity Log captures 100% of CREATE/UPDATE/DELETE operations on core entities.
    *   **Acceptance Criteria:**
        *   **AC-4.3.1:** Activity Log page displays recent actions with timestamp, user, action type, entity, and details.
        *   **AC-4.3.2:** The following events are captured in the audit log:
            *   User login (success/failure)
            *   User registration
            *   Engineer create/update/delete
            *   Project create/update/status change
            *   Allocation create/update/delete
            *   Snapshot create/restore
            *   Role permission changes
        *   **AC-4.3.3:** Snapshot Manager displays list of available snapshots with creation date and size.
        *   **AC-4.3.4:** "Create Snapshot" generates a timestamped backup file.
        *   **AC-4.3.5:** "Restore Snapshot" prompts confirmation → restores database → auto-creates safety backup → app continues functioning.
        *   **AC-4.3.6:** After restore, navigating to Dashboard shows data from the restored snapshot.
        *   **AC-4.3.7:** Audit log includes entry for "SNAPSHOT_RESTORE" with filename and user.

*   **Engineering Perspective (FSE):**
    *   **Implementation:**
        *   **Verify:** All CRUD endpoints call `record_audit()` with appropriate action type.
        *   **Verify:** `audit_logs` table schema includes: `id, timestamp, action, entity_type, entity_id, details_json, user_id, ip_address`.
        *   **Test:** Create a new engineer → verify entry appears in Activity Log.
        *   **Test:** Create snapshot → modify data → restore snapshot → verify data reverted.
        *   **Backend:** Ensure `snapshots.py` creates pre-restore safety backup before overwriting DB.
        *   **Frontend:** `SnapshotManager.jsx` should display restore confirmation dialog with warning text.

---

### US-4.4: Bulk Import Scale & Edge Case Testing
**As a** Data Administrator,
**I want to** verify that bulk import handles updates, duplicates, and malformed data gracefully,
**So that** I can confidently migrate large datasets without data corruption.

*   **PM Perspective:**
    *   **Value:** Data Integrity. Import is only useful if it handles edge cases. "One bad import = weeks of cleanup."
    *   **Success Metric:** Zero data corruption incidents during initial data migration.
    *   **Acceptance Criteria:**
        *   **AC-4.4.1:** Engineer import with existing name updates the record (upsert) rather than creating duplicate.
        *   **AC-4.4.2:** Engineer import with missing required field (e.g., `name`) reports clear error and skips row.
        *   **AC-4.4.3:** Engineer import with invalid data type (e.g., `ktlo_tax = "abc"`) reports clear error and skips row.
        *   **AC-4.4.4:** Project import with date format `YYYY-MM-DD` parses correctly into start_date/target_end_date.
        *   **AC-4.4.5:** Project import with invalid date format (e.g., `01/15/2025`) reports format error and skips row.
        *   **AC-4.4.6:** Project import with existing project name updates the record (upsert).
        *   **AC-4.4.7:** Import of 200+ row CSV completes within 30 seconds.
        *   **AC-4.4.8:** Import result summary accurately shows: Imported, Skipped, Errors (with row-level details).
        *   **AC-4.4.9:** Import does not leave partial data on failure (transaction rollback or row-level handling).

*   **Engineering Perspective (FSE):**
    *   **Implementation:**
        *   **Backend:** `/api/import/engineers` should query by `name` and update if exists.
        *   **Backend:** Use try/except per row to isolate errors; collect all errors before returning.
        *   **Backend:** Validate date parsing with explicit format (`datetime.strptime(x, "%Y-%m-%d")`).
        *   **Test:** Create test CSV with:
            *   Valid new records
            *   Existing records (should update)
            *   Missing required fields (should error)
            *   Invalid data types (should error)
        *   **Frontend:** `BulkImportManager.jsx` displays clear error breakdown per row number.
        *   **Documentation:** Update import help text with required CSV format and sample file link.

---

## 🗓 Roadmap Integration

| Story ID | Phase | Priority | Primary Stack | Effort |
|---|---|---|---|---|
| US-4.1 | 4 | Critical | Full Stack (Security) | Med |
| US-4.2 | 4 | High | Backend + Frontend | Med |
| US-4.3 | 4 | Critical | Full Stack | Low-Med |
| US-4.4 | 4 | High | Backend | Med |

---

## 📋 Pre-Launch Checklist Summary

| Check | Status | Owner |
|---|---|---|
| Auth: Login/Register functional | ⬜ Pending | Security |
| Auth: Guest mode disabled for prod | ⬜ Pending | Security |
| Export: Engineer CSV works | ⬜ Pending | Engineering |
| Export: Project CSV works | ⬜ Pending | Engineering |
| Audit: Key events logged | ⬜ Pending | Compliance |
| Snapshot: Create works | ⬜ Pending | Engineering |
| Snapshot: Restore works | ⬜ Pending | Engineering |
| Import: Engineer upsert works | ⬜ Pending | Engineering |
| Import: Project date parsing works | ⬜ Pending | Engineering |
| Import: Error handling graceful | ⬜ Pending | Engineering |
