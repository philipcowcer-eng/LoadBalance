from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from database import get_db
import models
import schemas
from auth import get_current_user

router = APIRouter()

@router.get("/projects/{project_id}/members", response_model=List[schemas.ProjectMember])
def get_project_members(project_id: str, db: Session = Depends(get_db)):
    """
    List all members associated with a specific project.
    """
    members = db.query(models.ProjectMember).filter(models.ProjectMember.project_id == project_id).all()
    return members

@router.post("/projects/{project_id}/members", response_model=schemas.ProjectMember)
def add_project_member(
    project_id: str, 
    member: schemas.ProjectMemberCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Add a new member (Engineer + Role) to the project.
    """
    # Verify project exists
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Verify engineer exists
    engineer = db.query(models.Engineer).filter(models.Engineer.id == str(member.engineer_id)).first()
    if not engineer:
        raise HTTPException(status_code=404, detail="Engineer not found")

    # Check if already a member (optional: allow multiple roles? For now, assume one role per engineer per project uniqueness isn't strict, but let's allow it)
    # If uniqueness is required, we'd check here. Let's allow one engineer to have multiple roles if needed (e.g. Tech Lead AND Deployment Lead)
    
    new_member = models.ProjectMember(
        project_id=project_id,
        engineer_id=str(member.engineer_id),
        role=member.role
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return new_member

@router.delete("/projects/{project_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_project_member(
    project_id: str, 
    member_id: str, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Remove a member from the project.
    """
    member = db.query(models.ProjectMember).filter(
        models.ProjectMember.id == member_id,
        models.ProjectMember.project_id == project_id
    ).first()
    
    if not member:
        raise HTTPException(status_code=404, detail="Project member not found")
        
    db.delete(member)
    db.commit()
    return None
