"""
Utility functions for goodenough.to | Planning
"""
import json
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import Request
import models

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
