// Router for auth and csrf token generation

use axum::http::{header::SET_COOKIE, HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{get, Router};
use rand::{distributions::Alphanumeric, Rng};
use std::time::Duration;

pub fn router() -> Router {
    Router::new()
        .route("/", get(ok))
        .route("/csft", get(get_csfr))
}

async fn ok() -> String {
    "ok".to_string()
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
