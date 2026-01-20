from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from typing import List, Dict, Any

router = APIRouter()

@router.get("/utilization/report")
def get_utilization_report(db: Session = Depends(get_db)):
    """
    Returns a system-wide utilization report (US-Gap-2).
    Calculates Overloaded engineers and Unassigned project hours.
    """
    
    # 1. Engineer Utilization
    engineers = db.query(models.Engineer).all()
    overloaded_engineers = []
    at_risk_engineers = []
    
    for eng in engineers:
        effective_capacity = eng.total_capacity - eng.ktlo_tax
        # Sum allocated hours (recurring weekly)
        allocated_hours = sum(a.hours for a in eng.allocations)
        
        utilization_pct = (allocated_hours / effective_capacity * 100) if effective_capacity > 0 else 0
        
        eng_summary = {
            "id": eng.id,
            "name": eng.name,
            "role": eng.role,
            "allocated": allocated_hours,
            "capacity": effective_capacity,
            "utilization_pct": round(utilization_pct, 1)
        }
        
        if allocated_hours > effective_capacity:
            overloaded_engineers.append(eng_summary)
        elif utilization_pct >= 85: # 85% threshold for At Risk
            at_risk_engineers.append(eng_summary)

    # 2. Unassigned Project Hours
    # Calculate difference between Resourcing Requirements and Actual Allocations
    projects = db.query(models.Project).all()
    total_unassigned_hours = 0
    
    for proj in projects:
        # Sum requirements (hours/week)
        req_hours = sum(r.hours_per_week for r in proj.resourcing_requirements)
        
        # Sum allocations (hours/week) - only Project Work matters for requirements filling? 
        # Usually requirements are role-based. Allocations fill them.
        # We count all allocations to this project towards the requirement.
        alloc_hours = sum(a.hours for a in proj.allocations)
        
        gap = max(0, req_hours - alloc_hours)
        total_unassigned_hours += gap

    return {
        "overloaded_engineers": overloaded_engineers,
        "at_risk_engineers": at_risk_engineers,
        "team_overload_count": len(overloaded_engineers),
        "team_at_risk_count": len(at_risk_engineers),
        "total_unassigned_hours": total_unassigned_hours
    }
