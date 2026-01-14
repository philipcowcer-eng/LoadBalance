# Network Resource Manager - Rust Backend Deployment Guide

This document provides **step-by-step deployment instructions** for the Rust (Axum) backend of the Network Engineering Resource Manager.

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
| Rust | 1.70.0 | `rustc --version` | See Step 3.1 |
| Cargo | 1.70.0 | `cargo --version` | (included with Rust) |
| SQLite | 3.0 | `sqlite3 --version` | `brew install sqlite` |

### 1.2 Prerequisite Verification Script

Run each command and verify the output:

```bash
# Step 1: Check if Rust is installed
rustc --version
# EXPECTED: rustc 1.70.0 or higher
# IF COMMAND NOT FOUND: Rust needs to be installed (see Step 3.1)

# Step 2: Check Cargo version
cargo --version
# EXPECTED: cargo 1.70.0 or higher
# IF COMMAND NOT FOUND: Rust needs to be installed (see Step 3.1)

# Step 3: Check SQLite version
sqlite3 --version
# EXPECTED: 3.x.x or higher
# IF FAILS: Install SQLite with `brew install sqlite`
```

**IF ANY CHECK FAILS**: 
1. Log the failure in the Deployment Log section
2. Install the missing tool (Rust installation is covered in Step 3.1)
3. Re-run the verification
4. Log the remediation in the Deployment Log section

---

## 2. Project Structure

```
resource_manager_rust/
├── src/
│   ├── main.rs              # Axum server entry point
│   ├── models.rs            # Strongly-typed data models
│   ├── db.rs                # SQLx database layer
│   └── routes.rs            # API endpoint handlers
├── frontend/                # React frontend (shared)
├── Cargo.toml               # Rust dependencies
├── Cargo.lock               # Locked dependency versions
├── target/                  # Build artifacts (created during build)
├── resource_manager.db      # SQLite database (created on first run)
└── DEPLOYMENT.md            # This file
```

### File Descriptions

| File | Purpose | Critical |
|------|---------|----------|
| `src/main.rs` | Server setup and route registration | YES |
| `src/models.rs` | Engineer, Project, Allocation types | YES |
| `src/db.rs` | Database connection and migrations | YES |
| `src/routes.rs` | HTTP handlers | YES |
| `Cargo.toml` | Dependencies and metadata | YES |

---

## 3. Deployment Steps

### Step 3.1: Install Rust (If Not Already Installed)

**First, check if Rust is installed**:
```bash
rustc --version
```

**IF COMMAND NOT FOUND, install Rust**:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
```

**Wait for installation to complete**, then load Rust into current shell:
```bash
source $HOME/.cargo/env
```

**Verification**:
```bash
rustc --version
# EXPECTED: rustc 1.70.0 or higher

cargo --version
# EXPECTED: cargo 1.70.0 or higher
```

**IF INSTALLATION FAILS**: Log error in Deployment Log. Common causes:
- Network issues: Check internet connection
- Permission denied: Run installation in user home directory
- Disk space: Ensure at least 2GB free space

---

### Step 3.2: Navigate to Rust Backend Directory

```bash
cd /Users/philipcowcer/project1/gemini/resource_manager/resource_manager_rust
```

**Verification**:
```bash
pwd
# EXPECTED: /Users/philipcowcer/project1/gemini/resource_manager/resource_manager_rust

ls -la src/
# EXPECTED: Should show main.rs, models.rs, db.rs, routes.rs
```

**IF FAILS**: Log error and verify path exists.

---

### Step 3.3: Load Rust Environment

```bash
source $HOME/.cargo/env
```

**Verification**:
```bash
which cargo
# EXPECTED: Should show path like /Users/username/.cargo/bin/cargo
```

**IF FAILS**: Rust may not be installed correctly. Return to Step 3.1.

---

### Step 3.4: Build the Project (Debug Mode First)

```bash
cargo build
```

**This step may take 2-5 minutes on first run** as it downloads and compiles dependencies.

**EXPECTED OUTPUT** (last few lines):
```
   Compiling resource_manager v0.1.0 (/path/to/resource_manager_rust)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in X.XXs
```

**IF BUILD FAILS**:
1. Log the exact error message in Deployment Log
2. Check common issues:
   - Missing dependencies: `cargo clean && cargo build`
   - SQLite not found: `brew install sqlite`
   - Syntax errors: Check the error file/line number

---

### Step 3.5: Build Release Version

```bash
cargo build --release
```

**EXPECTED OUTPUT** (last line):
```
    Finished `release` profile [optimized] target(s) in X.XXs
```

---

### Step 3.6: Start the Server

```bash
cargo run --release
```

**EXPECTED OUTPUT**:
```
🚀 Network Resource Manager API (Rust) listening on 127.0.0.1:8000
```

**The server is now running. Keep this terminal open.**

**IF FAILS**:
- Port in use: See Troubleshooting 6.2
- Database error: See Troubleshooting 6.3
- Other errors: Log in Deployment Log

---

## 4. API Endpoints

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/` | Root endpoint | - |
| GET | `/health` | Health check | - |
| GET | `/engineers` | List all engineers | - |
| POST | `/engineers` | Create engineer | See below |
| GET | `/engineers/:id` | Get engineer by ID | - |
| GET | `/projects` | List all projects | - |
| POST | `/projects` | Create project | See below |
| GET | `/projects/:id` | Get project by ID | - |

### Create Engineer Request Body

```json
{
  "name": "string",
  "role": "Network Engineer | Wireless Engineer | Project Manager | Architect",
  "total_capacity": 40,
  "ktlo_tax": 0
}
```

### Create Project Request Body

```json
{
  "name": "string",
  "priority": "P1-Critical | P2-Strategic | P3-Standard | P4-Low",
  "status": "Healthy | At Risk | Deprioritized"
}
```

### Valid Enum Values

**Role**:
- `"Network Engineer"`
- `"Wireless Engineer"`
- `"Project Manager"`
- `"Architect"`

**Priority**:
- `"P1-Critical"`
- `"P2-Strategic"`
- `"P3-Standard"`
- `"P4-Low"`

**Status**:
- `"Healthy"`
- `"At Risk"`
- `"Deprioritized"`

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
{"message":"Network Resource Manager API (Rust) is running"}
```

---

### 5.3 Create Test Engineer

```bash
curl -X POST http://localhost:8000/engineers \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Engineer", "role": "Network Engineer", "total_capacity": 40, "ktlo_tax": 10}'
```

**EXPECTED RESPONSE**: JSON with `id`, `name`, `role`, `total_capacity`, `ktlo_tax` fields.

Example:
```json
{
  "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "name": "Test Engineer",
  "role": "Network Engineer",
  "total_capacity": 40,
  "ktlo_tax": 10
}
```

---

### 5.4 List Engineers

```bash
curl http://localhost:8000/engineers
```

**EXPECTED RESPONSE**: JSON array containing the test engineer created above.

---

### 5.5 Create Test Project

```bash
curl -X POST http://localhost:8000/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Project", "priority": "P1-Critical", "status": "Healthy"}'
```

**EXPECTED RESPONSE**: JSON with `id`, `name`, `priority`, `status` fields.

---

### 5.6 List Projects

```bash
curl http://localhost:8000/projects
```

**EXPECTED RESPONSE**: JSON array containing the test project created above.

---

## 6. Troubleshooting

### 6.1 Error: `cargo: command not found`

**Cause**: Rust environment not loaded in current shell.

**Solution**:
```bash
source $HOME/.cargo/env
```

If still fails, Rust may not be installed. Return to Step 3.1.

---

### 6.2 Error: `Address already in use`

**Cause**: Another process is using port 8000.

**Solution**:
```bash
# Find process using port 8000
lsof -i :8000

# Kill the process (replace PID with actual number from lsof output)
kill -9 <PID>

# Restart the server
cargo run --release
```

---

### 6.3 Error: `no such table: engineers`

**Cause**: Database not initialized or corrupted.

**Solution**:
```bash
# Delete existing database
rm -f resource_manager.db

# Restart server (tables auto-create on startup)
cargo run --release
```

---

### 6.4 Error: Build fails with `error[E0xxx]`

**Cause**: Compilation error in Rust code.

**Solution**:
1. Log the exact error message in Deployment Log
2. Clean and rebuild:
```bash
cargo clean
cargo build --release
```

If still fails, check the error file and line number for syntax issues.

---

### 6.5 Error: `could not find `sqlx``

**Cause**: Dependencies not downloaded.

**Solution**:
```bash
cargo clean
cargo build --release
```

---

### 6.6 Error: SQLite-related compilation errors

**Cause**: SQLite development libraries missing.

**Solution (macOS)**:
```bash
brew install sqlite
cargo clean
cargo build --release
```

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
| _Example_ | 3.4 | Build failed | `error: could not compile` | Ran `cargo clean && cargo build` | SUCCESS |
| 2026-01-10 22:15:00 | 3.6 | "unable to open database file" | SQLite error 14 | Manually created empty .db file with `touch` | SUCCESS |
| 2026-01-10 22:25:00 | 5.3 | Uuid decoding failure | `invalid length: expected 16 bytes, found 36` | Changed schema to BLOB and bound raw Uuid in code | SUCCESS |

### Notes

_Add any additional notes, observations, or warnings for future deployments here._

---

## 8. Deployment Status

> **LLM INSTRUCTIONS**: Update this section when deployment is complete.

### Current Status

| Field | Value |
|-------|-------|
| **Status** | `COMPLETED` |
| **Deployment Date** | 2026-01-10 22:07:36 |
| **Deployed By** | LLM Agent / Human |
| **Rust Version** | rustc 1.92.0 (ded5c06cf 2025-12-08) |
| **Cargo Version** | cargo 1.92.0 (344c4567c 2025-10-21) |
| **Server URL** | http://localhost:8000 |
| **Health Check Passed** | YES |
| **Total Issues Encountered** | 2 |
| **All Issues Resolved** | YES |

### Verification Checklist

Update each item when verified:

- [x] Prerequisites verified (Rust, Cargo, SQLite)
- [x] Rust environment loaded
- [x] Project builds successfully (debug)
- [x] Project builds successfully (release)
- [x] Server starts without errors
- [x] Health endpoint returns `{"status":"healthy"}`
- [x] Root endpoint returns correct message
- [x] Create engineer endpoint works
- [x] List engineers endpoint works
- [x] Create project endpoint works
- [x] List projects endpoint works

### Post-Deployment Actions

After successful deployment:

1. [ ] Update status to `COMPLETED`
2. [ ] Fill in all verification checklist items
3. [ ] Record total issues encountered
4. [ ] Record Rust and Cargo versions
5. [ ] Save this file with all updates

---

## Quick Reference

### Start Server
```bash
cd /Users/philipcowcer/project1/gemini/resource_manager/resource_manager_rust
source $HOME/.cargo/env
cargo run --release
```

### Stop Server
```
Press Ctrl+C in the terminal running the server
```

### Rebuild and Restart
```bash
cargo clean
cargo build --release
cargo run --release
```

### Check Server Status
```bash
curl http://localhost:8000/health
```

### Reset Database
```bash
rm -f resource_manager.db
cargo run --release
```
