"""
Audit Log module for goodenough.to | Planning
US-0.3: Audit Trail

This module provides utility to record user actions and an API to view them.
"""

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json

import models
from database import get_db
from auth import get_current_user

# =============================================================================
# Schemas
# =============================================================================

class AuditLogEntry(BaseModel):
    id: str
    timestamp: datetime
    username: Optional[str]
    action: str
    resource_type: str
    resource_id: Optional[str]
    details: Optional[str]
    ip_address: Optional[str]

    class Config:
        from_attributes = True

# =============================================================================
# Utility
# =============================================================================

def record_audit(
    db: Session,
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    details: Optional[dict] = None,
    user: Optional[models.User] = None,
    request: Optional[Request] = None
):
    """ Record a manual action in the audit log """
    try:
        details_str = json.dumps(details) if details else None
        
        ip = None
        if request:
            ip = request.client.host if request.client else None
            
        audit = models.AuditLog(
            user_id=user.id if user else "system",
            username=user.username if user else "system",
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details_str,
            ip_address=ip
        )
        db.add(audit)
        db.commit()
    except Exception as e:
        print(f"FAILED TO RECORD AUDIT: {e}")
        db.rollback()

# =============================================================================
# Router
# =============================================================================

audit_router = APIRouter(prefix="/api/audit", tags=["Audit"])

@audit_router.get("/logs", response_model=List[AuditLogEntry])
def get_audit_logs(
    limit: int = 100,
    offset: int = 0,
    resource_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """ Get recent audit logs (Admin/Resource Manager only) """
    if current_user.role not in ["admin", "resource_manager"]:
        return []
        
    query = db.query(models.AuditLog)
    
    if resource_type:
        query = query.filter(models.AuditLog.resource_type == resource_type)
        
    return query.order_by(models.AuditLog.timestamp.desc()).limit(limit).offset(offset).all()
