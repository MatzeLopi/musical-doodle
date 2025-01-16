use crate::config::Config;
use anyhow::Context;
use axum::Router;
use sqlx::PgPool;
use std::sync::Arc;

// Include auth router
mod auth;

#[derive(Clone)]
struct AppState {
    config: Arc<Config>,
    db: PgPool,
}

pub async fn serve(config: Config, db: PgPool) -> anyhow::Result<()> {
    // Create shared state
    let shared_state = Arc::new(AppState {
        config: Arc::new(config),
        db,
    });

    // Build the app router
    let app = Router::new().with_state(shared_state);
    let app = api_router(app);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();

    // Start the server using the listener
    axum::serve(listener, app)
        .await
        .context("Error running the server")
}

// Define the API router
fn api_router(router: Router) -> Router {
    return router.merge(auth::router()); // Add routes from the `auth` module
}
