use sqlx::sqlite::{SqlitePool, SqlitePoolOptions};
use std::time::Duration;

pub type DbPool = SqlitePool;

pub async fn create_pool(database_url: &str) -> Result<DbPool, sqlx::Error> {
    SqlitePoolOptions::new()
        .max_connections(5)
        .acquire_timeout(Duration::from_secs(3))
        .connect(database_url)
        .await
}

pub async fn run_migrations(pool: &DbPool) -> Result<(), sqlx::Error> {
    // ========================================================================
    // Users table
    // ========================================================================
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS users (
            id BLOB PRIMARY KEY NOT NULL,
            email TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            role TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
        "#,
    )
    .execute(pool)
    .await?;

    // ========================================================================
    // Engineers table (extended)
    // ========================================================================
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS engineers (
            id BLOB PRIMARY KEY NOT NULL,
            user_id BLOB,
            name TEXT NOT NULL,
            employee_id TEXT UNIQUE,
            title TEXT,
            specialization TEXT,
            total_capacity INTEGER NOT NULL DEFAULT 40,
            ktlo_tax INTEGER NOT NULL DEFAULT 0,
            hire_date TEXT,
            manager_id BLOB,
            is_pm INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (manager_id) REFERENCES users(id)
        )
        "#,
    )
    .execute(pool)
    .await?;

    // ========================================================================
    // Projects table (extended)
    // ========================================================================
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS projects (
            id BLOB PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            business_justification TEXT,
            priority TEXT NOT NULL,
            workflow_status TEXT NOT NULL DEFAULT 'Draft',
            rag_status TEXT NOT NULL DEFAULT 'Green',
            project_type TEXT,
            size TEXT,
            owner_id BLOB,
            sponsor_id BLOB,
            start_date TEXT,
            target_end_date TEXT,
            actual_end_date TEXT,
            percent_complete INTEGER NOT NULL DEFAULT 0,
            apptio_project_id TEXT,
            budget_code TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            archived_at TEXT,
            FOREIGN KEY (owner_id) REFERENCES users(id),
            FOREIGN KEY (sponsor_id) REFERENCES users(id)
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Create indexes for projects
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_projects_workflow_status ON projects(workflow_status)")
        .execute(pool)
        .await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority)")
        .execute(pool)
        .await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id)")
        .execute(pool)
        .await?;

    // ========================================================================
    // Project Allocations table
    // ========================================================================
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS scenarios (
            id BLOB PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            created_by BLOB NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (created_by) REFERENCES users(id)
        )
        "#,
    )
    .execute(pool)
    .await?;

    // ========================================================================
    // Project Allocations table
    // ========================================================================
    // DROP TABLE to ensure schema update (Development Mode Only)
    sqlx::query("DROP TABLE IF EXISTS project_allocations").execute(pool).await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS project_allocations (
            id BLOB PRIMARY KEY NOT NULL,
            project_id BLOB NOT NULL,
            engineer_id BLOB NOT NULL,
            role_required TEXT NOT NULL,
            hours_per_week INTEGER NOT NULL,
            allocation_type TEXT NOT NULL DEFAULT 'Engineering',
            start_week TEXT,
            end_week TEXT,
            status TEXT NOT NULL DEFAULT 'Active',
            feedback_status TEXT NOT NULL DEFAULT 'None',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            scenario_id BLOB,
            FOREIGN KEY (project_id) REFERENCES projects(id),
            FOREIGN KEY (engineer_id) REFERENCES engineers(id),
            FOREIGN KEY (scenario_id) REFERENCES scenarios(id)
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Create unique constraint for allocations (scoped to scenario if present)
    // For SQLite, (A,B,NULL) != (A,B,NULL) in unique constraints, so we need partial indexes or careful handling.
    // Index for LIVE allocations (where scenario_id IS NULL)
    sqlx::query("CREATE UNIQUE INDEX IF NOT EXISTS idx_allocation_live_unique ON project_allocations(project_id, engineer_id, start_week) WHERE scenario_id IS NULL")
        .execute(pool)
        .await?;

    // Index for SCENARIO allocations
    sqlx::query("CREATE UNIQUE INDEX IF NOT EXISTS idx_allocation_scenario_unique ON project_allocations(project_id, engineer_id, start_week, scenario_id) WHERE scenario_id IS NOT NULL")
        .execute(pool)
        .await?;

    // ========================================================================
    // Health Notes table
    // ========================================================================
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS health_notes (
            id BLOB PRIMARY KEY NOT NULL,
            project_id BLOB NOT NULL,
            author_id BLOB NOT NULL,
            rag_status TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (project_id) REFERENCES projects(id),
            FOREIGN KEY (author_id) REFERENCES users(id)
        )
        "#,
    )
    .execute(pool)
    .await?;

    // ========================================================================
    // Impact Logs table
    // ========================================================================
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS impact_logs (
            id BLOB PRIMARY KEY NOT NULL,
            project_id BLOB NOT NULL,
            event_type TEXT NOT NULL,
            description TEXT NOT NULL,
            old_value TEXT,
            new_value TEXT,
            triggered_by BLOB,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (project_id) REFERENCES projects(id),
            FOREIGN KEY (triggered_by) REFERENCES users(id)
        )
        "#,
    )
    .execute(pool)
    .await?;

    // ========================================================================
    // Milestones table
    // ========================================================================
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS milestones (
            id BLOB PRIMARY KEY NOT NULL,
            project_id BLOB NOT NULL,
            name TEXT NOT NULL,
            target_date TEXT NOT NULL,
            actual_date TEXT,
            status TEXT NOT NULL DEFAULT 'Not Started',
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (project_id) REFERENCES projects(id)
        )
        "#,
    )
    .execute(pool)
    .await?;

    // ========================================================================
    // Project Dependencies table
    // ========================================================================
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS project_dependencies (
            id BLOB PRIMARY KEY NOT NULL,
            project_id BLOB NOT NULL,
            depends_on_id BLOB NOT NULL,
            dependency_type TEXT NOT NULL,
            notes TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (project_id) REFERENCES projects(id),
            FOREIGN KEY (depends_on_id) REFERENCES projects(id)
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Create unique constraint for dependencies
    sqlx::query("CREATE UNIQUE INDEX IF NOT EXISTS idx_dependency_unique ON project_dependencies(project_id, depends_on_id)")
        .execute(pool)
        .await?;

    // ========================================================================
    // Legacy allocations table (keep for backward compatibility)
    // ========================================================================
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS allocations (
            id BLOB PRIMARY KEY NOT NULL,
            engineer_id BLOB,
            project_id BLOB NOT NULL,
            category TEXT NOT NULL,
            day TEXT NOT NULL,
            hours INTEGER NOT NULL,
            feedback_status TEXT NOT NULL DEFAULT 'None',
            FOREIGN KEY (engineer_id) REFERENCES engineers(id),
            FOREIGN KEY (project_id) REFERENCES projects(id)
        )
        "#,
    )
    .execute(pool)
    .await?;

    Ok(())
}

/// Seed initial data for development/testing
pub async fn seed_demo_data(pool: &DbPool) -> Result<(), sqlx::Error> {
    use uuid::Uuid;

    // Check if we already have data
    let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM users")
        .fetch_one(pool)
        .await?;
    
    if count.0 > 0 {
        return Ok(()); // Already seeded
    }

    // Create demo users
    let admin_id = Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap();
    let rm_id = Uuid::new_v4();
    let pm_id = Uuid::new_v4();

    sqlx::query(
        "INSERT INTO users (id, email, name, role) VALUES (?, ?, ?, ?)"
    )
    .bind(admin_id)
    .bind("admin@network.local")
    .bind("System Admin")
    .bind("Admin")
    .execute(pool)
    .await?;

    sqlx::query(
        "INSERT INTO users (id, email, name, role) VALUES (?, ?, ?, ?)"
    )
    .bind(rm_id)
    .bind("resource.manager@network.local")
    .bind("Resource Manager")
    .bind("Resource Manager")
    .execute(pool)
    .await?;

    sqlx::query(
        "INSERT INTO users (id, email, name, role) VALUES (?, ?, ?, ?)"
    )
    .bind(pm_id)
    .bind("pm@network.local")
    .bind("Alex Rivera")
    .bind("Project Manager")
    .execute(pool)
    .await?;

    // Create demo engineers
    let engineers = vec![
        ("Sarah Chen", "Routing & Switching", 40, 8, true),
        ("Mike Davis", "Firewall", 40, 0, false),
        ("R. Patel", "NOC Operations", 40, 20, false),
        ("J. Kim", "Wireless", 40, 4, false),
    ];

    for (name, spec, cap, ktlo, is_pm) in engineers {
        let id = Uuid::new_v4();
        let initials: String = name.split_whitespace()
            .map(|w| w.chars().next().unwrap())
            .collect();
        
        sqlx::query(
            "INSERT INTO engineers (id, name, specialization, total_capacity, ktlo_tax, is_pm) VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind(id)
        .bind(name)
        .bind(spec)
        .bind(cap)
        .bind(ktlo)
        .bind(is_pm)
        .execute(pool)
        .await?;
    }

    // Create demo projects
    let projects = vec![
        ("Core Router Refresh", "P1", "Active", "L"),
        ("SD-WAN Migration", "P2", "Active", "L"),
        ("Automation Scripting", "P2", "Approved", "M"),
        ("Wireless Upgrade", "P3", "Draft", "M"),
        ("Documentation Revamp", "P4", "Active", "S"),
    ];

    for (name, priority, status, size) in projects {
        let id = Uuid::new_v4();
        sqlx::query(
            "INSERT INTO projects (id, name, priority, workflow_status, size, owner_id) VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind(id)
        .bind(name)
        .bind(priority)
        .bind(status)
        .bind(size)
        .bind(pm_id)
        .execute(pool)
        .await?;
    }

    Ok(())
}
