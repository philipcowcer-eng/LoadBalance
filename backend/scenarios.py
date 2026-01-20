from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User
from auth import get_current_user
from pydantic import BaseModel
from typing import List, Optional
from services.scenario_service import ScenarioService

router = APIRouter()

# --- Pydantic Models ---
class ScenarioCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ScenarioResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    mode: str
    owner_id: str
    is_active: int
    
    class Config:
        orm_mode = True

class VirtualResourceCreate(BaseModel):
    name: str
    role: str
    capacity_hours: int = 40
    cost_rate: float = 0.0

class VirtualResourceResponse(BaseModel):
    id: str
    name: str
    role: str
    capacity_hours: int
    cost_rate: float
    scenario_id: str
    
    class Config:
        orm_mode = True

# --- Endpoints ---

@router.post("/", response_model=ScenarioResponse)
def create_scenario(
    scenario: ScenarioCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return ScenarioService.create_scenario(
        db, 
        name=scenario.name, 
        description=scenario.description, 
        owner_id=current_user.id
    )

@router.post("/clone", response_model=ScenarioResponse)
def clone_baseline(
    scenario: ScenarioCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return ScenarioService.clone_baseline(db, name=scenario.name, owner_id=current_user.id)

@router.get("/", response_model=List[ScenarioResponse])
def list_my_scenarios(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return ScenarioService.list_scenarios(db, owner_id=current_user.id)

@router.post("/{id}/resources", response_model=VirtualResourceResponse)
def add_virtual_resource(
    id: str,
    resource: VirtualResourceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return ScenarioService.add_virtual_resource(
        db, 
        scenario_id=id, 
        resource_data=resource.dict(), 
        current_user_id=current_user.id
    )
