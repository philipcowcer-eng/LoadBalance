# User Stories: Roadmap Phase 3 (Enterprise Ecosystem & Security)

This document details the user stories for **Phase 3**, focusing on **Seamless connectivity, financial alignment, and enterprise-grade security**. It incorporates perspectives from both a **Product Manager** (Value & Acceptance) and a **Full-Stack Engineer** (Implementation Details).

---

## 🛡 Quality & Standards (Definition of Done)
*Industry best practices to be applied to ALL stories below.*

*   **🔒 Secure:** All integrations must use secure authentication (OAuth2, API Keys) and encrypt data in transit (TLS 1.3).
*   **⚡ Performance:** External API calls must be asynchronous (Celery/background workers) to avoid blocking the UI.
*   **🛡 Error Handling:** Robust failure management for 3rd party syncs (retries, dead-letter queues, alert on failure).
*   **📝 Audit Log:** All automated changes (e.g., user provisioning, financial updates) must be recorded in the system audit log.

---

## 🏢 Phase 3: Enterprise Ecosystem & Security
*Goal: Integrate with the corporate environment to automate meaningful work and ensure compliance.*

### US-3.1: Enterprise Security & Identity (SSO + RBAC)
**As a** Security Officer,
**I want to** enforce Single Sign-On (SSO) via the corporate IdP (Okta/Azure AD) and map permissions to Active Directory groups,
**So that** we eliminate password fatigue and automate user access management (JML process).

*   **PM Perspective:**
    *   **Value:** Enterprise Compliance. Removes the friction of manual account creation. "No SSO, no usage" is a common rule.
    *   **Success Metric:** 100% of user logins occur via SSO provider. Manual password login disabled for non-admins.
    *   **Acceptance Criteria:**
        *   User can log in using "Sign in with Microsoft/Okta".
        *   New users are automatically provisioned (JIT) upon first successful SSO login.
        *   System reads AD Group claims (e.g., `NetEng_Managers`) and auto-assigns the "Manager" role.
        *   revoking access in IdP immediately blocks access to the tool.

*   **Engineering Perspective (FSE):**
    *   **Implementation:**
        *   **Backend:** Integrate `python-jose` or an OAuth2 library (Authlib). Configure OIDC endpoints.
        *   **Database:** Update `Users` table to store `sub` (Subject ID) and `issuer`.
        *   **Middleware:** Middleware to validate JWT tokens on every protected request.
        *   **Mapping:** Configuration file or db table mapping `IdP Group Name` -> `Internal Role`.

### US-3.2: Financial Tool Integration (Apptio & PeopleSoft)
**As a** Director of Operations,
**I want to** automatically sync financial project IDs from Apptio and roster changes from PeopleSoft,
**So that** I stop relying on out-of-date spreadsheets and "Swivel Chair" data entry.

*   **PM Perspective:**
    *   **Value:** Data Integrity. The "Financial Truth" (Apptio) matches the "Operational Reality" (Resource Manager).
    *   **Success Metric:** < 4 hours latency between an HR hire/fire and the update reflected in the Resource Manager.
    *   **Acceptance Criteria:**
        *   **Apptio:** Approved projects in Apptio appear in the "Pending" queue with their Financial ID pre-populated.
        *   **PeopleSoft:** New hires are auto-created in the roster. Terminated employees are auto-deactivated.
        *   **Write-Back:** Actual engineer hours per project are pushed back to Apptio for CapEx reporting (daily/weekly).

*   **Engineering Perspective (FSE):**
    *   **Implementation:**
        *   **Workers:** Create scheduled Celery beat tasks: `sync_people_soft`, `sync_apptio_projects`, `push_actuals`.
        *   **Adapters:** Write modular adapters for external APIs to handle rate limits and auth.
        *   **Reconciliation:** Logic to handle conflicts (e.g., User exists but attributes changed). Avoid overwriting manual local overrides without warning.

### US-3.3: Calendar Synchronization (Two-Way)
**As a** Network Engineer,
**I want** my "Deep Work" blocks and specific Project Allocations to appear on my Outlook/Google Calendar,
**So that** colleagues don't book meetings over my dedicated focus time.

*   **PM Perspective:**
    *   **Value:** Operational enforcement. If it's on the calendar, the organization respects it.
    *   **Success Metric:** Reduction in "Deep Work" violations (meetings booked during focus time) by 30%.
    *   **Acceptance Criteria:**
        *   **Deep Work:** recurring "Focus Time" blocks added to calendar for Tue/Thu (or policy days).
        *   **Project Work:** High-priority allocations (P1) appear as "Busy" blocks.
        *   **Two-Way (Stretch):** PTO added in Outlook flows back into Resource Manager availability.

*   **Engineering Perspective (FSE):**
    *   **Implementation:**
        *   **Integration:** Use Microsoft Graph API (Outlook) or Google Calendar API.
        *   **User Auth:** User must authorize calendar access (OAuth2 Grant).
        *   **Sync Logic:** Delta sync preferred. Store `external_event_id` to handle updates/deletes.
        *   **Privacy:** Ensure event titles are descriptive but appropriate (e.g., "Deep Work: Project X").

### US-3.4: Network Inventory Integration (Demand Gen)
**As a** Principal Architect,
**I want to** see hardware "End of Life" (EoL) dates from our inventory system overlaid on the planning timeline,
**So that** I can proactively schedule refresh projects before the hardware goes unsupported.

*   **PM Perspective:**
    *   **Value:** Proactive "Demand Generation". Stops us from reacting to emergencies. Connects "Things" to "People".
    *   **Success Metric:** 80% of Refresh Projects are created > 6 months before EoL date.
    *   **Acceptance Criteria:**
        *   Integration with inventory source (e.g., Cisco Smart Net, ServiceNow, SolarWinds).
        *   Dashboard View: "Upcoming EoL Impact" chart showing device counts expiring by quarter.
        *    Action: "Create Project" button directly from the EoL report, pre-filling device volumes.

*   **Engineering Perspective (FSE):**
    *   **Implementation:**
        *   **Data Model:** Create `HardwareAssets` table linked to `FiscalYears` or `Projects`.
        *   **Ingestion:** ETL job to ingest CSV/API data from inventory tools.
        *   **Visualization:** Gantt chart overlay showing "Safety Zone" vs "Danger Zone" (Post-EoL).

### US-3.5: Public API & Webhooks
**As a** DevOps Engineer,
**I want** a programmatic API to read staffing data and subscribe to "Project Completed" events,
**So that** I can trigger downstream automation (e.g., archive Slack channels, update billing).

*   **PM Perspective:**
    *   **Value:** Ecosystem glue. Allows customers to extend the platform without waiting for us.
    *   **Success Metric:** First custom integration built by a customer within 3 months of release.
    *   **Acceptance Criteria:**
        *   **API:** RESTful endpoints for `GET /engineers`, `GET /projects`, `GET /allocations`. OpenAPI (Swagger) documentation.
        *   **Webhooks:** UI to register URLs for events: `project.created`, `project.completed`, `allocation.changed`.
        *   **Security:** API Key management for service accounts.

*   **Engineering Perspective (FSE):**
    *   **Implementation:**
        *   **Framework:** Use FastAPI's auto-generated docs.
        *   **Auth:** Implement API Key header authentication (`X-API-Key`).
        *   **Webhooks:** Background worker to dispatch HTTP POST requests with exponential backoff for retries.
        *   **Rate Limiting:** Protect the API using `slowapi` or Redis-based limiter.
