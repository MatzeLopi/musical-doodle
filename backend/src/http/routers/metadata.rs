use crate::{
    crud::{self},
    http::{error::Error as HTTPError, AppState},
    schemas,
};
use axum::{
    extract::{Json, Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post, Router},
};
use std::sync::Arc;
use uuid::Uuid;

pub fn router(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/plays/add", post(add_play))
        .route("/plays/get", get(get_plays))
        .route("/plays/most", get(most_played))
        .with_state(state)
}

async fn add_play(
    State(state): State<Arc<AppState>>,
    Json(track_id): Json<Uuid>,
) -> Result<impl IntoResponse, HTTPError> {
    crud::metadata::add_play(&state.db, track_id).await?;
    Ok(StatusCode::NO_CONTENT)
}
async fn get_plays(
    State(state): State<Arc<AppState>>,
    Query(track_id): Query<Uuid>,
) -> Result<impl IntoResponse, HTTPError> {
    let result = crud::metadata::get_plays(&state.db, track_id).await?;
    Ok((StatusCode::OK, Json(result)))
}

async fn most_played(
    State(state): State<Arc<AppState>>,
    Query(params): Query<schemas::metadata::MetaDataQuery>,
) -> Result<impl IntoResponse, HTTPError> {
    let most_plays =
        crud::metadata::get_most_played(&state.db, params.interval, params.limit).await?;

    Ok((StatusCode::OK, Json(most_plays)))
}
