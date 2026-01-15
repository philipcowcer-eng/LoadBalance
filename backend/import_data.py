"""
Import module for goodenough.to | Planning
US-0.4: Bulk CSV Import

This module provides CSV import endpoints for:
- Engineers
- Projects

Admin only.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
import csv
import io

import models
from database import get_db

# =============================================================================
# Schemas
# =============================================================================

class ImportResult(BaseModel):
    imported: int
    skipped: int
    errors: List[str]


# =============================================================================
# Import Router
# =============================================================================

import_router = APIRouter(prefix="/api/import", tags=["Import"])


@import_router.post("/engineers", response_model=ImportResult)
async def import_engineers(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Import engineers from CSV.
    Expected columns: name, role, total_capacity, ktlo_tax
    
    Duplicates (by name) are skipped.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    content = await file.read()
    text = content.decode('utf-8')
    
    reader = csv.DictReader(io.StringIO(text))
    
    imported = 0
    skipped = 0
    errors = []
    
    valid_roles = ["Network Engineer", "Wireless Engineer", "Project Manager", "Architect"]
    
    for i, row in enumerate(reader, start=2):  # Row 2 = first data row (after header)
        try:
            name = row.get('name', '').strip()
            if not name:
                errors.append(f"Row {i}: Missing name (skipped)")
                skipped += 1
                continue
            
            # Check for duplicate
            existing = db.query(models.Engineer).filter(models.Engineer.name == name).first()
            if existing:
                errors.append(f"Row {i}: '{name}' already exists (skipped)")
                skipped += 1
                continue
            
            # Parse role
            role_str = row.get('role', 'Network Engineer').strip()
            if role_str not in valid_roles:
                role_str = "Network Engineer"  # Default
            
            # Parse capacity
            try:
                total_capacity = int(row.get('total_capacity', 40))
            except ValueError:
                total_capacity = 40
            
            # Parse KTLO tax
            try:
                ktlo_tax = int(row.get('ktlo_tax', 0))
            except ValueError:
                ktlo_tax = 0
            
            # Create engineer
            engineer = models.Engineer(
                name=name,
                role=models.RoleEnum(role_str),
                total_capacity=total_capacity,
                ktlo_tax=ktlo_tax
            )
            db.add(engineer)
            imported += 1
            
        except Exception as e:
            errors.append(f"Row {i}: {str(e)}")
            skipped += 1
    
    db.commit()
    
    return ImportResult(imported=imported, skipped=skipped, errors=errors[:20])  # Limit errors


@import_router.post("/projects", response_model=ImportResult)
async def import_projects(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Import projects from CSV.
    Expected columns: name, priority, start_date, target_end_date, workflow_status, business_justification
    
    Duplicates (by name) are skipped.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    content = await file.read()
    text = content.decode('utf-8')
    
    reader = csv.DictReader(io.StringIO(text))
    
    imported = 0
    skipped = 0
    errors = []
    
    valid_priorities = ["P1-Critical", "P2-Strategic", "P3-Standard", "P4-Low"]
    valid_statuses = ["Draft", "Pending Approval", "Approved", "Active", "On Hold", "Complete", "Cancelled"]
    
    for i, row in enumerate(reader, start=2):
        try:
            name = row.get('name', '').strip()
            if not name:
                errors.append(f"Row {i}: Missing name (skipped)")
                skipped += 1
                continue
            
            # Check for duplicate
            existing = db.query(models.Project).filter(models.Project.name == name).first()
            if existing:
                errors.append(f"Row {i}: '{name}' already exists (skipped)")
                skipped += 1
                continue
            
            # Parse priority
            priority_str = row.get('priority', 'P2-Strategic').strip()
            if priority_str not in valid_priorities:
                priority_str = "P2-Strategic"
            
            # Parse workflow status
            status_str = row.get('workflow_status', 'Draft').strip()
            if status_str not in valid_statuses:
                status_str = "Draft"
            
            # Parse dates
            from datetime import datetime
            start_date = None
            target_end_date = None
            
            start_str = row.get('start_date', '').strip()
            if start_str:
                try:
                    start_date = datetime.fromisoformat(start_str).date()
                except ValueError:
                    pass
            
            end_str = row.get('target_end_date', '').strip()
            if end_str:
                try:
                    target_end_date = datetime.fromisoformat(end_str).date()
                except ValueError:
                    pass
            
            # Create project
            project = models.Project(
                name=name,
                priority=models.PriorityEnum(priority_str),
                workflow_status=models.WorkflowStatusEnum(status_str),
                start_date=start_date,
                target_end_date=target_end_date,
                business_justification=row.get('business_justification', '')[:500]
            )
            db.add(project)
            imported += 1
            
        except Exception as e:
            errors.append(f"Row {i}: {str(e)}")
            skipped += 1
    
    db.commit()
    
    return ImportResult(imported=imported, skipped=skipped, errors=errors[:20])
