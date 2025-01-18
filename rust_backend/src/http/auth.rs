// Router for auth and csrf token generation
use crate::http::dependencies;
use crate::http::AppState;
use axum::extract::Request;
use axum::http::{header::SET_COOKIE, HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{get, Router};
use rand::{distributions::Alphanumeric, Rng};
use std::sync::Arc;
use std::time::Duration;
use serde_json::json;
use crate::http::dependencies::{Token, TokenType};

pub fn router(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/", get(ok))
        .route("/csft", get(get_csfr))
        .with_state(state)
}

async fn ok() -> impl IntoResponse {
    (
        StatusCode::OK,
        axum::Json(json!({ "status": "ok" })),
    )
}

async fn access_token(req: Request) -> Token {
    dependencies::validate_csrf(&req).await;
    return Token {
        access_token: "access_token".to_string(),
        token_type: TokenType::Bearer,
    };
}

async fn get_csfr() -> impl IntoResponse {
    // Generate a random token
    let csrf_token: String = rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(20)
        .map(char::from)
        .collect();

    // Cookie
    let cookie: String = format!(
        "csrf_token={}; HttpOnly; Secure; SameSite=Strict; Max-Age={}",
        csrf_token,
        Duration::from_secs(60 * 60 * 24).as_secs() // 1 day
    );

    let mut headers: HeaderMap = HeaderMap::new();
    headers.insert(SET_COOKIE, cookie.parse().unwrap());

    return (
        StatusCode::OK,
        headers,
        format!(r#"{{"csrf_token": "{}"}}"#, csrf_token),
    );
}
