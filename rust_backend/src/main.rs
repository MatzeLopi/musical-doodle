use axum::extract::Request;
use axum::http::{header::SET_COOKIE, HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{get, Router};
use rand::{distributions::Alphanumeric, Rng}; // 0.8
use std::time::Duration;

async fn test1() -> String {
    return String::from("Hello, World!");
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

async fn validate_csfr(request: Request) -> bool {
    // Get the cookie
    let client_token = request.headers().get("X-CSRF-TOKEN").unwrap();
    let server_token = request.headers().get("csfr_token").unwrap();

    if client_token != server_token {
        return false;
    } else {
        return true;
    }
}

#[tokio::main]
async fn main() {
    // build our application with a single route
    let app: Router = Router::new()
        .route("/", get(test1))
        .route("/csft", get(get_csfr));

    // run our app with hyper, listening globally on port 8000
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
