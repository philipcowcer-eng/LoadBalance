# Network Engineering Resource Manager

An intelligent resource planning and capacity management tool designed for Network Engineering leadership. It enables managers to balance team workload ("Tetris"), enforce "Deep Work" culture, and justify budget requests with data.

![Dashboard Preview](/Users/philipcowcer/.gemini/antigravity/brain/766b9b7a-4ff5-4be5-9baf-e2d7eafe38fe/uploaded_image_1768359289880.png)

## 🚀 Key Features

*   **Intelligent Staff Planning**: "Tetris-style" drag-and-drop allocation board.
*   **Deep Work Guardian**: Visual warnings for meeting overload on protected focus days (Tue/Thu).
*   **Fiscal Reporting**: Real-time tracking of planned vs. completed device counts against fiscal goals.
*   **Engineer Dashboard**: "My Week" view for engineers to see assignments and flag workloads (Raise Hand).
*   **Project Registry**: Centralized intake and lifecycle management for all engineering projects.

## 🛠 Tech Stack

*   **Frontend**: React (Vite), functional components, custom CSS grid layout.
*   **Backend**: Python (FastAPI), SQLAlchemy (SQLite), Pydantic.
*   **Deployment**: Docker, Nginx, Cloudflare Tunnel.

## 🏁 Getting Started

### Prerequisites
*   Docker & Docker Compose
*   (Or) Node.js 18+ and Python 3.10+ for local dev.

### Quick Start (Docker)
The easiest way to run the application is via Docker Compose:

```bash
git clone <repo-url>
cd resource_manager
docker compose up -d --build
```

Access the application at: `http://localhost:80`

### Local Development
1.  **Backend**:
    ```bash
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
    ```

2.  **Frontend**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

## 🔒 Security & Deployment
Please refer to [proxmox_deployment_plan.md](proxmox_deployment_plan.md) for detailed production deployment instructions, including Proxmox VM setup and secure internet exposure via Cloudflare Tunnel.
