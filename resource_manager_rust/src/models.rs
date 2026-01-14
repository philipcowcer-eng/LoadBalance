use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, NaiveDate, Utc};

// ============================================================================
// ENUMS
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "TEXT")]
pub enum UserRole {
    Admin,
    Director,
    #[serde(rename = "Resource Manager")]
    #[sqlx(rename = "Resource Manager")]
    ResourceManager,
    #[serde(rename = "Project Manager")]
    #[sqlx(rename = "Project Manager")]
    ProjectManager,
    Engineer,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "TEXT", rename_all = "snake_case")]
pub enum Specialization {
    #[serde(alias = "Routing & Switching")]
    #[sqlx(rename = "Routing & Switching")]
    RoutingSwitching,
    #[sqlx(rename = "Firewall")]
    Firewall,
    #[sqlx(rename = "Wireless")]
    Wireless,
    #[sqlx(rename = "Cloud")]
    Cloud,
    #[sqlx(rename = "Automation")]
    Automation,
    #[serde(alias = "NOC Operations")]
    #[sqlx(rename = "NOC Operations")]
    NOCOperations,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "TEXT")]
pub enum Priority {
    #[serde(rename = "P1-Critical")]
    P1,
    #[serde(rename = "P2-High")]
    P2,
    #[serde(rename = "P3-Medium")]
    P3,
    #[serde(rename = "P4-Low")]
    P4,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "TEXT")]
pub enum WorkflowStatus {
    Draft,
    #[serde(rename = "Pending Approval")]
    PendingApproval,
    Approved,
    Active,
    #[serde(rename = "On Hold")]
    OnHold,
    Complete,
    Cancelled,
}

impl Default for WorkflowStatus {
    fn default() -> Self {
        WorkflowStatus::Draft
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "TEXT")]
pub enum RAGStatus {
    Green,
    Amber,
    Red,
}

impl Default for RAGStatus {
    fn default() -> Self {
        RAGStatus::Green
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "TEXT")]
pub enum ProjectType {
    Strategic,
    BAU,
    Compliance,
    #[serde(rename = "Tech Debt")]
    TechDebt,
    Emergency,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "TEXT")]
pub enum Size {
    S,  // 3h/week
    M,  // 5h/week
    L,  // 8h/week
    XL, // 13h/week
}

impl Size {
    pub fn hours_per_week(&self) -> i32 {
        match self {
            Size::S => 3,
            Size::M => 5,
            Size::L => 8,
            Size::XL => 13,
        }
    }

    pub fn pm_base_hours(&self) -> i32 {
        match self {
            Size::S => 2,
            Size::M => 3,
            Size::L => 5,
            Size::XL => 8,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "TEXT")]
pub enum AllocationType {
    Engineering,
    PM,
}

impl Default for AllocationType {
    fn default() -> Self {
        AllocationType::Engineering
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "TEXT")]
pub enum AllocationStatus {
    Active,
    Pending,
    Removed,
}

impl Default for AllocationStatus {
    fn default() -> Self {
        AllocationStatus::Active
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "TEXT")]
pub enum MilestoneStatus {
    #[serde(rename = "Not Started")]
    NotStarted,
    #[serde(rename = "In Progress")]
    InProgress,
    Complete,
    Missed,
}

impl Default for MilestoneStatus {
    fn default() -> Self {
        MilestoneStatus::NotStarted
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "TEXT")]
pub enum DependencyType {
    #[serde(rename = "Blocked By")]
    BlockedBy,
    Blocks,
    #[serde(rename = "Related To")]
    RelatedTo,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "TEXT")]
pub enum ImpactEventType {
    AllocationAdded,
    AllocationRemoved,
    PriorityChanged,
    StatusChanged,
    DateChanged,
    HoursBumped,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "TEXT")]
pub enum FeedbackStatus {
    None,
    Underestimated,
    Overestimated,
}

impl Default for FeedbackStatus {
    fn default() -> Self {
        FeedbackStatus::None
    }
}

// ============================================================================
// MODELS
// ============================================================================

/// User - Supports authentication and ownership
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub name: String,
    pub role: UserRole,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Engineer - Extended profile linked to User
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Engineer {
    pub id: Uuid,
    pub user_id: Option<Uuid>,      // FK → User (optional for backward compat)
    pub name: String,               // Denormalized for convenience
    pub employee_id: Option<String>,
    pub title: Option<String>,
    pub specialization: Option<Specialization>,
    pub total_capacity: i32,
    pub ktlo_tax: i32,
    pub hire_date: Option<NaiveDate>,
    pub manager_id: Option<Uuid>,
    pub is_pm: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Engineer {
    pub fn effective_capacity(&self) -> i32 {
        self.total_capacity - self.ktlo_tax
    }
}

/// Project - Full project entity with all PM attributes
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Project {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub business_justification: Option<String>,
    pub priority: Priority,
    pub workflow_status: WorkflowStatus,
    pub rag_status: RAGStatus,
    pub project_type: Option<ProjectType>,
    pub size: Option<Size>,
    pub owner_id: Option<Uuid>,
    pub sponsor_id: Option<Uuid>,
    pub start_date: Option<NaiveDate>,
    pub target_end_date: Option<NaiveDate>,
    pub actual_end_date: Option<NaiveDate>,
    pub percent_complete: i32,
    pub apptio_project_id: Option<String>,
    pub budget_code: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub archived_at: Option<DateTime<Utc>>,
}

impl Project {
    /// Calculate PM hours required based on size and engineer count
    pub fn calculate_pm_hours(&self, engineer_count: i32) -> i32 {
        match &self.size {
            Some(size) => {
                let base = size.pm_base_hours();
                if engineer_count >= 2 { base + 1 } else { base }
            }
            None => 0,
        }
    }
}

/// ProjectAllocation - Engineer assignment to a project
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ProjectAllocation {
    pub id: Uuid,
    pub project_id: Uuid,
    pub engineer_id: Uuid,
    pub role_required: String,
    pub hours_per_week: i32,
    pub allocation_type: AllocationType,
    pub start_week: Option<NaiveDate>,
    pub end_week: Option<NaiveDate>,
    pub status: AllocationStatus,
    pub feedback_status: FeedbackStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub scenario_id: Option<Uuid>,
}

/// HealthNote - Status update with RAG
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct HealthNote {
    pub id: Uuid,
    pub project_id: Uuid,
    pub author_id: Uuid,
    pub rag_status: RAGStatus,
    pub content: String,
    pub created_at: DateTime<Utc>,
}

/// ImpactLog - Audit trail for project changes
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ImpactLog {
    pub id: Uuid,
    pub project_id: Uuid,
    pub event_type: ImpactEventType,
    pub description: String,
    pub old_value: Option<String>,
    pub new_value: Option<String>,
    pub triggered_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
}

/// Milestone - Project deliverable tracking
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Milestone {
    pub id: Uuid,
    pub project_id: Uuid,
    pub name: String,
    pub target_date: NaiveDate,
    pub actual_date: Option<NaiveDate>,
    pub status: MilestoneStatus,
    pub sort_order: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// ProjectDependency - Cross-project dependencies
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ProjectDependency {
    pub id: Uuid,
    pub project_id: Uuid,
    pub depends_on_id: Uuid,
    pub dependency_type: DependencyType,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
}

/// Scenario - Sandbox for what-if planning
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Scenario {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
}

// ============================================================================
// CREATE DTOs (Request Bodies)
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct CreateUser {
    pub email: String,
    pub name: String,
    pub role: UserRole,
}

#[derive(Debug, Deserialize)]
pub struct CreateEngineer {
    pub name: String,
    pub user_id: Option<Uuid>,
    pub employee_id: Option<String>,
    pub title: Option<String>,
    pub specialization: Option<Specialization>,
    #[serde(default = "default_capacity")]
    pub total_capacity: i32,
    #[serde(default)]
    pub ktlo_tax: i32,
    pub hire_date: Option<NaiveDate>,
    pub manager_id: Option<Uuid>,
    #[serde(default)]
    pub is_pm: bool,
}

fn default_capacity() -> i32 {
    40
}

#[derive(Debug, Deserialize)]
pub struct CreateProject {
    pub name: String,
    pub description: Option<String>,
    pub business_justification: Option<String>,
    pub priority: Priority,
    #[serde(default)]
    pub workflow_status: WorkflowStatus,
    pub project_type: Option<ProjectType>,
    pub size: Option<Size>,
    pub owner_id: Option<Uuid>,
    pub sponsor_id: Option<Uuid>,
    pub start_date: Option<NaiveDate>,
    pub target_end_date: Option<NaiveDate>,
    pub apptio_project_id: Option<String>,
    pub budget_code: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProject {
    pub name: Option<String>,
    pub description: Option<String>,
    pub business_justification: Option<String>,
    pub priority: Option<Priority>,
    pub workflow_status: Option<WorkflowStatus>,
    pub rag_status: Option<RAGStatus>,
    pub project_type: Option<ProjectType>,
    pub size: Option<Size>,
    pub owner_id: Option<Uuid>,
    pub sponsor_id: Option<Uuid>,
    pub start_date: Option<NaiveDate>,
    pub target_end_date: Option<NaiveDate>,
    pub actual_end_date: Option<NaiveDate>,
    pub percent_complete: Option<i32>,
    pub apptio_project_id: Option<String>,
    pub budget_code: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateAllocation {
    pub project_id: Uuid,
    pub engineer_id: Uuid,
    pub role_required: String,
    pub hours_per_week: i32,
    #[serde(default)]
    pub allocation_type: AllocationType,
    pub start_week: Option<NaiveDate>,
    pub end_week: Option<NaiveDate>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateAllocation {
    pub role_required: Option<String>,
    pub hours_per_week: Option<i32>,
    pub status: Option<AllocationStatus>,
    pub end_week: Option<NaiveDate>,
    pub feedback_status: Option<FeedbackStatus>,
}

#[derive(Debug, Deserialize)]
pub struct CreateHealthNote {
    pub project_id: Uuid,
    pub author_id: Uuid,
    pub rag_status: RAGStatus,
    pub content: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateMilestone {
    pub project_id: Uuid,
    pub name: String,
    pub target_date: NaiveDate,
    #[serde(default)]
    pub sort_order: i32,
}

#[derive(Debug, Deserialize)]
pub struct UpdateMilestone {
    pub name: Option<String>,
    pub target_date: Option<NaiveDate>,
    pub actual_date: Option<NaiveDate>,
    pub status: Option<MilestoneStatus>,
    pub sort_order: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct CreateScenario {
    pub name: String,
    pub description: Option<String>,
    pub created_by: Uuid,
}

// ============================================================================
// RESPONSE DTOs (Enriched Views)
// ============================================================================

/// Full project detail with computed fields
#[derive(Debug, Serialize)]
pub struct ProjectDetail {
    #[serde(flatten)]
    pub project: Project,
    pub owner_name: Option<String>,
    pub sponsor_name: Option<String>,
    pub total_allocated_hours: i32,
    pub engineer_count: i32,
    pub pm_hours_required: i32,
    pub timeline_weeks: Option<i32>,
    pub weeks_elapsed: Option<i32>,
    pub allocations: Vec<AllocationWithEngineer>,
    pub health_notes: Vec<HealthNoteWithAuthor>,
    pub milestones: Vec<Milestone>,
    pub recent_impact_logs: Vec<ImpactLog>,
}

#[derive(Debug, Serialize)]
pub struct AllocationWithEngineer {
    #[serde(flatten)]
    pub allocation: ProjectAllocation,
    pub engineer_name: String,
    pub engineer_initials: String,
}

#[derive(Debug, Serialize)]
pub struct HealthNoteWithAuthor {
    #[serde(flatten)]
    pub note: HealthNote,
    pub author_name: String,
}

/// List view (lightweight)
#[derive(Debug, Serialize)]
pub struct ProjectListItem {
    pub id: Uuid,
    pub name: String,
    pub priority: Priority,
    pub workflow_status: WorkflowStatus,
    pub rag_status: RAGStatus,
    pub size: Option<Size>,
    pub total_allocated_hours: i32,
    pub target_quarter: Option<String>,
}
