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

# =============================================================================
# Export Router
# =============================================================================

export_router = APIRouter(prefix="/api/export", tags=["Export"])


@export_router.get("/engineers")
def export_engineers(db: Session = Depends(get_db)):
    """
    Export all engineers to CSV.
    Columns: id, name, role, total_capacity, ktlo_tax
    """
    engineers = db.query(models.Engineer).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header row
    writer.writerow(["id", "name", "role", "total_capacity", "ktlo_tax"])
    
    # Data rows
    for e in engineers:
        writer.writerow([
            e.id,
            e.name,
            e.role.value if e.role else "",
            e.total_capacity,
            e.ktlo_tax
        ])
    
    output.seek(0)
    filename = f"engineers_{date.today().isoformat()}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@export_router.get("/projects")
def export_projects(db: Session = Depends(get_db)):
    """
    Export all projects to CSV.
    Columns: id, name, project_number, priority, workflow_status, status, 
             start_date, target_end_date, owner_name
    """
    projects = db.query(models.Project).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header row
    writer.writerow([
        "id", "name", "project_number", "priority", "workflow_status", 
        "status", "start_date", "target_end_date", "business_justification"
    ])
    
    # Data rows
    for p in projects:
        writer.writerow([
            p.id,
            p.name,
            p.project_number or "",
            p.priority.value if p.priority else "",
            p.workflow_status.value if p.workflow_status else "",
            p.status.value if p.status else "",
            p.start_date.isoformat() if p.start_date else "",
            p.target_end_date.isoformat() if p.target_end_date else "",
            (p.business_justification or "").replace("\n", " ")[:200]  # Truncate for CSV
        ])
    
    output.seek(0)
    filename = f"projects_{date.today().isoformat()}.csv"
    
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
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
