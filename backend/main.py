from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from datetime import datetime
from uuid import UUID
import shutil
from pydantic import BaseModel
import uuid
import enum
import os
import models, schemas, database
from database import engine, get_db
from auth import auth_router, User, get_current_user, require_permission
from permissions import (
    PERM_ADD_ENGINEER, PERM_ALLOCATE_RESOURCES, PERM_EDIT_PROJECT_REGISTRY,
    PERM_CREATE_PROJECT, PERM_EDIT_PROJECT_STATUS
)
from export import export_router
from import_data import import_router
from audit_log import audit_router
from utils import record_audit
from snapshots import snapshot_router
import scenarios
import json
from datetime import datetime, date

def check_policy_violations(allocation: models.Allocation, db: Session) -> List[str]:
    """
    Check if an allocation violates any global policies (US-1.2).
    """
    warnings = []
    
    # 1. Fetch Deep Work Policy
    policy = db.query(models.GlobalPolicy).filter(models.GlobalPolicy.policy_type == "DEEP_WORK_DAYS").first()
    if policy and allocation.category in [models.CategoryEnum.MEETINGS, models.CategoryEnum.OPERATIONAL_SUPPORT]:
        deep_work_days = json.loads(policy.value) # e.g. ["Tue", "Thu"]
        if allocation.day.value in deep_work_days:
            warnings.append(f"Deep Work Violation: {allocation.category.value} scheduled on {allocation.day.value}.")
            
    return warnings

# Create the database tables (including User table from auth)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="goodenough.to | Planning API", version="0.3.0")

# Include authentication router
app.include_router(auth_router)
# Include export router
app.include_router(export_router)
# Include import router
app.include_router(import_router)
# Include audit router
app.include_router(audit_router)
# Include snapshot router
app.include_router(snapshot_router)
# Include scenarios router (US-1.1)
# Include scenarios router (US-1.1)
app.include_router(scenarios.router, prefix="/api/scenarios", tags=["scenarios"])

# Include project members router (US-2.5)
from api import project_members, project_notes, utilization, integrations
app.include_router(project_members.router, prefix="/api", tags=["project-members"])
app.include_router(project_notes.router, prefix="/api", tags=["project-notes"])
app.include_router(utilization.router, prefix="/api", tags=["utilization"])
app.include_router(integrations.router)


# CORS Configuration - reads from environment variable or uses defaults
# Set ALLOWED_ORIGINS env var as comma-separated list: "http://localhost:5173,https://myapp.com"
default_origins = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://0.0.0.0:5173,http://localhost:3000"
allowed_origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", default_origins).split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files for the frontend
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_root():
    return {"message": "Network Resource Manager API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/api/debug/db-tables")
def debug_db_tables(db: Session = Depends(get_db)):
    """Check which tables exist in the database."""
    from sqlalchemy import inspect
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    return {"tables": tables, "users_exists": "users" in tables}

@app.on_event("startup")
def create_default_admin():
    """Create a default admin user if no users exist (bootstrap mode)."""
    from auth import hash_password
    db = database.SessionLocal()
    try:
        # Check if users table exists first
        from sqlalchemy import inspect
        inspector = inspect(engine)
        if "users" not in inspector.get_table_names():
            print("STARTUP: 'users' table does not exist yet. Skipping admin bootstrap.")
            return
        
        user_count = db.query(models.User).count()
        if user_count == 0:
            admin = models.User(
                username="admin",
                password_hash=hash_password("changeme"),
                role="admin"
            )
            db.add(admin)
            db.commit()
            print("STARTUP: Created default admin user: admin / changeme")
        else:
            print(f"STARTUP: {user_count} user(s) already exist. Skipping admin bootstrap.")
    except Exception as e:
        print(f"STARTUP: Could not create default admin: {e}")
    finally:
        db.close()

# =============================================================================
# Global Queries (for frontend aggregation)
# =============================================================================

@app.get("/api/requirements", response_model=List[schemas.ResourcingRequirement])
def get_all_requirements(db: Session = Depends(get_db)):
    """Get all resourcing requirements across all projects (for staffing calculations)"""
    return db.query(models.ResourcingRequirement).all()

# =============================================================================
# Engineer Endpoints
# =============================================================================

@app.get("/api/engineers", response_model=List[schemas.Engineer])
def get_engineers(db: Session = Depends(get_db)):
    return db.query(models.Engineer).all()

@app.post("/api/engineers", response_model=schemas.Engineer)
def create_engineer(engineer: schemas.EngineerCreate, request: Request, db: Session = Depends(get_db), current_user: models.User = Depends(require_permission(PERM_ADD_ENGINEER))):
    # Apply Role Default if tax not specified (US-2.1)
    # Manually handle skills serialization (Pydantic List -> DB Text/JSON)
    eng_data = engineer.model_dump()
    if 'skills' in eng_data and eng_data['skills'] is not None:
        eng_data['skills'] = json.dumps(eng_data['skills'])
        
    if eng_data.get('ktlo_tax') is None:
        eng_data['ktlo_tax'] = models.ROLE_DEFAULTS.get(engineer.role, 0)

    db_engineer = models.Engineer(**eng_data)
    db.add(db_engineer)
    db.commit()
    db.refresh(db_engineer)
    
    # Record Audit
    record_audit(db, "CREATE", "Engineer", db_engineer.id, engineer.model_dump(), current_user, request)
    
    return db_engineer

@app.get("/api/engineers/{engineer_id}", response_model=schemas.Engineer)
def get_engineer(engineer_id: UUID, db: Session = Depends(get_db)):
    db_engineer = db.query(models.Engineer).filter(models.Engineer.id == str(engineer_id)).first()
    if not db_engineer:
        raise HTTPException(status_code=404, detail="Engineer not found")
    return db_engineer

@app.put("/api/engineers/{engineer_id}", response_model=schemas.Engineer)
def update_engineer(engineer_id: UUID, engineer: schemas.EngineerCreate, request: Request, db: Session = Depends(get_db), current_user: models.User = Depends(require_permission(PERM_ADD_ENGINEER))):
    db_engineer = db.query(models.Engineer).filter(models.Engineer.id == str(engineer_id)).first()
    if not db_engineer:
        raise HTTPException(status_code=404, detail="Engineer not found")
    
    eng_data = engineer.model_dump()
    if 'skills' in eng_data and eng_data['skills'] is not None:
        eng_data['skills'] = json.dumps(eng_data['skills'])

    for var, value in eng_data.items():
        setattr(db_engineer, var, value)
    
    db.commit()
    db.refresh(db_engineer)
    
    # Record Audit
    record_audit(db, "UPDATE", "Engineer", str(engineer_id), engineer.model_dump(), current_user, request)
    
    return db_engineer

@app.get("/api/engineers/{engineer_id}/allocations", response_model=List[schemas.Allocation])
def get_engineer_allocations(engineer_id: UUID, db: Session = Depends(get_db)):
    """Get all allocations for a specific engineer"""
    allocations = db.query(models.Allocation).filter(models.Allocation.engineer_id == str(engineer_id)).all()
    results = []
    for alloc in allocations:
        schema_alloc = schemas.Allocation.model_validate(alloc)
        schema_alloc.policy_warnings = check_policy_violations(alloc, db)
        results.append(schema_alloc)
    return results

@app.delete("/api/engineers/{engineer_id}")
def delete_engineer(engineer_id: UUID, db: Session = Depends(get_db), current_user: models.User = Depends(require_permission(PERM_ADD_ENGINEER))):
    """Delete an engineer and release their allocations with logging (US-DASH-002)"""
    db_engineer = db.query(models.Engineer).filter(models.Engineer.id == str(engineer_id)).first()
    if not db_engineer:
        raise HTTPException(status_code=404, detail="Engineer not found")
    
    eng_name = db_engineer.name
    # Identify unique projects affected for logging
    affected_projects = {a.project_id for a in db_engineer.allocations}
    
    # Log release to project impact logs
    for pid in affected_projects:
        impact_log = models.ImpactLog(
            project_id=pid,
            event=f"Resource Released: {eng_name}",
            reason=f"Resource removed from system; all associated allocations cleared."
        )
        db.add(impact_log)
    
    db.delete(db_engineer)
    db.commit()
    return {"message": f"Engineer {eng_name} deleted and allocations released."}

# =============================================================================
# Project Endpoints
# =============================================================================

@app.get("/api/projects", response_model=List[schemas.Project])
def get_projects(db: Session = Depends(get_db)):
    db_projects = db.query(models.Project).all()
    
    # Enrich projects with staffing metrics for EPIC-002
    for p in db_projects:
        # 1. Total requirements
        reqs = p.resourcing_requirements
        total_required = sum(r.hours_per_week for r in reqs)
        
        # 2. Total allocations (only PROJECT_WORK category)
        allocs = [a for a in p.allocations if a.category == models.CategoryEnum.PROJECT_WORK]
        total_allocated = sum(a.hours for a in allocs)
        
        # 3. Role-based breakdown
        role_stats = []
        # Get unique roles from requirements
        roles_needed = {r.role for r in reqs}
        for role in roles_needed:
            role_required = sum(r.hours_per_week for r in reqs if r.role == role)
            # Find allocations for this role. Note: Engineer role is what we check.
            role_allocated = sum(a.hours for a in allocs if a.engineer and a.engineer.role == role)
            
            role_stats.append(schemas.RoleStaffingStatus(
                role=role,
                required=role_required,
                allocated=role_allocated,
                is_complete=role_allocated >= role_required
            ))
            
        p.total_hours_required = total_required
        p.total_hours_allocated = total_allocated
        p.is_fully_staffed = total_allocated >= total_required if total_required > 0 else (len(reqs) == 0 and len(allocs) > 0)
        # Re-check is_fully_staffed: if 0 reqs and 0 allocs, it's draft/placeholder, but technically not "unstaffed" in a bad way.
        # But if it has reqs, it must meet them all.
        if total_required > 0:
             p.is_fully_staffed = all(s.is_complete for s in role_stats)
        
        p.role_staffing = role_stats
        
    return db_projects

@app.post("/api/projects", response_model=schemas.Project)
def create_project(project: schemas.ProjectCreate, request: Request, db: Session = Depends(get_db), current_user: models.User = Depends(require_permission(PERM_CREATE_PROJECT))):
    # Use standard model_dump to keep Python objects (Dates, Enums)
    # SQLAlchemy handles Enums/Dates automatically for SQLite, but UUIDs need to be strings
    data = project.model_dump()
    
    # Ensure UUIDs are strings for SQLite String columns
    if data.get("owner_id"): data["owner_id"] = str(data["owner_id"])
    if data.get("manager_id"): data["manager_id"] = str(data["manager_id"])
    
    db_project = models.Project(**data)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    
    record_audit(db, "CREATE", "Project", db_project.id, data, current_user, request)
    
    return db_project

@app.put("/api/projects/bulk", response_model=Dict[str, int])
def bulk_update_projects(payload: schemas.ProjectBulkUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(require_permission(PERM_EDIT_PROJECT_REGISTRY))):
    """
    Update multiple projects at once (US-2.3 Bulk Operations).
    """
    count = 0
    for project_id in payload.ids:
        db_project = db.query(models.Project).filter(models.Project.id == str(project_id)).first()
        if db_project:
            if payload.workflow_status is not None:
                db_project.workflow_status = payload.workflow_status
                db_project.status_updated_at = datetime.now()
            if payload.priority is not None:
                db_project.priority = payload.priority
            if payload.fiscal_year is not None:
                db_project.fiscal_year = payload.fiscal_year
            if payload.rag_status is not None:
                db_project.rag_status = payload.rag_status
            count += 1
    
    db.commit()
    return {"updated_count": count}

@app.get("/api/projects/{project_id}", response_model=schemas.Project)
def get_project(project_id: UUID, db: Session = Depends(get_db)):
    db_project = db.query(models.Project).filter(models.Project.id == str(project_id)).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project

@app.put("/api/projects/{project_id}", response_model=schemas.Project)
def update_project(project_id: UUID, project: schemas.ProjectCreate, request: Request, db: Session = Depends(get_db), current_user: models.User = Depends(require_permission(PERM_EDIT_PROJECT_REGISTRY))):
    db_project = db.query(models.Project).filter(models.Project.id == str(project_id)).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    for var, value in project.model_dump().items():
        # SQLite storage: IDs must be strings
        if var in ["owner_id", "manager_id"] and value:
            value = str(value)
        setattr(db_project, var, value)
    
    db.commit()
    db.refresh(db_project)
    
    record_audit(db, "UPDATE", "Project", str(project_id), project.model_dump(), current_user, request)
    
    return db_project

# Epic 11: Partial project update (PATCH) for modal editing
@app.patch("/api/projects/{project_id}", response_model=schemas.Project)
def patch_project(project_id: UUID, project_update: schemas.ProjectUpdate, request: Request, db: Session = Depends(get_db), current_user: models.User = Depends(require_permission(PERM_EDIT_PROJECT_STATUS))):
    """
    Partial update for project fields (US-11.1 to US-11.5).
    Only updates fields that are provided in the request.
    """
    try:
        db_project = db.query(models.Project).filter(models.Project.id == str(project_id)).first()
        if not db_project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        update_data = project_update.model_dump(exclude_unset=True)
        
        # Track changes for impact log
        changes = []
        for field, new_value in update_data.items():
            # SQLite storage: IDs must be strings
            if field in ["owner_id", "manager_id"] and new_value:
                new_value = str(new_value)
            
            old_value = getattr(db_project, field)
            if old_value != new_value:
                # Handle UUID or Enum comparison/storage for logging
                old_value_str = str(old_value) if isinstance(old_value, (UUID, enum.Enum)) else old_value
                new_value_str = str(new_value) if isinstance(new_value, (UUID, enum.Enum)) else new_value
                    
                changes.append(f"{field}: {old_value_str} -> {new_value_str}")
                
                # Ensure UUIDs and Enums are stored as strings/primitives for SQLite compatibility
                if isinstance(new_value, UUID):
                    val_to_set = str(new_value)
                elif isinstance(new_value, enum.Enum):
                    val_to_set = new_value.value
                else:
                    val_to_set = new_value
                
                setattr(db_project, field, val_to_set)
        
        print(f"DEBUG: Changes detected for {project_id}: {changes}")
        
        # Check if latest_status_update was changed, if so, update timestamp
        if 'latest_status_update' in update_data:
             db_project.status_updated_at = datetime.utcnow()

        # Create impact log entry if changes were made
        if changes:
            impact_log = models.ImpactLog(
                project_id=str(project_id),
                event="Project Updated",
                reason="; ".join(changes)
            )
            db.add(impact_log)
        
        db.commit()
        db.refresh(db_project)
        
        record_audit(db, "PATCH", "Project", str(project_id), {"changes": changes}, current_user, request)
        
        return db_project
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Update failed: {str(e)}")

@app.delete("/api/projects/{project_id}")
def delete_project(
    project_id: UUID, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission(PERM_EDIT_PROJECT_REGISTRY))
):
    """Delete a project and all its associated data (cascade) (US-2.4)"""
    db_project = db.query(models.Project).filter(models.Project.id == str(project_id)).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(db_project)
    db.commit()
    
    record_audit(db, "DELETE", "Project", str(project_id), {"name": db_project.name}, current_user, request)
    
    return {"message": "Project deleted successfully"}





# =============================================================================
# RID Log Endpoints (US-11.6, US-11.7)
# =============================================================================

@app.get("/api/projects/{project_id}/rid-log", response_model=List[schemas.RidLog])
def get_rid_logs(project_id: UUID, db: Session = Depends(get_db)):
    """Get all RID log entries for a project"""
    db_project = db.query(models.Project).filter(models.Project.id == str(project_id)).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return db.query(models.ProjectRidLog)\
        .filter(models.ProjectRidLog.project_id == str(project_id))\
        .order_by(models.ProjectRidLog.created_at.desc())\
        .all()

@app.post("/api/projects/{project_id}/rid-log", response_model=schemas.RidLog)
def create_rid_log(project_id: str, rid_entry: schemas.RidLogCreate, db: Session = Depends(get_db)):
    """Add a new RID log entry (US-11.7)"""
    db_project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db_rid = models.ProjectRidLog(
        project_id=str(project_id),
        **rid_entry.model_dump()
    )
    db.add(db_rid)
    
    # Log to impact log
    impact_log = models.ImpactLog(
        project_id=str(project_id),
        event=f"RID Entry Added: {rid_entry.type.value}",
        reason=rid_entry.description[:100]
    )
    db.add(impact_log)
    
    db.commit()
    db.refresh(db_rid)
    return db_rid

@app.patch("/api/rid-log/{rid_id}", response_model=schemas.RidLog)
def update_rid_log(rid_id: UUID, rid_update: schemas.RidLogUpdate, db: Session = Depends(get_db)):
    """Update or promote a RID log entry (US-11.6)"""
    db_rid = db.query(models.ProjectRidLog).filter(models.ProjectRidLog.id == str(rid_id)).first()
    if not db_rid:
        raise HTTPException(status_code=404, detail="RID entry not found")
    
    update_data = rid_update.model_dump(exclude_unset=True)
    
    # If type is being changed, track the previous type
    if 'type' in update_data and update_data['type'] != db_rid.type:
        db_rid.previous_type = db_rid.type
        
        # Log promotion to impact log
        impact_log = models.ImpactLog(
            project_id=db_rid.project_id,
            event=f"RID Entry Promoted: {db_rid.type.value} → {update_data['type'].value}",
            reason=db_rid.description[:100]
        )
        db.add(impact_log)
    
    for field, value in update_data.items():
        setattr(db_rid, field, value)
    
    db.commit()
    db.refresh(db_rid)
    return db_rid

# =============================================================================
# Project Task Endpoints (US-2.4)
# =============================================================================

@app.get("/api/projects/{project_id}/tasks", response_model=List[schemas.TaskResponse])
def get_project_tasks(project_id: UUID, db: Session = Depends(get_db)):
    """Get all tasks for a project (US-2.4)"""
    db_project = db.query(models.Project).filter(models.Project.id == str(project_id)).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return db.query(models.ProjectTask)\
        .filter(models.ProjectTask.project_id == str(project_id))\
        .order_by(models.ProjectTask.priority.asc(), models.ProjectTask.created_at.asc())\
        .all()

@app.post("/api/projects/{project_id}/tasks", response_model=schemas.TaskResponse)
def create_project_task(
    project_id: UUID, 
    task_in: schemas.TaskCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission(PERM_EDIT_PROJECT_REGISTRY))
):
    """Create a new task for a project (US-2.4)"""
    db_project = db.query(models.Project).filter(models.Project.id == str(project_id)).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    task_data = task_in.model_dump()
    # Convert UUIDs to strings for SQLite compatibility
    for key, value in task_data.items():
        if isinstance(value, uuid.UUID):
            task_data[key] = str(value)

    db_task = models.ProjectTask(
        project_id=str(project_id),
        **task_data
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@app.put("/api/projects/tasks/{task_id}", response_model=schemas.TaskResponse)
def update_project_task(
    task_id: UUID, 
    task_update: schemas.TaskUpdate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission(PERM_EDIT_PROJECT_REGISTRY))
):
    """Update a specific project task (US-2.4)"""
    db_task = db.query(models.ProjectTask).filter(models.ProjectTask.id == str(task_id)).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = task_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if isinstance(value, UUID):
            setattr(db_task, field, str(value))
        else:
            setattr(db_task, field, value)
            
    db.commit()
    db.refresh(db_task)
    return db_task

@app.delete("/api/projects/tasks/{task_id}")
def delete_project_task(
    task_id: UUID, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission(PERM_EDIT_PROJECT_REGISTRY))
):
    """Delete a project task (US-2.4)"""
    db_task = db.query(models.ProjectTask).filter(models.ProjectTask.id == str(task_id)).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(db_task)
    db.commit()
    return {"message": "Task deleted successfully"}


@app.delete("/api/rid-log/{rid_id}")
def delete_rid_log(rid_id: UUID, db: Session = Depends(get_db), current_user: models.User = Depends(require_permission(PERM_EDIT_PROJECT_REGISTRY))):
    """Delete a RID log entry"""
    db_rid = db.query(models.ProjectRidLog).filter(models.ProjectRidLog.id == str(rid_id)).first()
    if not db_rid:
        raise HTTPException(status_code=404, detail="RID entry not found")
    
    # Log deletion to impact log
    impact_log = models.ImpactLog(
        project_id=db_rid.project_id,
        event=f"RID Entry Deleted: {db_rid.type.value}",
        reason=db_rid.description[:100]
    )
    db.add(impact_log)
    
    db.delete(db_rid)
    db.commit()
    return {"message": "RID entry deleted"}

# =============================================================================
# Project Allocation Endpoints (US-11.8, US-11.9, US-11.10)
# =============================================================================

@app.get("/api/allocations", response_model=List[schemas.Allocation])
def get_all_allocations(db: Session = Depends(get_db)):
    """Get all allocations system-wide for capacity calculations"""
    return db.query(models.Allocation).all()

@app.get("/api/projects/{project_id}/allocations", response_model=List[schemas.Allocation])
def get_project_allocations(project_id: UUID, db: Session = Depends(get_db)):
    """Get all allocations for a project"""
    pid_str = str(project_id)
    db_project = db.query(models.Project).filter(models.Project.id == pid_str).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db_allocations = db.query(models.Allocation)\
        .filter(models.Allocation.project_id == pid_str)\
        .all()
    
    # Enrich with policy warnings (US-1.2)
    # Convert to Pydantic models explicitly to attach warnings
    results = []
    for alloc in db_allocations:
        schema_alloc = schemas.Allocation.model_validate(alloc)
        schema_alloc.policy_warnings = check_policy_violations(alloc, db)
        results.append(schema_alloc)
        
    return results

@app.post("/api/projects/{project_id}/allocations", response_model=schemas.Allocation)
def create_project_allocation(project_id: UUID, allocation: schemas.ProjectAllocationCreate, request: Request, db: Session = Depends(get_db)):
    """Add a new resource allocation to a project (US-11.8)"""
    pid_str = str(project_id)
    db_project = db.query(models.Project).filter(models.Project.id == pid_str).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db_engineer = db.query(models.Engineer).filter(models.Engineer.id == str(allocation.engineer_id)).first()
    if not db_engineer:
        raise HTTPException(status_code=404, detail="Engineer not found")
    
    # Create allocation
    db_allocation = models.Allocation(
        project_id=pid_str,
        engineer_id=str(allocation.engineer_id),
        hours=allocation.hours_per_week,
        # Exclude schema fields that are not in DB model
        **allocation.model_dump(exclude={"engineer_id", "role", "start_week", "end_week", "hours_per_week", "category", "day"}),
        category=allocation.category or models.CategoryEnum.PROJECT_WORK,
        day=allocation.day or models.DayEnum.MON
    )
    db.add(db_allocation)
    
    # Log to impact log
    impact_log = models.ImpactLog(
        project_id=str(project_id),
        event=f"Allocation Added: {db_engineer.name}",
        reason=f"Role: {allocation.role}, Hours: {allocation.hours_per_week}, Category: {allocation.category.value if allocation.category else 'Project Work'}"
    )
    db.add(impact_log)
    
    db.commit()
    db.refresh(db_allocation)
    
    # Send Notification (Phase 6 - P1)
    try:
        from services.notification_service import notification_service
        # Fetch names for the message
        eng = db.query(models.Engineer).filter(models.Engineer.id == str(allocation.engineer_id)).first()
        notification_service.notify_assignment(
            allocation=db_allocation,
            project_name=db_project.name,
            engineer_name=eng.name if eng else "Unknown Engineer",
            engineer_email=getattr(eng, "email", None)
        )
    except Exception as e:
        print(f"Notification Error: {e}")
    
    # US-4.3: Record in system activity audit log
    record_audit(db, "CREATE", "Allocation", db_allocation.id, allocation.model_dump(), None, request)
    
    # Return schema with warnings
    schema_alloc = schemas.Allocation.model_validate(db_allocation)
    schema_alloc.policy_warnings = check_policy_violations(db_allocation, db)
    return schema_alloc

@app.patch("/api/allocations/{allocation_id}", response_model=schemas.Allocation)
def update_allocation(
    allocation_id: UUID, 
    allocation_update: schemas.ProjectAllocationUpdate, 
    request: Request,
    db: Session = Depends(get_db)
):
    """Update allocation hours (US-11.10)"""
    db_allocation = db.query(models.Allocation).filter(models.Allocation.id == str(allocation_id)).first()
    if not db_allocation:
        raise HTTPException(status_code=404, detail="Allocation not found")
    
    old_hours = db_allocation.hours
    update_data = allocation_update.model_dump(exclude_unset=True)
    
    if 'hours_per_week' in update_data:
        db_allocation.hours = update_data['hours_per_week']
        
        # Log change to impact log
        engineer_name = db_allocation.engineer.name if db_allocation.engineer else "Unassigned"
        impact_log = models.ImpactLog(
            project_id=db_allocation.project_id,
            event=f"Allocation Updated: {engineer_name}",
            reason=f"Hours changed: {old_hours}h → {update_data['hours_per_week']}h"
        )
        db.add(impact_log)
    
    db.commit()
    db.refresh(db_allocation)
    
    # US-4.3: Record in system activity audit log
    record_audit(db, "PATCH", "Allocation", str(allocation_id), update_data, None, request)
    
    return db_allocation

@app.delete("/api/allocations/{allocation_id}")
def delete_allocation(allocation_id: UUID, request: Request, db: Session = Depends(get_db), current_user: models.User = Depends(require_permission(PERM_ALLOCATE_RESOURCES))):
    """Remove an allocation from a project (US-11.9)"""
    db_allocation = db.query(models.Allocation).filter(models.Allocation.id == str(allocation_id)).first()
    if not db_allocation:
        raise HTTPException(status_code=404, detail="Allocation not found")
    
    # Log removal to impact log
    engineer_name = db_allocation.engineer.name if db_allocation.engineer else "Unassigned"
    impact_log = models.ImpactLog(
        project_id=db_allocation.project_id,
        event=f"Resource Removed: {engineer_name}",
        reason=f"Allocation of {db_allocation.hours}h/week removed"
    )
    db.add(impact_log)
    
    db.delete(db_allocation)
    db.commit()
    
    # US-4.3: Record in system activity audit log
    record_audit(db, "DELETE", "Allocation", str(allocation_id), None, current_user, request)
    
    return {"message": "Allocation removed"}

# =============================================================================
# Impact Log Endpoint
# =============================================================================

@app.get("/api/projects/{project_id}/impact-log", response_model=List[schemas.ImpactLog])
def get_impact_logs(project_id: UUID, db: Session = Depends(get_db)):
    """Get impact log entries for a project"""
    db_project = db.query(models.Project).filter(models.Project.id == str(project_id)).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return db.query(models.ImpactLog)\
        .filter(models.ImpactLog.project_id == str(project_id))\
        .order_by(models.ImpactLog.date.desc())\
        .all()

# =============================================================================
# Resourcing Requirements Endpoints (US-RS.1)
# =============================================================================

@app.get("/api/projects/{project_id}/requirements", response_model=List[schemas.ResourcingRequirement])
def get_resourcing_requirements(project_id: UUID, db: Session = Depends(get_db)):
    """Get all resourcing requirements for a project"""
    db_project = db.query(models.Project).filter(models.Project.id == str(project_id)).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return db.query(models.ResourcingRequirement)\
        .filter(models.ResourcingRequirement.project_id == str(project_id))\
        .all()

@app.post("/api/projects/{project_id}/requirements", response_model=schemas.ResourcingRequirement)
def create_resourcing_requirement(project_id: UUID, requirement: schemas.ResourcingRequirementCreate, db: Session = Depends(get_db)):
    """Create a new resourcing requirement for a project"""
    db_project = db.query(models.Project).filter(models.Project.id == str(project_id)).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db_requirement = models.ResourcingRequirement(
        project_id=str(project_id),
        **requirement.model_dump()
    )
    db.add(db_requirement)
    db.commit()
    db.refresh(db_requirement)
    return db_requirement

@app.patch("/api/requirements/{requirement_id}", response_model=schemas.ResourcingRequirement)
def update_resourcing_requirement(requirement_id: UUID, requirement_update: schemas.ResourcingRequirementUpdate, db: Session = Depends(get_db)):
    """Update an existing resourcing requirement"""
    db_requirement = db.query(models.ResourcingRequirement).filter(models.ResourcingRequirement.id == str(requirement_id)).first()
    if not db_requirement:
        raise HTTPException(status_code=404, detail="Resourcing requirement not found")
    
    update_data = requirement_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_requirement, field, value)
    
    db.commit()
    db.refresh(db_requirement)
    return db_requirement

@app.delete("/api/requirements/{requirement_id}")
def delete_resourcing_requirement(requirement_id: UUID, db: Session = Depends(get_db)):
    """Delete a resourcing requirement"""
    db_requirement = db.query(models.ResourcingRequirement).filter(models.ResourcingRequirement.id == str(requirement_id)).first()
    if not db_requirement:
        raise HTTPException(status_code=404, detail="Resourcing requirement not found")
    
    db.delete(db_requirement)
    db.commit()
    return {"message": "Resourcing requirement deleted"}



# =============================================================================
# Project Device Endpoints (US-13.4, US-13.5)
# =============================================================================

@app.get("/api/devices", response_model=List[schemas.ProjectDevice])
def get_all_devices(db: Session = Depends(get_db)):
    """Get all project devices system-wide for reporting (US-13.6)"""
    return db.query(models.ProjectDevice).all()

@app.get("/api/projects/{project_id}/devices", response_model=List[schemas.ProjectDevice])
def get_project_devices(project_id: UUID, db: Session = Depends(get_db)):
    """Get all device entries for a project"""
    pid_str = str(project_id)
    db_project = db.query(models.Project).filter(models.Project.id == pid_str).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return db.query(models.ProjectDevice)\
        .filter(models.ProjectDevice.project_id == pid_str)\
        .all()

@app.post("/api/projects/{project_id}/devices", response_model=schemas.ProjectDevice)
def create_project_device(project_id: UUID, device: schemas.ProjectDeviceCreate, db: Session = Depends(get_db)):
    """Add a new device entry to a project (US-13.4)"""
    pid_str = str(project_id)
    db_project = db.query(models.Project).filter(models.Project.id == pid_str).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db_device = models.ProjectDevice(
        project_id=pid_str,
        **device.model_dump()
    )
    db.add(db_device)
    
    # Log to impact log
    net_change = device.proposed_qty - device.current_qty
    impact_log = models.ImpactLog(
        project_id=pid_str,
        event=f"Device Added: {device.device_type}",
        reason=f"Current: {device.current_qty}, Proposed: {device.proposed_qty}, Net: {'+' if net_change >= 0 else ''}{net_change}"
    )
    db.add(impact_log)
    
    db.commit()
    db.refresh(db_device)
    return db_device

@app.patch("/api/devices/{device_id}", response_model=schemas.ProjectDevice)
def update_project_device(device_id: UUID, device_update: schemas.ProjectDeviceUpdate, db: Session = Depends(get_db)):
    """Update a device entry (US-13.5)"""
    db_device = db.query(models.ProjectDevice).filter(models.ProjectDevice.id == str(device_id)).first()
    if not db_device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    update_data = device_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_device, field, value)
    
    db.commit()
    db.refresh(db_device)
    return db_device

@app.delete("/api/devices/{device_id}")
def delete_project_device(device_id: UUID, db: Session = Depends(get_db)):
    """Remove a device entry from a project"""
    db_device = db.query(models.ProjectDevice).filter(models.ProjectDevice.id == str(device_id)).first()
    if not db_device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Log removal to impact log
    impact_log = models.ImpactLog(
        project_id=db_device.project_id,
        event=f"Device Removed: {db_device.device_type}",
        reason=f"Removed volume entry of {db_device.proposed_qty} units"
    )
    db.add(impact_log)
    
    db.delete(db_device)
    db.commit()
    return {"message": "Device entry removed"}

