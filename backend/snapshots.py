"""
Snapshots module for goodenough.to | Planning
US-0.3: Snapshot Restore

This module provides functionality to Create, List, and Restore database snapshots.
Uses SQLite's full database file copy for safety.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
import os
import shutil
from datetime import datetime
from typing import List
from pydantic import BaseModel

import models
from database import get_db
from auth import get_current_user, require_role

# =============================================================================
# Schemas
# =============================================================================

class SnapshotInfo(BaseModel):
    filename: str
    created_at: datetime
    size_kb: float

# =============================================================================
# Configuration
# =============================================================================

# Use /app/data in Docker (volume mount) or local path for development
DATA_DIR = os.environ.get("DATA_DIR", os.getcwd())

SNAPSHOT_DIR = os.path.join(DATA_DIR, "snapshots")
DB_PATH = os.path.join(DATA_DIR, "resource_manager.db")

# Ensure snapshot directory exists
if not os.path.exists(SNAPSHOT_DIR):
    os.makedirs(SNAPSHOT_DIR)

# =============================================================================
# Router
# =============================================================================

snapshot_router = APIRouter(prefix="/api/snapshots", tags=["Snapshots"])

@snapshot_router.post("/create", response_model=SnapshotInfo)
def create_snapshot(current_user: models.User = Depends(require_role("admin"))):
    """ Create a full backup of the current database """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"snapshot_{timestamp}.db"
    dest_path = os.path.join(SNAPSHOT_DIR, filename)
    
    try:
        # For SQLite, a simple file copy is a valid snapshot if not in mid-transaction
        # In a real high-traffic app, we'd use VACUUM INTO or online backup
        shutil.copy2(DB_PATH, dest_path)
        
        size = os.path.getsize(dest_path) / 1024
        
        return SnapshotInfo(
            filename=filename,
            created_at=datetime.now(),
            size_kb=round(size, 2)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create snapshot: {str(e)}")

@snapshot_router.get("/", response_model=List[SnapshotInfo])
def list_snapshots(current_user: models.User = Depends(require_role("admin"))):
    """ List all available snapshots """
    snapshots = []
    
    for f in os.listdir(SNAPSHOT_DIR):
        if f.endswith(".db"):
            path = os.path.join(SNAPSHOT_DIR, f)
            stats = os.stat(path)
            snapshots.append(SnapshotInfo(
                filename=f,
                created_at=datetime.fromtimestamp(stats.st_ctime),
                size_kb=round(stats.st_size / 1024, 2)
            ))
            
    return sorted(snapshots, key=lambda x: x.created_at, reverse=True)

@snapshot_router.post("/restore/{filename}")
def restore_snapshot(filename: str, current_user: models.User = Depends(require_role("admin"))):
    """ 
    Restore the database to a previous state.
    CAUTION: This will overwrite current data.
    """
    snapshot_path = os.path.join(SNAPSHOT_DIR, filename)
    
    if not os.path.exists(snapshot_path):
        raise HTTPException(status_code=404, detail="Snapshot not found")
        
    try:
        # 1. Create a "Pre-Restore" safety backup
        safety_name = f"pre_restore_safety_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
        shutil.copy2(DB_PATH, os.path.join(SNAPSHOT_DIR, safety_name))
        
        # 2. Overwrite the main DB
        # Note: In production uvicorn/fastapi, the DB file might be locked. 
        # The user will need to restart the container for the best result.
        shutil.copy2(snapshot_path, DB_PATH)
        
        return {"message": "Database restored successfully. Please RESTART the server to ensure all connections are refreshed."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Restore failed: {str(e)}")
