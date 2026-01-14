use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::Deserialize;
use uuid::Uuid;
use chrono::Utc;

use crate::db::DbPool;
use crate::models::{
    CreateEngineer, CreateProject, UpdateProject, Engineer, Project,
    CreateAllocation, ProjectAllocation, CreateHealthNote, HealthNote,
    CreateScenario, Scenario, User,
};

// ============================================================================
// Query Parameters
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct ProjectFilters {
    pub status: Option<String>,
    pub priority: Option<String>,
    pub owner_id: Option<Uuid>,
}

// ============================================================================
// ============================================================================
// User Routes
// ============================================================================

pub async fn list_users(
    State(pool): State<DbPool>,
) -> Result<Json<Vec<User>>, (StatusCode, String)> {
    let users = sqlx::query_as::<_, User>(
        "SELECT id, email, name, role, is_active, created_at, updated_at FROM users ORDER BY name ASC"
    )
        .fetch_all(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(users))
}

// ============================================================================
// Engineer Routes
// ============================================================================

pub async fn list_engineers(
    State(pool): State<DbPool>,
) -> Result<Json<Vec<Engineer>>, (StatusCode, String)> {
    let engineers = sqlx::query_as::<_, Engineer>(
        "SELECT id, user_id, name, employee_id, title, specialization, total_capacity, ktlo_tax, hire_date, manager_id, is_pm, created_at, updated_at FROM engineers"
    )
        .fetch_all(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(engineers))
}

pub async fn create_engineer(
    State(pool): State<DbPool>,
    Json(payload): Json<CreateEngineer>,
) -> Result<Json<Engineer>, (StatusCode, String)> {
    let id = Uuid::new_v4();
    let now = Utc::now();
    
    let engineer = sqlx::query_as::<_, Engineer>(
        r#"
        INSERT INTO engineers (id, user_id, name, employee_id, title, specialization, total_capacity, ktlo_tax, hire_date, manager_id, is_pm, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(&payload.user_id)
    .bind(&payload.name)
    .bind(&payload.employee_id)
    .bind(&payload.title)
    .bind(&payload.specialization)
    .bind(payload.total_capacity)
    .bind(payload.ktlo_tax)
    .bind(&payload.hire_date)
    .bind(&payload.manager_id)
    .bind(payload.is_pm)
    .bind(now)
    .bind(now)
    .fetch_one(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(engineer))
}

pub async fn get_engineer(
    State(pool): State<DbPool>,
    Path(id): Path<Uuid>,
) -> Result<Json<Engineer>, (StatusCode, String)> {
    let engineer = sqlx::query_as::<_, Engineer>("SELECT * FROM engineers WHERE id = ?")
        .bind(id)
        .fetch_one(&pool)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => (StatusCode::NOT_FOUND, "Engineer not found".to_string()),
            _ => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
        })?;

    Ok(Json(engineer))
}

pub async fn update_engineer(
    State(pool): State<DbPool>,
    Path(id): Path<Uuid>,
    Json(payload): Json<CreateEngineer>,
) -> Result<Json<Engineer>, (StatusCode, String)> {
    let now = Utc::now();
    
    let engineer = sqlx::query_as::<_, Engineer>(
        r#"
        UPDATE engineers
        SET name = ?, specialization = ?, total_capacity = ?, ktlo_tax = ?, is_pm = ?, updated_at = ?
        WHERE id = ?
        RETURNING *
        "#,
    )
    .bind(&payload.name)
    .bind(&payload.specialization)
    .bind(payload.total_capacity)
    .bind(payload.ktlo_tax)
    .bind(payload.is_pm)
    .bind(now)
    .bind(id)
    .fetch_one(&pool)
    .await
    .map_err(|e| match e {
        sqlx::Error::RowNotFound => (StatusCode::NOT_FOUND, "Engineer not found".to_string()),
        _ => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
    })?;

    Ok(Json(engineer))
}

pub async fn delete_engineer(
    State(pool): State<DbPool>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    let result = sqlx::query("DELETE FROM engineers WHERE id = ?")
        .bind(id)
        .execute(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if result.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, "Engineer not found".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}

// ============================================================================
// Project Routes
// ============================================================================

pub async fn list_projects(
    State(pool): State<DbPool>,
    Query(filters): Query<ProjectFilters>,
) -> Result<Json<Vec<Project>>, (StatusCode, String)> {
    let mut query = "SELECT * FROM projects WHERE archived_at IS NULL".to_string();
    
    if let Some(ref status) = filters.status {
        query.push_str(&format!(" AND workflow_status = '{}'", status));
    }
    if let Some(ref priority) = filters.priority {
        query.push_str(&format!(" AND priority = '{}'", priority));
    }
    if let Some(ref owner_id) = filters.owner_id {
        query.push_str(&format!(" AND owner_id = '{}'", owner_id));
    }
    
    query.push_str(" ORDER BY priority ASC, name ASC");

    let projects = sqlx::query_as::<_, Project>(&query)
        .fetch_all(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(projects))
}

pub async fn create_project(
    State(pool): State<DbPool>,
    Json(payload): Json<CreateProject>,
) -> Result<Json<Project>, (StatusCode, String)> {
    let id = Uuid::new_v4();
    let now = Utc::now();
    
    let project = sqlx::query_as::<_, Project>(
        r#"
        INSERT INTO projects (id, name, description, business_justification, priority, workflow_status, project_type, size, owner_id, sponsor_id, start_date, target_end_date, apptio_project_id, budget_code, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(&payload.name)
    .bind(&payload.description)
    .bind(&payload.business_justification)
    .bind(&payload.priority)
    .bind(&payload.workflow_status)
    .bind(&payload.project_type)
    .bind(&payload.size)
    .bind(&payload.owner_id)
    .bind(&payload.sponsor_id)
    .bind(&payload.start_date)
    .bind(&payload.target_end_date)
    .bind(&payload.apptio_project_id)
    .bind(&payload.budget_code)
    .bind(now)
    .bind(now)
    .fetch_one(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(project))
}

pub async fn get_project(
    State(pool): State<DbPool>,
    Path(id): Path<Uuid>,
) -> Result<Json<Project>, (StatusCode, String)> {
    let project = sqlx::query_as::<_, Project>("SELECT * FROM projects WHERE id = ?")
        .bind(id)
        .fetch_one(&pool)
        .await
        .map_err(|e| match e {
            sqlx::Error::RowNotFound => (StatusCode::NOT_FOUND, "Project not found".to_string()),
            _ => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
        })?;

    Ok(Json(project))
}

pub async fn update_project(
    State(pool): State<DbPool>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateProject>,
) -> Result<Json<Project>, (StatusCode, String)> {
    let now = Utc::now();
    
    // Use COALESCE to handle partial updates - if a field is None (NULL), the existing value is preserved
    let project = sqlx::query_as::<_, Project>(
        r#"
        UPDATE projects
        SET 
            updated_at = ?,
            name = COALESCE(?, name),
            description = COALESCE(?, description),
            business_justification = COALESCE(?, business_justification),
            priority = COALESCE(?, priority),
            workflow_status = COALESCE(?, workflow_status),
            rag_status = COALESCE(?, rag_status),
            project_type = COALESCE(?, project_type),
            size = COALESCE(?, size),
            owner_id = COALESCE(?, owner_id),
            sponsor_id = COALESCE(?, sponsor_id),
            start_date = COALESCE(?, start_date),
            target_end_date = COALESCE(?, target_end_date),
            actual_end_date = COALESCE(?, actual_end_date),
            percent_complete = COALESCE(?, percent_complete),
            apptio_project_id = COALESCE(?, apptio_project_id),
            budget_code = COALESCE(?, budget_code)
        WHERE id = ?
        RETURNING *
        "#,
    )
    .bind(now)
    .bind(&payload.name)
    .bind(&payload.description)
    .bind(&payload.business_justification)
    .bind(&payload.priority)
    .bind(&payload.workflow_status)
    .bind(&payload.rag_status)
    .bind(&payload.project_type)
    .bind(&payload.size)
    .bind(&payload.owner_id)
    .bind(&payload.sponsor_id)
    .bind(&payload.start_date)
    .bind(&payload.target_end_date)
    .bind(&payload.actual_end_date)
    .bind(&payload.percent_complete)
    .bind(&payload.apptio_project_id)
    .bind(&payload.budget_code)
    .bind(id)
    .fetch_one(&pool)
    .await
    .map_err(|e| match e {
        sqlx::Error::RowNotFound => (StatusCode::NOT_FOUND, "Project not found".to_string()),
        _ => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
    })?;

    Ok(Json(project))
}

pub async fn delete_project(
    State(pool): State<DbPool>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    let now = Utc::now();
    
    // Soft delete by setting archived_at
    let result = sqlx::query("UPDATE projects SET archived_at = ? WHERE id = ?")
        .bind(now)
        .bind(id)
        .execute(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if result.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, "Project not found".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}

// ============================================================================
// Allocation Routes
// ============================================================================

#[derive(Debug, serde::Serialize, sqlx::FromRow)]
pub struct AllocationView {
    pub id: Uuid,
    pub project_name: String,
    pub role_required: String,
    pub hours_per_week: i32,
}

pub async fn list_engineer_allocations(
    State(pool): State<DbPool>,
    Path(engineer_id): Path<Uuid>,
) -> Result<Json<Vec<AllocationView>>, (StatusCode, String)> {
    let allocations = sqlx::query_as::<_, AllocationView>(
        "SELECT pa.id, p.name as project_name, pa.role_required, pa.hours_per_week 
         FROM project_allocations pa 
         JOIN projects p ON pa.project_id = p.id 
         WHERE pa.engineer_id = ? AND pa.status != 'Removed'"
    )
    .bind(engineer_id)
    .fetch_all(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(allocations))
}

pub async fn create_allocation(
    State(pool): State<DbPool>,
    Json(payload): Json<CreateAllocation>,
) -> Result<Json<ProjectAllocation>, (StatusCode, String)> {
    let id = Uuid::new_v4();
    let now = Utc::now();
    
    let allocation = sqlx::query_as::<_, ProjectAllocation>(
        r#"
        INSERT INTO project_allocations (id, project_id, engineer_id, role_required, hours_per_week, allocation_type, start_week, end_week, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(&payload.project_id)
    .bind(&payload.engineer_id)
    .bind(&payload.role_required)
    .bind(payload.hours_per_week)
    .bind(&payload.allocation_type)
    .bind(&payload.start_week)
    .bind(&payload.end_week)
    .bind(now)
    .bind(now)
    .fetch_one(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(allocation))
}

pub async fn list_engineer_allocations(
    State(pool): State<DbPool>,
    Path(engineer_id): Path<Uuid>,
) -> Result<Json<Vec<ProjectAllocation>>, (StatusCode, String)> {
    let allocations = sqlx::query_as::<_, ProjectAllocation>(
        "SELECT * FROM project_allocations WHERE engineer_id = ? AND status != 'Removed'"
    )
    .bind(engineer_id)
    .fetch_all(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(allocations))
}

// ============================================================================
// Health Note Routes
// ============================================================================

pub async fn list_health_notes(
    State(pool): State<DbPool>,
    Path(project_id): Path<Uuid>,
) -> Result<Json<Vec<HealthNote>>, (StatusCode, String)> {
    let notes = sqlx::query_as::<_, HealthNote>(
        "SELECT * FROM health_notes WHERE project_id = ? ORDER BY created_at DESC"
    )
    .bind(project_id)
    .fetch_all(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(notes))
}

pub async fn create_health_note(
    State(pool): State<DbPool>,
    Json(payload): Json<CreateHealthNote>,
) -> Result<Json<HealthNote>, (StatusCode, String)> {
    let id = Uuid::new_v4();
    let now = Utc::now();
    
    // Create the health note
    let note = sqlx::query_as::<_, HealthNote>(
        r#"
        INSERT INTO health_notes (id, project_id, author_id, rag_status, content, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(&payload.project_id)
    .bind(&payload.author_id)
    .bind(&payload.rag_status)
    .bind(&payload.content)
    .bind(now)
    .fetch_one(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Update project's RAG status to match latest health note
    sqlx::query("UPDATE projects SET rag_status = ?, updated_at = ? WHERE id = ?")
        .bind(&payload.rag_status)
        .bind(now)
        .bind(&payload.project_id)
        .execute(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(note))
}

// ============================================================================
// Scenario Routes
// ============================================================================

pub async fn list_scenarios(
    State(pool): State<DbPool>,
) -> Result<Json<Vec<Scenario>>, (StatusCode, String)> {
    let scenarios = sqlx::query_as::<_, Scenario>("SELECT * FROM scenarios ORDER BY created_at DESC")
        .fetch_all(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(scenarios))
}

pub async fn clone_scenario(
    State(pool): State<DbPool>,
    Json(payload): Json<CreateScenario>,
) -> Result<Json<Scenario>, (StatusCode, String)> {
    let id = Uuid::new_v4();
    let now = Utc::now();

    // 1. Create the Scenario Record
    let scenario = sqlx::query_as::<_, Scenario>(
        r#"
        INSERT INTO scenarios (id, name, description, created_by, created_at)
        VALUES (?, ?, ?, ?, ?)
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(&payload.name)
    .bind(&payload.description)
    .bind(&payload.created_by)
    .bind(now)
    .fetch_one(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // 2. Clone all "Live" allocations (scenario_id IS NULL) into this new scenario
    // We select existing, generate new IDs, set scenario_id, and insert back
    let rows_affected = sqlx::query(
        r#"
        INSERT INTO project_allocations (id, project_id, engineer_id, role_required, hours_per_week, allocation_type, start_week, end_week, status, feedback_status, created_at, updated_at, scenario_id)
        SELECT randomblob(16), project_id, engineer_id, role_required, hours_per_week, allocation_type, start_week, end_week, status, feedback_status, datetime('now'), datetime('now'), ?
        FROM project_allocations
        WHERE scenario_id IS NULL
        "#
    )
    .bind(id)
    .execute(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .rows_affected();

    println!("Cloned {} allocations into Scenario '{}'", rows_affected, payload.name);

    Ok(Json(scenario))
}


// ============================================================================
// Utility Routes
// ============================================================================

pub async fn health_check() -> impl IntoResponse {
    Json(serde_json::json!({ "status": "healthy" }))
}

pub async fn root() -> impl IntoResponse {
    Json(serde_json::json!({ 
        "message": "Network Resource Manager API (Rust) is running",
        "version": "2.0.0",
        "endpoints": {
            "engineers": "/api/engineers",
            "projects": "/api/projects",
            "allocations": "/api/projects/:id/allocations",
            "health_notes": "/api/projects/:id/health-notes"
        }
    }))
}
