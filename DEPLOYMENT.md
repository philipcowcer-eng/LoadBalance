# Network Resource Manager - Master Deployment Guide

This is the **master deployment guide** for the Network Engineering Resource Manager. It provides an overview of both backend implementations and directs you to the appropriate deployment documentation.

> **IMPORTANT FOR LLM AGENTS**: 
> 1. Choose ONE backend to deploy (Python OR Rust, not both)
> 2. Follow the specific DEPLOYMENT.md for your chosen backend
> 3. **Log all issues in the Deployment Log section of the backend-specific file**
> 4. **Update the Deployment Status when complete**

---

## Quick Navigation

| Backend | Deployment Guide | Directory |
|---------|------------------|-----------|
| **Python (FastAPI)** | [backend/DEPLOYMENT.md](./backend/DEPLOYMENT.md) | `./backend/` |
| **Rust (Axum)** | [resource_manager_rust/DEPLOYMENT.md](./resource_manager_rust/DEPLOYMENT.md) | `./resource_manager_rust/` |
| **Frontend** | (Included in both guides) | `./frontend/` |

---

## Which Backend Should I Deploy?

| Criteria | Choose Python | Choose Rust |
|----------|---------------|-------------|
| **Deployment Speed** | Faster to deploy | Longer (compilation) |
| **Runtime Performance** | Good | Excellent (10x faster) |
| **Memory Usage** | ~50MB | ~5MB |
| **Type Safety** | Runtime (Pydantic) | Compile-time |
| **Team Familiarity** | More common | Less common |
| **API Documentation** | Auto-generated (Swagger) | Manual |

**Recommendation**: Start with Python for rapid prototyping, consider Rust for production.

---

## Project Overview

```
resource_manager/
├── backend/                      # Python (FastAPI)
│   ├── DEPLOYMENT.md             # ⬅️ Python deployment guide
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   └── database.py
│
├── frontend/                     # React (Vite) - SHARED
│   ├── src/
│   ├── package.json
│   └── vite.config.js
│
├── resource_manager_rust/        # Rust (Axum)
│   ├── DEPLOYMENT.md             # ⬅️ Rust deployment guide
│   ├── src/
│   │   ├── main.rs
│   │   ├── models.rs
│   │   ├── db.rs
│   │   └── routes.rs
│   └── Cargo.toml
│
├── technical_spec.md             # Technical specification
├── user_stories.md               # User requirements
├── test_cases.md                 # Test documentation
└── DEPLOYMENT.md                 # This file (master guide)
```

---

## Prerequisites Summary

### For Python Backend

| Tool | Minimum Version | Install Command |
|------|-----------------|-----------------|
| Python | 3.10 | `brew install python@3.10` |
| pip | 22.0 | (included with Python) |
| SQLite | 3.0 | `brew install sqlite` |

### For Rust Backend

| Tool | Minimum Version | Install Command |
|------|-----------------|-----------------|
| Rust | 1.70.0 | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| Cargo | 1.70.0 | (included with Rust) |
| SQLite | 3.0 | `brew install sqlite` |

### For Frontend (Both Backends)

| Tool | Minimum Version | Install Command |
|------|-----------------|-----------------|
| Node.js | 18.0 | `brew install node` |
| npm | 9.0 | (included with Node.js) |

---

## Deployment Instructions

### Option A: Deploy Python Backend

1. Open file: `./backend/DEPLOYMENT.md`
2. Follow all steps in order
3. Log any issues in the Deployment Log section
4. Update Deployment Status when complete

**Quick Start**:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

### Option B: Deploy Rust Backend

1. Open file: `./resource_manager_rust/DEPLOYMENT.md`
2. Follow all steps in order
3. Log any issues in the Deployment Log section
4. Update Deployment Status when complete

**Quick Start**:
```bash
cd resource_manager_rust
source $HOME/.cargo/env
cargo build --release
cargo run --release
```

---

### Deploy Frontend (Required for Both)

After deploying your chosen backend:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

---

## API Comparison

Both backends provide the same API endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Root endpoint |
| GET | `/health` | Health check |
| GET | `/engineers` | List all engineers |
| POST | `/engineers` | Create a new engineer |
| GET | `/engineers/:id` | Get engineer by ID |
| GET | `/projects` | List all projects |
| POST | `/projects` | Create a new project |
| GET | `/projects/:id` | Get project by ID |

---

## Verification Commands

These work for both backends:

```bash
# Health check
curl http://localhost:8000/health
# Expected: {"status":"healthy"}

# Create engineer
curl -X POST http://localhost:8000/engineers \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "role": "Network Engineer", "total_capacity": 40, "ktlo_tax": 0}'

# List engineers
curl http://localhost:8000/engineers
```

---

## LLM Agent Instructions

### Before Starting

1. Read this entire document
2. Decide which backend to deploy (Python or Rust)
3. Navigate to the appropriate DEPLOYMENT.md file
4. Have a second terminal ready for verification commands

### During Deployment

1. Execute each step in order
2. Verify each step before proceeding
3. Log ALL issues in the Deployment Log section
4. Log ALL remediations applied
5. Do not skip troubleshooting steps

### After Deployment

1. Complete ALL verification steps
2. Update the Deployment Status section
3. Mark all checklist items as complete
4. Record tool versions (Python/Rust version)
5. Save the DEPLOYMENT.md file with all updates

### Issue Logging Format

When logging issues, use this format:

| Field | Description | Example |
|-------|-------------|---------|
| Timestamp | When issue occurred | 2026-01-10 22:00:00 |
| Step | Step number where issue occurred | 3.4 |
| Issue Description | Brief description | Build failed |
| Error Message | Exact error text | `error: could not compile` |
| Remediation | What you did to fix it | Ran `cargo clean && cargo build` |
| Outcome | SUCCESS or FAILED | SUCCESS |

---

## Support Files

| File | Purpose |
|------|---------|
| [technical_spec.md](./technical_spec.md) | Technical specification and architecture |
| [user_stories.md](./user_stories.md) | User requirements and acceptance criteria |
| [test_cases.md](./test_cases.md) | Test documentation |

---

## Troubleshooting Quick Reference

### Port 8000 in Use

```bash
lsof -i :8000
kill -9 <PID>
```

### Database Issues

```bash
# Python
rm -f backend/resource_manager.db

# Rust
rm -f resource_manager_rust/resource_manager.db
```

### Frontend Not Loading

1. Ensure backend is running on port 8000
2. Ensure frontend is running on port 5173
3. Check browser console for CORS errors

---

## Deployment Checklist (Summary)

- [ ] Prerequisites installed
- [ ] Backend deployed (Python OR Rust)
- [ ] Server starts without errors
- [ ] Health endpoint responds
- [ ] CRUD operations work
- [ ] Frontend deployed
- [ ] Frontend connects to backend
- [ ] Deployment Log updated
- [ ] Deployment Status updated
