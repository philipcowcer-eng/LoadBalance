# Network Resource Manager - Rust Implementation

A high-performance Rust implementation of the Network Engineering Resource Manager, built with **Axum** and **SQLx**.

---

## Quick Start

```bash
# 1. Navigate to this directory
cd /Users/philipcowcer/project1/gemini/resource_manager/resource_manager_rust

# 2. Load Rust environment
source $HOME/.cargo/env

# 3. Build the project
cargo build --release

# 4. Run the server
cargo run --release

# Server will start at http://localhost:8000
```

---

## Prerequisites

| Tool | Minimum Version | Check Command |
|------|-----------------|---------------|
| Rust | 1.70.0 | `rustc --version` |
| Cargo | 1.70.0 | `cargo --version` |
| SQLite | 3.0 | `sqlite3 --version` |

### Install Rust (if not installed)

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source $HOME/.cargo/env
```

---

## API Endpoints

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/` | Root endpoint | - |
| GET | `/health` | Health check | - |
| GET | `/engineers` | List all engineers | - |
| POST | `/engineers` | Create engineer | `{"name": "string", "role": "string", "total_capacity": int, "ktlo_tax": int}` |
| GET | `/engineers/:id` | Get engineer by ID | - |
| GET | `/projects` | List all projects | - |
| POST | `/projects` | Create project | `{"name": "string", "priority": "string", "status": "string"}` |
| GET | `/projects/:id` | Get project by ID | - |

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

## Example API Calls

### Create an Engineer

```bash
curl -X POST http://localhost:8000/engineers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Chen",
    "role": "Network Engineer",
    "total_capacity": 40,
    "ktlo_tax": 10
  }'
```

### List Engineers

```bash
curl http://localhost:8000/engineers
```

### Create a Project

```bash
curl -X POST http://localhost:8000/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Data Center Migration",
    "priority": "P1-Critical",
    "status": "Healthy"
  }'
```

### Health Check

```bash
curl http://localhost:8000/health
# Response: {"status":"healthy"}
```

---

## Project Structure

```
resource_manager_rust/
├── src/
│   ├── main.rs          # Axum server entry point, route registration
│   ├── models.rs        # Strongly-typed data models with enums
│   ├── db.rs            # SQLx database pool and migrations
│   └── routes.rs        # API endpoint handlers
├── frontend/            # React frontend (shared with Python)
├── Cargo.toml           # Rust dependencies
├── Cargo.lock           # Locked dependency versions
├── DEPLOYMENT.md        # Full deployment guide
└── README.md            # This file
```

---

## Architecture

| Component | Technology | Description |
|-----------|------------|-------------|
| Web Framework | Axum 0.7 | Modern async web framework |
| Async Runtime | Tokio | High-performance async runtime |
| Database | SQLx + SQLite | Compile-time checked SQL |
| Serialization | Serde | JSON serialization/deserialization |
| CORS | tower-http | Cross-origin request handling |

---

## Development Commands

### Build

```bash
# Debug build (faster compile, slower runtime)
cargo build

# Release build (slower compile, optimized runtime)
cargo build --release
```

### Run

```bash
# Development (with debug info)
cargo run

# Production (optimized)
cargo run --release
```

### Test

```bash
cargo test
```

### Lint

```bash
cargo clippy
```

### Format

```bash
cargo fmt
```

### Clean

```bash
cargo clean
```

---

## Frontend Integration

The frontend is shared with the Python implementation and is located at `./frontend`.

### Start Frontend

```bash
cd frontend
npm install
npm run dev
# Frontend runs at http://localhost:5173
```

### Configuration

Both Python and Rust backends use port 8000. The frontend is pre-configured to connect to `http://localhost:8000`.

**IMPORTANT**: Only run ONE backend at a time (Python OR Rust, not both).

---

## Database

The Rust backend uses SQLite stored in `resource_manager.db` (created automatically on first run).

### Reset Database

```bash
rm resource_manager.db
cargo run --release
# Tables are recreated automatically
```

### Tables Created

- `engineers` - Team member roster
- `projects` - Project registry
- `allocations` - Work assignments
- `impact_logs` - Displacement tracking

---

## Comparison with Python Implementation

| Feature | Python (FastAPI) | Rust (Axum) |
|---------|------------------|-------------|
| Type Safety | Runtime (Pydantic) | Compile-time |
| Performance | ~1,000 req/s | ~10,000+ req/s |
| Memory Usage | ~50 MB | ~5 MB |
| Startup Time | ~1s | ~0.1s |
| Development Speed | Fast | Moderate |
| Error Detection | Runtime | Compile-time |

---

## Troubleshooting

### Error: `cargo: command not found`

```bash
source $HOME/.cargo/env
```

### Error: `Address already in use`

```bash
lsof -i :8000
kill -9 <PID>
```

### Error: `no such table`

```bash
rm resource_manager.db
cargo run --release
```

### Error: Build fails

```bash
cargo clean
cargo build --release
```

---

## Full Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete step-by-step deployment instructions for both Python and Rust implementations.
