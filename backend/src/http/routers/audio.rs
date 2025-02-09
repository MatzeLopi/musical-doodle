use crate::{
    crud::audio,
    http::{dependencies, error::Error as HTTPError, utils, AppState},
    schemas::audios::{
        Audio, UpdateCategory, UpdateDescription, UpdateTags, UpdateTitle, UploadAudio,
    },
};
use axum::{
    extract::{Json, Multipart, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{delete, get, post, Router},
};
use std::{
    path::{Path, PathBuf},
    sync::Arc,
};
use tempfile::NamedTempFile;
use tokio::{fs::File, io::AsyncWriteExt};
use uuid::Uuid;

use tokio::task::spawn_blocking;

pub fn router(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/sound/my_audios", get(get_my_audios))
        .route("/sound/{username}", get(get_audio))
        .route("/sound/upload", post(upload))
        .route("/sound/delete/", delete(delete_audio))
        .route("/sound/update/set_private", post(set_private))
        .route("/sound/update/set_public", post(set_public))
        .route("/sound/update/description", post(update_description))
        .route("/sound/update/title", post(update_title))
        .route("/sound/tags", get(get_tags))
        .route("/sound/tags/create", post(create_tag))
        .route("/sound/categories", get(get_categories))
        .route("/sound/categories/create", post(create_category))
        .with_state(state)
}

async fn get_tags(State(state): State<Arc<AppState>>) -> Result<impl IntoResponse, HTTPError> {
    let tags = audio::get_tags(&state.db).await;
    match tags {
        Ok(tags) => Ok((StatusCode::OK, Json(tags))),
        Err(e) => Err(e),
    }
}
async fn create_tag(
    State(state): State<Arc<AppState>>,
    Json(tag): Json<String>,
) -> Result<impl IntoResponse, HTTPError> {
    // Create a new tag
    audio::create_tag(&state.db, tag).await?;
    Ok(StatusCode::CREATED)
}

async fn get_categories(
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, HTTPError> {
    let categories = audio::get_categories(&state.db).await;
    match categories {
        Ok(categories) => Ok((StatusCode::OK, Json(categories))),
        Err(e) => Err(e),
    }
}

async fn create_category(
    State(state): State<Arc<AppState>>,
    Json(category): Json<String>,
) -> Result<impl IntoResponse, HTTPError> {
    // Create a new category
    audio::create_category(&state.db, category).await?;
    Ok(StatusCode::CREATED)
}

async fn to_backblaze(file_path: &Path) -> Result<String, HTTPError> {
    let client = Client::new();

    todo!()
}

async fn upload(
    State(state): State<Arc<AppState>>,
    auth_user: dependencies::AuthUser,
    mut file: Multipart,
) -> Result<impl IntoResponse, HTTPError> {
    // Get full file
    let mut temp_file = NamedTempFile::new().map_err(|_| HTTPError::InternalServerError)?;
    let mut maybe_metadata: Option<UploadAudio> = None;
    let mut file_name = String::new();

    while let Some(mut field) = file
        .next_field()
        .await
        .map_err(|_| HTTPError::InternalServerError)?
    {
        if let Some(name) = field.name() {
            if name == "metadata" {
                let metadata_bytes = field
                    .bytes()
                    .await
                    .map_err(|_| HTTPError::InternalServerError)?;
                maybe_metadata =
                    serde_json::from_slice(&metadata_bytes).map_err(|_| HTTPError::BadRequest)?;
            } else if name == "file" {
                file_name = field
                    .file_name()
                    .map(|s| s.to_string())
                    .unwrap_or_else(|| "audio.mp3".to_string());
                let save_path = PathBuf::from(format!("/path/to/storage/{file_name}"));
                let mut file_writer = File::create(&save_path)
                    .await
                    .map_err(|_| HTTPError::InternalServerError)?;

                while let Some(chunk) = field
                    .chunk()
                    .await
                    .map_err(|_| HTTPError::InternalServerError)?
                {
                    file_writer
                        .write_all(&chunk)
                        .await
                        .map_err(|_| HTTPError::InternalServerError)?;
                }
            }
        }
    }
    let metadata = maybe_metadata.ok_or(HTTPError::BadRequest)?;

    // Convert file to AAC LC format
    let aac_lc_file = spawn_blocking(move || utils::to_aa_lc(&temp_file.path()))
        .await
        .map_err(|_| HTTPError::InternalServerError)??;

    // Upload file to B2 Backblaze
    let file_loc = to_backblaze(&Path::new(&aac_lc_file)).await?;

    // Save to database
    let audio_file = Audio {
        id: Uuid::new_v4(),
        title: metadata.title,
        creator: auth_user.user_id,
        description: metadata.description,
        audio_url: file_loc,
        private: metadata.private,
        category: metadata.category,
        tags: metadata.tags,
    };
    audio::upload(&state.db, &audio_file).await?;

    Ok((StatusCode::CREATED, Json(audio_file)))
}

async fn set_private(
    State(state): State<Arc<AppState>>,
    auth_user: dependencies::AuthUser,
    Json(audio_id): Json<Uuid>,
) -> Result<impl IntoResponse, HTTPError> {
    // Set audio file to private
    audio::set_private(&state.db, audio_id, auth_user.user_id).await?;
    log::debug!("Set audio to private");
    Ok(StatusCode::NO_CONTENT)
}

async fn set_public(
    State(state): State<Arc<AppState>>,
    auth_user: dependencies::AuthUser,
    Json(audio_id): Json<Uuid>,
) -> Result<impl IntoResponse, HTTPError> {
    // Set audio file to public
    audio::set_public(&state.db, audio_id, auth_user.user_id).await?;
    log::debug!("Set audio to public");
    Ok(StatusCode::NO_CONTENT)
}

async fn update_description(
    State(state): State<Arc<AppState>>,
    auth_user: dependencies::AuthUser,
    Json(data): Json<UpdateDescription>,
) -> Result<impl IntoResponse, HTTPError> {
    // Update audio file description
    audio::update_description(&state.db, data.id, auth_user.user_id, data.description).await?;
    log::debug!("Updated audio description");
    Ok(StatusCode::NO_CONTENT)
}

async fn update_title(
    State(state): State<Arc<AppState>>,
    auth_user: dependencies::AuthUser,
    Json(data): Json<UpdateTitle>,
) -> Result<impl IntoResponse, HTTPError> {
    // Update audio file title
    audio::update_title(&state.db, data.id, auth_user.user_id, data.title).await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn update_category(
    State(state): State<Arc<AppState>>,
    auth_user: dependencies::AuthUser,
    Json(data): Json<UpdateCategory>,
) -> Result<impl IntoResponse, HTTPError> {
    // Update audio file category
    todo!();
    Ok(StatusCode::NO_CONTENT)
}

async fn update_tags(
    State(state): State<Arc<AppState>>,
    auth_user: dependencies::AuthUser,
    Json(data): Json<UpdateTags>,
) -> Result<impl IntoResponse, HTTPError> {
    // Update audio file tags
    todo!();
    Ok(StatusCode::NO_CONTENT)
}

async fn delete_audio(
    State(state): State<Arc<AppState>>,
    auth_user: dependencies::AuthUser,
    Json(audio_id): Json<Uuid>,
) -> Result<impl IntoResponse, HTTPError> {
    // Delete audio file from the server
    audio::delete(&state.db, audio_id, auth_user.user_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn get_audio(
    State(state): State<Arc<AppState>>,
    username: String,
) -> Result<impl IntoResponse, HTTPError> {
    // Load audio files for a specific user from database
    let tracks = audio::get_audios(&state.db, username).await;
    match tracks {
        Ok(audios) => Ok((StatusCode::OK, Json(audios))),
        Err(e) => Err(e),
    }
}

async fn get_my_audios(
    State(state): State<Arc<AppState>>,
    auth_user: dependencies::AuthUser,
) -> Result<impl IntoResponse, HTTPError> {
    // Load audio files for the authenticated user from database
    let tracks = audio::get_my_audios(&state.db, auth_user.user_id).await;
    match tracks {
        Ok(audios) => Ok((StatusCode::OK, Json(audios))),
        Err(e) => Err(e),
    }
}
