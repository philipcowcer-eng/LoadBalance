from sqlalchemy import Column, Integer, String, Enum, UUID, ForeignKey, DateTime, Float, Date, Text
from sqlalchemy.orm import declarative_base, relationship
import uuid
from datetime import datetime, date
import enum

Base = declarative_base()

class RoleEnum(str, enum.Enum):
    NETWORK_ENGINEER = "Network Engineer"
    WIRELESS_ENGINEER = "Wireless Engineer"
    PROJECT_MANAGER = "Project Manager"
    ARCHITECT = "Architect"

class PriorityEnum(str, enum.Enum):
    P1 = "P1-Critical"
    P2 = "P2-Strategic"
    P3 = "P3-Standard"
    P4 = "P4-Low"

class ProjectStatusEnum(str, enum.Enum):
    HEALTHY = "Healthy"
    AT_RISK = "At Risk"
    DEPRIORITIZED = "Deprioritized"

class RagStatusEnum(str, enum.Enum):
    GREEN = "Green"
    AMBER = "Amber"
    RED = "Red"
    ISSUE = "Issue"

class WorkflowStatusEnum(str, enum.Enum):
    DRAFT = "Draft"
    PENDING_APPROVAL = "Pending Approval"
    APPROVED = "Approved"
    ACTIVE = "Active"
    ON_HOLD = "On Hold"
    COMPLETE = "Complete"
    CANCELLED = "Cancelled"

class RidTypeEnum(str, enum.Enum):
    RISK = "Risk"
    ISSUE = "Issue"
    DECISION = "Decision"

class RidSeverityEnum(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"

class RidStatusEnum(str, enum.Enum):
    OPEN = "Open"
    RESOLVED = "Resolved"
    CLOSED = "Closed"

class CategoryEnum(str, enum.Enum):
    PROJECT_WORK = "Project Work"
    OPERATIONAL_SUPPORT = "Operational Support"
    MEETINGS = "Meetings"

class FeedbackStatusEnum(str, enum.Enum):
    NONE = "None"
    UNDERESTIMATED = "Underestimated"
    OVERESTIMATED = "Overestimated"

class DayEnum(str, enum.Enum):
    MON = "Mon"
    TUE = "Tue"
    WED = "Wed"
    THU = "Thu"
    FRI = "Fri"

class AllocationStatusEnum(str, enum.Enum):
    ASSIGNED = "Assigned"
    REMOVED = "Removed"

class Engineer(Base):
    __tablename__ = "engineers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), nullable=False)
    total_capacity = Column(Integer, default=40)
    ktlo_tax = Column(Integer, default=0)
    
    allocations = relationship("Allocation", back_populates="engineer", cascade="all, delete-orphan")

class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    project_number = Column(String, nullable=True)  # User-defined project identifier
    project_site = Column(String, nullable=True)    # URL link to project site
    priority = Column(Enum(PriorityEnum), nullable=False)

    status = Column(Enum(ProjectStatusEnum), default=ProjectStatusEnum.HEALTHY)
    
    # Epic 11 fields
    owner_id = Column(String, ForeignKey("engineers.id"), nullable=True)
    manager_id = Column(String, ForeignKey("engineers.id"), nullable=True)
    rag_status = Column(Enum(RagStatusEnum), default=RagStatusEnum.GREEN)
    rag_reason = Column(String, nullable=True)  # Required when Red or Issue
    percent_complete = Column(Integer, default=0)
    business_justification = Column(Text, nullable=True)
    start_date = Column(Date, nullable=True)
    target_end_date = Column(Date, nullable=True)
    workflow_status = Column(Enum(WorkflowStatusEnum), default=WorkflowStatusEnum.DRAFT)
    project_type = Column(String, nullable=True)
    size = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Epic 13 fields (Fiscal Planning)
    fiscal_year = Column(String, nullable=True)
    device_count = Column(Integer, default=0)
    device_type = Column(String, nullable=True)

    # Status Update Fields
    latest_status_update = Column(Text, nullable=True)
    status_updated_at = Column(DateTime, nullable=True)
    
    # Relationships
    owner = relationship("Engineer", foreign_keys=[owner_id])
    manager = relationship("Engineer", foreign_keys=[manager_id])
    allocations = relationship("Allocation", back_populates="project")
    impact_logs = relationship("ImpactLog", back_populates="project")
    rid_logs = relationship("ProjectRidLog", back_populates="project")
    resourcing_requirements = relationship("ResourcingRequirement", back_populates="project")
    devices = relationship("ProjectDevice", back_populates="project", cascade="all, delete-orphan")

class ProjectRidLog(Base):
    """Risk, Issue, Decision log entries for projects (US-11.6, US-11.7)"""
    __tablename__ = "project_rid_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    type = Column(Enum(RidTypeEnum), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(Enum(RidSeverityEnum), default=RidSeverityEnum.MEDIUM)
    owner = Column(String, nullable=True)
    status = Column(Enum(RidStatusEnum), default=RidStatusEnum.OPEN)
    previous_type = Column(Enum(RidTypeEnum), nullable=True)  # For promotion tracking
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    project = relationship("Project", back_populates="rid_logs")

class Allocation(Base):
    __tablename__ = "allocations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    engineer_id = Column(String, ForeignKey("engineers.id"), nullable=False) # Changed nullable to False
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    category = Column(Enum(CategoryEnum), nullable=False)
    day = Column(Enum(DayEnum), nullable=False)
    hours = Column(Integer, nullable=False)
    feedback_status = Column(Enum(FeedbackStatusEnum), default=FeedbackStatusEnum.NONE)

    engineer = relationship("Engineer", back_populates="allocations")
    project = relationship("Project", back_populates="allocations")

class ImpactLog(Base):
    __tablename__ = "impact_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    event = Column(String, nullable=False)
    reason = Column(String, nullable=False)

    project = relationship("Project", back_populates="impact_logs")

class ResourcingRequirement(Base):
    """Defines staffing requirements for a project (US-RS.1)"""
    __tablename__ = "resourcing_requirements"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    role = Column(String, nullable=False)  # e.g., "Network Engineer"
    hours_per_week = Column(Integer, nullable=False)
    duration_weeks = Column(Integer, nullable=True)  # Optional
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="resourcing_requirements")

class ProjectDevice(Base):
    """Stores multiple device volume entries per project (US-13.4, US-13.5)"""
    __tablename__ = "project_devices"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    device_type = Column(String, nullable=False)  # e.g., "Access Points"
    current_qty = Column(Integer, default=0)       # Devices being replaced/refreshed
    proposed_qty = Column(Integer, nullable=False) # Devices to deploy
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    project = relationship("Project", back_populates="devices")

