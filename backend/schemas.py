from pydantic import BaseModel, ConfigDict, computed_field, Field
from uuid import UUID
from datetime import datetime, date
from typing import Optional, List
from models import (
    RoleEnum, PriorityEnum, ProjectStatusEnum, CategoryEnum, DayEnum, 
    FeedbackStatusEnum, RagStatusEnum, WorkflowStatusEnum, RidTypeEnum, 
    RidSeverityEnum, RidStatusEnum, AllocationStatusEnum
)

# Base Schemas
class EngineerBase(BaseModel):
    name: str
    role: RoleEnum
    total_capacity: int = 40
    ktlo_tax: int = 0

class ProjectBase(BaseModel):
    name: str
    priority: PriorityEnum
    status: ProjectStatusEnum = ProjectStatusEnum.HEALTHY

class AllocationBase(BaseModel):
    engineer_id: Optional[UUID] = None
    project_id: UUID
    category: CategoryEnum
    day: DayEnum
    hours: int
    feedback_status: FeedbackStatusEnum = FeedbackStatusEnum.NONE

# Create Schemas
class EngineerCreate(EngineerBase):
    pass

class ProjectCreate(ProjectBase):
    # Optional Epic 11 fields for creation
    project_number: Optional[str] = None
    project_site: Optional[str] = None
    owner_id: Optional[UUID] = None
    manager_id: Optional[UUID] = None
    rag_status: RagStatusEnum = RagStatusEnum.GREEN
    percent_complete: int = 0
    business_justification: Optional[str] = None
    start_date: Optional[date] = None
    target_end_date: Optional[date] = None
    workflow_status: WorkflowStatusEnum = WorkflowStatusEnum.DRAFT
    project_type: Optional[str] = None
    project_type: Optional[str] = None
    size: Optional[str] = None
    
    # Epic 13 fields
    fiscal_year: Optional[str] = None
    device_count: int = 0
    device_type: Optional[str] = None

class AllocationCreate(AllocationBase):
    pass

# Update Schemas (PATCH support for Epic 11)
class ProjectUpdate(BaseModel):
    """Partial update schema for Epic 11 editing (US-11.1 to US-11.5)"""
    name: Optional[str] = None
    project_number: Optional[str] = None
    project_site: Optional[str] = None
    priority: Optional[PriorityEnum] = None
    status: Optional[ProjectStatusEnum] = None
    owner_id: Optional[UUID] = None
    manager_id: Optional[UUID] = None
    rag_status: Optional[RagStatusEnum] = None
    rag_reason: Optional[str] = None
    percent_complete: Optional[int] = Field(None, ge=0, le=100)
    business_justification: Optional[str] = Field(None, max_length=2000)
    start_date: Optional[date] = None
    target_end_date: Optional[date] = None
    workflow_status: Optional[WorkflowStatusEnum] = None
    project_type: Optional[str] = None
    size: Optional[str] = None
    size: Optional[str] = None
    latest_status_update: Optional[str] = None

    # Epic 13 fields
    fiscal_year: Optional[str] = None
    device_count: Optional[int] = None
    device_type: Optional[str] = None

# RID Log Schemas (US-11.6, US-11.7)
class RidLogCreate(BaseModel):
    """Schema for creating RID log entries (US-11.7)"""
    type: RidTypeEnum
    description: str = Field(..., min_length=10)
    severity: RidSeverityEnum = RidSeverityEnum.MEDIUM
    owner: Optional[str] = None

class RidLogUpdate(BaseModel):
    """Schema for updating/promoting RID entries (US-11.6)"""
    type: Optional[RidTypeEnum] = None
    description: Optional[str] = None
    severity: Optional[RidSeverityEnum] = None
    owner: Optional[str] = None
    status: Optional[RidStatusEnum] = None

class RidLog(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    project_id: UUID
    type: RidTypeEnum
    description: str
    severity: RidSeverityEnum
    owner: Optional[str]
    status: RidStatusEnum
    previous_type: Optional[RidTypeEnum]
    created_at: datetime
    updated_at: datetime

# Project Allocation Schemas (US-11.8, US-11.9, US-11.10)
class ProjectAllocationCreate(BaseModel):
    """Schema for adding allocation from project modal (US-11.8)"""
    engineer_id: UUID
    role: Optional[str] = None
    hours_per_week: int = Field(..., ge=2, le=40)
    start_week: Optional[date] = None
    end_week: Optional[date] = None

class ProjectAllocationUpdate(BaseModel):
    """Schema for updating allocation hours (US-11.10)"""
    hours_per_week: Optional[int] = Field(None, ge=2, le=40)

# Response Schemas
class Engineer(EngineerBase):
    model_config = ConfigDict(from_attributes=True)
    id: UUID

    @computed_field
    @property
    def effective_capacity(self) -> int:
        return self.total_capacity - self.ktlo_tax

# Epic 13 fields
    fiscal_year: Optional[str] = None
    device_count: int = 0
    device_type: Optional[str] = None

class RoleStaffingStatus(BaseModel):
    """Staffing status for a specific role (EPIC-002)"""
    role: str
    required: int
    allocated: int
    is_complete: bool

class Project(ProjectBase):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    # Epic 11 fields
    project_number: Optional[str] = None
    project_site: Optional[str] = None
    owner_id: Optional[UUID] = None
    manager_id: Optional[UUID] = None
    rag_status: RagStatusEnum = RagStatusEnum.GREEN
    rag_reason: Optional[str] = None
    percent_complete: int = 0
    business_justification: Optional[str] = None
    start_date: Optional[date] = None
    target_end_date: Optional[date] = None
    workflow_status: WorkflowStatusEnum = WorkflowStatusEnum.DRAFT
    project_type: Optional[str] = None
    size: Optional[str] = None
    latest_status_update: Optional[str] = None
    status_updated_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    # Epic 13 fields
    fiscal_year: Optional[str] = None
    device_count: int = 0
    device_type: Optional[str] = None

    # Epic-002: Smart Backlog support
    total_hours_required: int = 0
    total_hours_allocated: int = 0
    is_fully_staffed: bool = False
    role_staffing: List[RoleStaffingStatus] = []

class Allocation(AllocationBase):
    model_config = ConfigDict(from_attributes=True)
    id: UUID

class ImpactLog(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    project_id: UUID
    date: datetime
    event: str
    reason: str

# Resourcing Requirements Schemas (US-RS.1)
class ResourcingRequirementCreate(BaseModel):
    """Schema for creating resourcing requirements"""
    role: str
    hours_per_week: int = Field(..., ge=1, le=40)
    duration_weeks: Optional[int] = Field(None, ge=1)

class ResourcingRequirementUpdate(BaseModel):
    """Schema for updating resourcing requirements"""
    role: Optional[str] = None
    hours_per_week: Optional[int] = Field(None, ge=1, le=40)
    duration_weeks: Optional[int] = Field(None, ge=1)

class ResourcingRequirement(BaseModel):
    """Response schema for resourcing requirements"""
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    project_id: UUID
    role: str
    hours_per_week: int
    duration_weeks: Optional[int] = None
    created_at: datetime

# Project Device Schemas (US-13.4, US-13.5)
class ProjectDeviceCreate(BaseModel):
    """Schema for adding a device entry to a project"""
    device_type: str
    current_qty: int = 0
    proposed_qty: int

class ProjectDeviceUpdate(BaseModel):
    """Schema for updating a device entry"""
    device_type: Optional[str] = None
    current_qty: Optional[int] = None
    proposed_qty: Optional[int] = None

class ProjectDevice(BaseModel):
    """Response schema for project devices"""
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    project_id: UUID
    device_type: str
    current_qty: int
    proposed_qty: int
    created_at: datetime

    @computed_field
    @property
    def net_change(self) -> int:
        return self.proposed_qty - self.current_qty

