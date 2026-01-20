from sqlalchemy.orm import Session
from models import Scenario, VirtualResource, Engineer, Allocation
from fastapi import HTTPException
import uuid

class ScenarioService:
    @staticmethod
    def create_scenario(db: Session, name: str, description: str, owner_id: str):
        scenario = Scenario(
            name=name,
            description=description,
            owner_id=owner_id,
            mode="sandbox"
        )
        db.add(scenario)
        db.commit()
        db.refresh(scenario)
        return scenario

    @staticmethod
    def add_virtual_resource(db: Session, scenario_id: str, resource_data: dict, current_user_id: str):
        # 1. Fetch Scenario
        scenario = db.query(Scenario).filter(Scenario.id == scenario_id).first()
        if not scenario:
            raise HTTPException(status_code=404, detail="Scenario not found")
        
        # 2. Security Check: Ownership/Permission (Basic check for now)
        # In a real app, we'd check if current_user_id == scenario.owner_id or has shared access
        
        # 3. Logic Integrity Check (Security Standard)
        if scenario.mode != 'sandbox':
            raise HTTPException(status_code=400, detail="Cannot add virtual resources to a live production plan.")
            
        # 4. Create Resource
        v_res = VirtualResource(
            scenario_id=scenario_id,
            name=resource_data['name'],
            role=resource_data['role'],
            capacity_hours=resource_data.get('capacity_hours', 40),
            cost_rate=resource_data.get('cost_rate', 0.0)
        )
        db.add(v_res)
        db.commit()
        db.refresh(v_res)
        return v_res

    @staticmethod
    def list_scenarios(db: Session, owner_id: str):
        return db.query(Scenario).filter(Scenario.owner_id == owner_id).all()
        
    @staticmethod
    def get_scenario_details(db: Session, scenario_id: str):
        scenario = db.query(Scenario).filter(Scenario.id == scenario_id).first()
        if not scenario:
            raise HTTPException(status_code=404, detail="Scenario not found")
        return scenario

    @staticmethod
    def clone_baseline(db: Session, name: str, owner_id: str):
        """ Stub for cloning the baseline plan into a scenario (US-1.1) """
        scenario = Scenario(
            name=name,
            description="Cloned from Live Plan",
            owner_id=owner_id,
            mode="sandbox"
        )
        db.add(scenario)
        db.commit()
        db.refresh(scenario)
        return scenario
