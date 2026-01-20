from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import uuid

from database import get_db
from models import ProjectNote, Project


router = APIRouter(
    tags=["project_notes"]
)

# Pydantic Schemas
class ProjectNoteCreate(BaseModel):
    content: str
    created_by: Optional[str] = None

class ProjectNoteResponse(BaseModel):
    id: str
    project_id: str
    content: str
    created_by: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("/projects/{project_id}/notes", response_model=List[ProjectNoteResponse])
def get_project_notes(project_id: str, db: Session = Depends(get_db)):
    notes = db.query(ProjectNote).filter(ProjectNote.project_id == project_id).order_by(ProjectNote.created_at.desc()).all()
    return notes

@router.post("/projects/{project_id}/notes", response_model=ProjectNoteResponse)
def add_project_note(project_id: str, note: ProjectNoteCreate, db: Session = Depends(get_db)):
    # Verify project exists
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    new_note = ProjectNote(
        project_id=project_id,
        content=note.content,
        created_by=note.created_by
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note

@router.delete("/projects/{project_id}/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project_note(project_id: str, note_id: str, db: Session = Depends(get_db)):
    note = db.query(ProjectNote).filter(ProjectNote.id == note_id, ProjectNote.project_id == project_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    db.delete(note)
    db.commit()
    return None

