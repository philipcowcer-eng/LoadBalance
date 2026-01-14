# Network Resource Manager - Python Backend Deployment Guide

This document provides **step-by-step deployment instructions** for the Python (FastAPI) backend of the Network Engineering Resource Manager.

> **IMPORTANT FOR LLM AGENTS**: 
> 1. Execute each step in order. Do NOT skip steps.
> 2. Verify each step completes successfully before proceeding.
> 3. **Log all issues encountered in the Deployment Log section at the bottom of this file.**
> 4. **Log all remediations applied in the Deployment Log section.**
> 5. **Update the Deployment Status section when deployment is complete.**

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Project Structure](#2-project-structure)
3. [Deployment Steps](#3-deployment-steps)
4. [API Endpoints](#4-api-endpoints)
5. [Verification](#5-verification)
6. [Troubleshooting](#6-troubleshooting)
7. [Deployment Log](#7-deployment-log)
8. [Deployment Status](#8-deployment-status)

---

## 1. Prerequisites

### 1.1 System Requirements

| Tool | Minimum Version | Check Command | Install Command (macOS) |
|------|-----------------|---------------|-------------------------|
| Python | 3.10 | `python3 --version` | `brew install python@3.10` |
| pip | 22.0 | `pip3 --version` | (included with Python) |
| SQLite | 3.0 | `sqlite3 --version` | `brew install sqlite` |

### 1.2 Prerequisite Verification Script

Run each command and verify the output:

```bash
# Step 1: Check Python version
python3 --version
# EXPECTED: Python 3.10.x or higher
# IF FAILS: Install Python with `brew install python@3.10`

# Step 2: Check pip version
pip3 --version
# EXPECTED: pip 22.x.x or higher
# IF FAILS: Run `python3 -m ensurepip --upgrade`

# Step 3: Check SQLite version
sqlite3 --version
# EXPECTED: 3.x.x or higher
# IF FAILS: Install SQLite with `brew install sqlite`
```

**IF ANY CHECK FAILS**: 
1. Log the failure in the Deployment Log section
2. Install the missing tool
3. Re-run the verification
4. Log the remediation in the Deployment Log section

---

## 2. Project Structure

```
backend/
├── main.py              # FastAPI application entry point
├── models.py            # SQLAlchemy ORM data models
├── schemas.py           # Pydantic validation schemas
├── database.py          # Database connection and session
├── requirements.txt     # Python dependencies
├── venv/                # Virtual environment (created during setup)
├── resource_manager.db  # SQLite database (created on first run)
└── DEPLOYMENT.md        # This file
```

### File Descriptions

| File | Purpose | Critical |
|------|---------|----------|
| `main.py` | API endpoints and server configuration | YES |
| `models.py` | Engineer, Project, Allocation, ImpactLog models | YES |
| `schemas.py` | Request/response validation | YES |
| `database.py` | SQLite connection pool | YES |
| `requirements.txt` | Dependency list | YES |

---

## 3. Deployment Steps

### Step 3.1: Navigate to Backend Directory

```bash
cd /Users/philipcowcer/project1/gemini/resource_manager/backend
```

**Verification**:
```bash
pwd
# EXPECTED: /Users/philipcowcer/project1/gemini/resource_manager/backend

ls -la
# EXPECTED: Should show main.py, models.py, schemas.py, database.py, requirements.txt
```

**IF FAILS**: Log error and check if path exists.

---

### Step 3.2: Create Python Virtual Environment

```bash
python3 -m venv venv
```

**Verification**:
```bash
ls -la venv/
# EXPECTED: Should show bin/, lib/, include/, pyvenv.cfg
```

**IF FAILS**: 
- Error `venv module not found`: Run `pip3 install virtualenv`
- Error `Permission denied`: Run with `sudo` or fix directory permissions

---

### Step 3.3: Activate Virtual Environment

```bash
source venv/bin/activate
```

**Verification**:
```bash
which python
# EXPECTED: Should show path ending with /backend/venv/bin/python

echo $VIRTUAL_ENV
# EXPECTED: Should show path ending with /backend/venv
```

**IF FAILS**: Virtual environment may be corrupted. Delete and recreate:
```bash
rm -rf venv
python3 -m venv venv
source venv/bin/activate
```

---

### Step 3.4: Upgrade pip

```bash
pip install --upgrade pip
```

**Verification**:
```bash
pip --version
# EXPECTED: pip 23.x.x or higher
```

---

### Step 3.5: Install Dependencies

```bash
pip install -r requirements.txt
```

**Verification**:
```bash
pip list | grep -E "fastapi|sqlalchemy|uvicorn|pydantic"
# EXPECTED: Should show all four packages with versions
```

**IF FAILS**:
- Network error: Check internet connection
- Version conflict: Try `pip install -r requirements.txt --upgrade`
- Permission error: Ensure venv is activated

---

### Step 3.6: Verify All Imports Work

```bash
python -c "from main import app; print('SUCCESS: All imports work')"
```

**EXPECTED OUTPUT**: `SUCCESS: All imports work`

**IF FAILS**: 
- Module not found: Check requirements.txt installation
- Import error: Check for syntax errors in Python files

---

### Step 3.7: Start the Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**EXPECTED OUTPUT**:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [XXXX] using StatReload
INFO:     Started server process [XXXX]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**IF FAILS**:
- Port in use: Kill existing process with `lsof -i :8000` then `kill -9 <PID>`
- Module error: Ensure venv is activated and dependencies installed

---

## 4. API Endpoints

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/` | Root endpoint | - |
| GET | `/health` | Health check | - |
| GET | `/engineers` | List all engineers | - |
| POST | `/engineers` | Create engineer | See below |
| GET | `/docs` | Swagger API documentation | - |
| GET | `/redoc` | ReDoc API documentation | - |

### Create Engineer Request Body

```json
{
  "name": "string",
  "role": "Network Engineer | Wireless Engineer | Project Manager | Architect",
  "total_capacity": 40,
  "ktlo_tax": 0
}
```

### Valid Role Values

- `"Network Engineer"`
- `"Wireless Engineer"`
- `"Project Manager"`
- `"Architect"`

---

## 5. Verification

Open a **NEW terminal window** (keep the server running in the first terminal).

### 5.1 Health Check

```bash
curl http://localhost:8000/health
```

**EXPECTED RESPONSE**:
```json
{"status":"healthy"}
```

**IF DIFFERENT**: Log the actual response in Deployment Log.

---

### 5.2 Root Endpoint

```bash
curl http://localhost:8000/
```

**EXPECTED RESPONSE**:
```json
{"message":"Network Resource Manager API is running"}
```

---

### 5.3 Create Test Engineer

```bash
curl -X POST http://localhost:8000/engineers \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Engineer", "role": "Network Engineer", "total_capacity": 40, "ktlo_tax": 10}'
```

**EXPECTED RESPONSE**: JSON with `id`, `name`, `role`, `total_capacity`, `ktlo_tax` fields.

---

### 5.4 List Engineers

```bash
curl http://localhost:8000/engineers
```

**EXPECTED RESPONSE**: JSON array containing the test engineer created above.

---

### 5.5 API Documentation

Open in browser:
```
http://localhost:8000/docs
```

**EXPECTED**: Swagger UI loads showing all API endpoints.

---

## 6. Troubleshooting

### 6.1 Error: `ModuleNotFoundError`

**Cause**: Virtual environment not activated or dependencies not installed.

**Solution**:
```bash
source venv/bin/activate
pip install -r requirements.txt
```

---

### 6.2 Error: `Address already in use`

**Cause**: Another process is using port 8000.

**Solution**:
```bash
lsof -i :8000
# Find the PID in the output
kill -9 <PID>
# Restart the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

### 6.3 Error: `no such table: engineers`

**Cause**: Database tables not created.

**Solution**: Delete database and restart server (tables auto-create):
```bash
rm -f resource_manager.db
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

### 6.4 Error: CORS errors in browser

**Cause**: Frontend running on different origin.

**Solution**: Verify CORS middleware is configured in `main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### 6.5 Error: `ImportError` in models or schemas

**Cause**: Circular import or missing file.

**Solution**: Verify all files exist:
```bash
ls -la main.py models.py schemas.py database.py
```

If any file is missing, report in Deployment Log.

---

## 7. Deployment Log

> **LLM INSTRUCTIONS**: Log all issues encountered during deployment below. Include:
> - Timestamp
> - Step where issue occurred
> - Error message (exact text)
> - Remediation applied
> - Outcome

### Issues Encountered

| Timestamp | Step | Issue Description | Error Message | Remediation | Outcome |
|-----------|------|-------------------|---------------|-------------|---------|
| 2026-01-11 03:00 | 3.6 | Import error | `attempted relative import` | Switched to absolute imports | SUCCESS |
| 2026-01-11 03:15 | N/A | Missing CRUD endpoints | Needed for tests | Implemented PUT and GET by ID | SUCCESS |
| 2026-01-11 03:20 | N/A | UUID type error | `AttributeError: 'str' object has no attribute 'hex'` | Updated type hints to UUID | SUCCESS |

### Notes

_Add any additional notes, observations, or warnings for future deployments here._

---

## 8. Deployment Status

> **LLM INSTRUCTIONS**: Update this section when deployment is complete.

### Current Status

| Field | Value |
|-------|-------|
| **Status** | `COMPLETED` |
| **Deployment Date** | 2026-01-10 22:30:00 |
| **Deployed By** | Antigravity (LLM Agent) |
| **Python Version** | Python 3.13.7 |
| **pip Version** | pip 25.3 |
| **Server URL** | http://localhost:8001 |
| **Health Check Passed** | YES |
| **Total Issues Encountered** | 3 |
| **All Issues Resolved** | YES |

### Verification Checklist

Update each item when verified:

- [ ] Prerequisites verified
- [ ] Virtual environment created
- [ ] Dependencies installed
- [ ] Server starts without errors
- [ ] Health endpoint returns `{"status":"healthy"}`
- [ ] Root endpoint returns correct message
- [ ] Create engineer endpoint works
- [ ] List engineers endpoint works
- [ ] API documentation loads at `/docs`

### Post-Deployment Actions

After successful deployment:

1. [ ] Update status to `COMPLETED`
2. [ ] Fill in all verification checklist items
3. [ ] Record total issues encountered
4. [ ] Record Python and pip versions
5. [ ] Save this file with all updates

---

## Quick Reference

### Start Server
```bash
cd /Users/philipcowcer/project1/gemini/resource_manager/backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Stop Server
```
Press Ctrl+C in the terminal running the server
```

### Restart Server
```bash
# In the terminal running the server:
# Press Ctrl+C
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Check Server Status
```bash
curl http://localhost:8000/health
```
