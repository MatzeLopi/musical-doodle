use crate::{
    crud,
    http::{dependencies, error::Error as HTTPError, AppState},
};
use axum::{
    response::IntoResponse,
    routing::{delete, get, post, Router},
};
use std::sync::Arc;

pub fn router(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/plays/add", post(add_play))
        .route("/plays/get", get(get_plays))
        .route("/plays/most", get(most_played))
        .with_state(state)
}

async fn add_play() -> Result<impl IntoResponse, HTTPError> {
    todo!("");
}
async fn get_plays() -> Result<impl IntoResponse, HTTPError> {
    todo!("");
}

async fn most_played() -> Result<impl IntoResponse, HTTPError> {
    todo!("");
}
