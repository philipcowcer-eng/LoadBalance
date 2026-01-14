mod db;
mod models;
mod routes;

use axum::{
    routing::{get, post, put, delete},
    Router,
};
use tower_http::cors::{Any, CorsLayer};
use std::net::SocketAddr;

#[tokio::main]
async fn main() {
    // Database setup - create_if_missing will create the file if it doesn't exist
    let database_url = "sqlite:resource_manager.db?mode=rwc";
    let pool = db::create_pool(database_url)
        .await
        .expect("Failed to create database pool");

    // Run migrations
    db::run_migrations(&pool)
        .await
        .expect("Failed to run migrations");

    // Seed demo data (only if database is empty)
    if let Err(e) = db::seed_demo_data(&pool).await {
        eprintln!("Warning: Failed to seed demo data: {}", e);
    }

    // CORS configuration
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Build router with all endpoints
    let app = Router::new()
        // Root & Health
        .route("/", get(routes::root))
        .route("/health", get(routes::health_check))
        
        // Users
        .route("/api/users", get(routes::list_users))

        // Engineers (REST)
        .route("/api/engineers", get(routes::list_engineers))
        .route("/api/engineers", post(routes::create_engineer))
        .route("/api/engineers/:id", get(routes::get_engineer))
        .route("/api/engineers/:id", put(routes::update_engineer))
        .route("/api/engineers/:id", delete(routes::delete_engineer))
        
        // Projects (REST)
        .route("/api/projects", get(routes::list_projects))
        .route("/api/projects", post(routes::create_project))
        .route("/api/projects/:id", get(routes::get_project))
        .route("/api/projects/:id", put(routes::update_project))
        .route("/api/projects/:id", delete(routes::delete_project))
        
        // Project Allocations (nested)
        .route("/api/projects/:project_id/allocations", get(routes::list_project_allocations))
        .route("/api/allocations", post(routes::create_allocation))
        
        // Engineer Allocations (for My Week view)
        .route("/api/engineers/:engineer_id/allocations", get(routes::list_engineer_allocations))
        
        // Health Notes (nested)
        .route("/api/projects/:project_id/health-notes", get(routes::list_health_notes))
        .route("/api/health-notes", post(routes::create_health_note))
        
        // Scenarios
        .route("/api/scenarios", get(routes::list_scenarios))
        .route("/api/scenarios/clone", post(routes::clone_scenario))
        
        // Legacy routes (backward compatibility)
        .route("/engineers", get(routes::list_engineers))
        .route("/engineers", post(routes::create_engineer))
        .route("/engineers/:id", get(routes::get_engineer))
        .route("/engineers/:id", put(routes::update_engineer))
        .route("/projects", get(routes::list_projects))
        .route("/projects", post(routes::create_project))
        .route("/projects/:id", get(routes::get_project))
        .route("/projects/:id", put(routes::update_project))
        
        .layer(cors)
        .with_state(pool);

    // Start server
    let addr = SocketAddr::from(([127, 0, 0, 1], 8000));
    println!("🚀 Network Resource Manager API (Rust) v2.0 listening on {}", addr);
    println!("   Endpoints:");
    println!("   - GET  /api/engineers");
    println!("   - GET  /api/projects");
    println!("   - GET  /api/projects/:id/allocations");
    println!("   - GET  /api/projects/:id/health-notes");
    
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("Failed to bind to address");
    
    axum::serve(listener, app)
        .await
        .expect("Failed to start server");
}
