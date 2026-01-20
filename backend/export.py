"""
Export module for goodenough.to | Planning
US-0.2: CSV Export

This module provides CSV export endpoints for:
- Engineers
- Projects
- Allocations
"""

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import date
import csv
import io

import models
from database import get_db
from utils import record_audit

# =============================================================================
# Export Router
# =============================================================================

export_router = APIRouter(prefix="/api/export", tags=["Export"])


@export_router.get("/engineers")
def export_engineers(db: Session = Depends(get_db)):
    """
    Export all engineers to CSV.
    Columns: id, name, role, total_capacity, ktlo_tax, created_at
    """
    engineers = db.query(models.Engineer).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header row (AC-4.2.3)
    writer.writerow(["id", "name", "role", "total_capacity", "ktlo_tax", "created_at"])
    
    # Data rows
    for e in engineers:
        writer.writerow([
            e.id,
            e.name,
            e.role.value if e.role else "",
            e.total_capacity,
            e.ktlo_tax,
            getattr(e, 'created_at', None).isoformat() if getattr(e, 'created_at', None) else ""
        ])
    
    output.seek(0)
    filename = f"engineers_{date.today().isoformat()}.csv"
    
    record_audit(db, "EXPORT", "Engineer", details={"format": "CSV", "count": len(engineers)})
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@export_router.get("/projects")
def export_projects(db: Session = Depends(get_db)):
    """
    Export all projects to CSV.
    Columns per AC-4.2.6: id, name, priority, workflow_status, rag_status, 
                          fiscal_year, start_date, target_end_date, pm_name, percent_complete
    """
    projects = db.query(models.Project).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header row (AC-4.2.6)
    writer.writerow([
        "id", "name", "priority", "workflow_status", "rag_status",
        "fiscal_year", "start_date", "target_end_date", "pm_name", "percent_complete"
    ])
    
    # Data rows
    for p in projects:
        writer.writerow([
            p.id,
            p.name,
            p.priority.value if p.priority else "",
            p.workflow_status.value if p.workflow_status else "",
            p.status.value if p.status else "",  # rag_status
            getattr(p, 'fiscal_year', '') or "",
            p.start_date.isoformat() if p.start_date else "",
            p.target_end_date.isoformat() if p.target_end_date else "",
            getattr(p, 'pm_name', '') or "",
            getattr(p, 'percent_complete', '') or ""
        ])
    
    output.seek(0)
    filename = f"projects_{date.today().isoformat()}.csv"
    
    record_audit(db, "EXPORT", "Project", details={"format": "CSV", "count": len(projects)})
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@export_router.get("/allocations")
def export_allocations(db: Session = Depends(get_db)):
    """
    Export all allocations to CSV.
    Columns: id, engineer_name, project_name, week_start, hours, category
    """
    allocations = db.query(models.Allocation).all()
    
    # Build lookup dictionaries for names
    engineers = {e.id: e.name for e in db.query(models.Engineer).all()}
    projects = {p.id: p.name for p in db.query(models.Project).all()}
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header row
    writer.writerow([
        "id", "engineer_id", "engineer_name", "project_id", "project_name",
        "week_start", "hours", "category"
    ])
    
    # Data rows
    for a in allocations:
        writer.writerow([
            a.id,
            a.engineer_id,
            engineers.get(a.engineer_id, "Unknown"),
            a.project_id,
            projects.get(a.project_id, "Unknown"),
            a.week_start.isoformat() if a.week_start else "",
            a.hours,
            a.category.value if a.category else ""
        ])
    
    output.seek(0)
    filename = f"allocations_{date.today().isoformat()}.csv"
    
    record_audit(db, "EXPORT", "Allocation", details={"format": "CSV", "count": len(allocations)})
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
