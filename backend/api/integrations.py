from fastapi import APIRouter, HTTPException, Request, Depends
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
import datetime
import uuid
import logging

# Configure Logging
logger = logging.getLogger("uvicorn")

router = APIRouter(
    prefix="/api/integrations",
    tags=["integrations"]
)

@router.post("/jira/webhook")
async def handle_jira_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Receives Webhook events from Jira.
    Triggers: issue_created, issue_updated
    """
    try:
        payload = await request.json()
        
        event_type = payload.get("webhookEvent")
        issue = payload.get("issue", {})
        fields = issue.get("fields", {})
        
        # We only care about Epics (or specific issue types)
        # You can customize this filter.
        issue_type = fields.get("issuetype", {}).get("name")
        if issue_type != "Epic":
            return {"status": "ignored", "reason": f"Type {issue_type} not tracked"}

        jira_key = issue.get("key") # e.g. NET-123
        summary = fields.get("summary")
        description = fields.get("description", "")
        
        # Check if project already exists (by name or external ID?)
        # For MVP, we'll try to match exact Name OR store the Jira Key in a new field.
        # Ideally, we should add 'external_ref' to Project model, but for now we look by Name.
        
        project_name = f"[{jira_key}] {summary}"
        
        existing_project = db.query(models.Project).filter(
            models.Project.name.contains(jira_key)
        ).first()
        
        if existing_project:
            # Update
            logger.info(f"Updating project from Jira: {jira_key}")
            existing_project.name = project_name
            # Map Jira Status -> RM Status? (Skipped for MVP)
            db.commit()
            return {"status": "updated", "id": existing_project.id}
        
        else:
            # Create New
            logger.info(f"Creating new project from Jira: {jira_key}")
            
            # Default dates (Start = Today, End = +3 Months)
            start_date = datetime.date.today()
            end_date = start_date + datetime.timedelta(days=90)
            
            new_project = models.Project(
                id=str(uuid.uuid4()),
                name=project_name,
                project_type="Project Work", # Default
                status=models.ProjectStatusEnum.HEALTHY,
                start_date=start_date,
                target_end_date=end_date,
                workflow_status=models.WorkflowStatusEnum.DRAFT,
                description=f"Imported from Jira {jira_key}"
            )
            db.add(new_project)
            db.commit()
            return {"status": "created", "id": new_project.id}

    except Exception as e:
        logger.error(f"Jira Webhook Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class ApptioRecord(schemas.BaseModel):
    project_name: str
    finance_code: str
    budget_cap: float

@router.post("/apptio/sync")
async def sync_apptio_data(records: list[ApptioRecord], db: Session = Depends(get_db)):
    """
    Batch update financial data from Apptio.
    Matches projects by Name.
    """
    updated_count = 0
    not_found = []

    try:
        for record in records:
            # Simple match by name (case-insensitive)
            # In a real scenario, use an external ID or fuzzy matching.
            project = db.query(models.Project).filter(
                models.Project.name.ilike(f"%{record.project_name}%")
            ).first()

            if project:
                project.finance_code = record.finance_code
                project.budget_cap = record.budget_cap
                updated_count += 1
            else:
                not_found.append(record.project_name)
        
        db.commit()
        return {
            "status": "success",
            "updated": updated_count,
            "not_found": not_found
        }

    except Exception as e:
        logger.error(f"Apptio Sync Error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
