use crate::{crud::audio,http::{dependencies, error::Error as HTTPError, utils, AppState}, schemas::audios::{Audio, UploadAudio}};
use axum::{routing::{Router,get,post,delete}, extract::{State, Json, Multipart}, response::IntoResponse, http::StatusCode};
use std::{sync::Arc, path::PathBuf};
use uuid::Uuid;
use tokio::{fs::File, io::AsyncWriteExt};
use tempfile::NamedTempFile;

use tokio::task::spawn_blocking;

pub fn router(state: Arc<AppState>) -> Router {
    Router::new()
    .route("/sound/my_audios", get(get_my_audios))
    .route("/sound/:username", get(get_audio))
    .route("/sound/upload", post(upload))
    .route("/sound/delete/", delete(delete_audio))
    .route("/sound/update/set_private", post(set_private))
    .route("/sound/update/set_public", post(set_public))
    .route("/sound/update/description", post(update_description))
    .route("/sound/update/title", post(update_title))
    .with_state(state)
}

async fn upload(State(state): State<Arc<AppState>>, auth_user:dependencies::AuthUser, mut file:Multipart) -> Result<impl IntoResponse, HTTPError> {
    // Get full file
    let mut temp_file = NamedTempFile::new().map_err(|e| HTTPError::InternalServerError)?;
    let metadata:Option<UploadAudio> = None;
    let mut file_name = String::new();

    while let Some(mut field) = file.next_field().await.map_err(|_| HTTPError::InternalServerError)? {
        if let Some(name) = field.name() {
            if name == "metadata" {
                let metadata_bytes = field.bytes().await.map_err(|_| HTTPError::InternalServerError)?;
                metadata = serde_json::from_slice(&metadata_bytes).map_err(|_| HTTPError::BadRequest)?;
            } else if name == "file" {
                file_name = field.file_name().map(|s| s.to_string()).unwrap_or_else(|| "audio.mp3".to_string());
                let save_path = PathBuf::from(format!("/path/to/storage/{file_name}"));
                let mut file_writer = File::create(&save_path).await.map_err(|_| HTTPError::InternalServerError)?;
                
                while let Some(chunk) = field.chunk().await.map_err(|_| HTTPError::InternalServerError)? {
                    file_writer.write_all(&chunk).await.map_err(|_| HTTPError::InternalServerError)?;
                }
            }
        }
        
    }
    let metadata = metadata.ok_or(HTTPError::BadRequest)?;

    // Save file to disk


    // Convert file to AAC LC format
    let aac_lc_file = spawn_blocking(move || {
        utils::to_aa_lc(&temp_file.path())
    }).await;

    match aac_lc_file {
        Ok(aac_lc_file) => {
            {
                // Upload file to S3

                let file_loc = "https://s3.amazonaws.com/bucket-name/".to_string() + &file_name;

                // Save to database
                let audio = Audio {
                    Uuid::new_v4(),
                    metadata.title,
                    auth_user.user_id,
                    metadata.description,
                    file_loc,
                    metadata.private,
                    metadata.category,
                    metadata.tags,
                };
            }
            Ok((StatusCode::CREATED, Json(audio)))
        },
        Err(_) => Err(HTTPError::InternalServerError),
    }

}

async fn set_private(State(state) : State<Arc<AppState>>, auth_user:dependencies::AuthUser, Json(audio_id): Json<Uuid>) -> Result<impl IntoResponse, HTTPError> {
    // Set audio file to private
    audio::set_private(&state.db, audio_id, auth_user.user_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn set_public(State(state) : State<Arc<AppState>>, auth_user:dependencies::AuthUser, Json(audio_id): Json<Uuid>) -> Result<impl IntoResponse, HTTPError> {
    // Set audio file to public
    audio::set_public(&state.db, audio_id, auth_user.user_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn update_description(State(state) : State<Arc<AppState>>, auth_user:dependencies::AuthUser, Json(data): Json<Audio>) -> Result<impl IntoResponse, HTTPError> {
    // Update audio file description
    audio::update_description(&state.db, data.id, auth_user.user_id, data.description).await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn update_title(State(state) : State<Arc<AppState>>, auth_user:dependencies::AuthUser, Json(data): Json<Audio>) -> Result<impl IntoResponse, HTTPError> {
    // Update audio file title
    audio::update_title(&state.db, data.id, auth_user.user_id, data.title).await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn delete_audio(State(state) : State<Arc<AppState>>, auth_user:dependencies::AuthUser, Json(audio_id): Json<Uuid>) -> Result<impl IntoResponse, HTTPError> {
    // Delete audio file from the server
    audio::delete(&state.db, audio_id, auth_user.user_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn get_audio(State(state): State<Arc<AppState>>, username: String) -> Result<impl IntoResponse, HTTPError> {
    // Load audio files for a specific user from database
    let tracks = audio::get_audios(&state.db, username).await;
    match tracks {
        Ok(audios) => Ok((StatusCode::OK, Json(audios))),
        Err(e) => Err(e),
    }
}

async fn get_my_audios(State(state): State<Arc<AppState>>, auth_user:dependencies::AuthUser) -> Result<impl IntoResponse, HTTPError> {
    // Load audio files for the authenticated user from database
    let tracks = audio::get_my_audios(&state.db, auth_user.user_id).await;
    match tracks {
        Ok(audios) => Ok((StatusCode::OK, Json(audios))),
        Err(e) => Err(e),
    }
}