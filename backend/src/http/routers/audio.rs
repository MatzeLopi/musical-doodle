use crate::{
    crud::audio,
    http::{dependencies, error::Error as HTTPError, utils, AppState},
    schemas::audios::{
        Audio, AudioUpload, Category, Tag, UpdateCategory, UpdateDescription, UpdateTags,
        UpdateTitle,
    },
};
use axum::{
    extract::{Json, Multipart, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{delete, get, post, Router},
};
use chrono::Datelike;
use s3::{bucket::Bucket, creds::Credentials, region::Region};
use std::{fs::create_dir_all, path::Path, sync::Arc};
use tokio::task::spawn_blocking;
use tokio::{
    fs::{remove_file, File},
    io::AsyncWriteExt,
};
use tokio_util::bytes::BytesMut;
use uuid::Uuid;

const UPLOAD_DIR: &str = "temp";

pub fn router(state: Arc<AppState>) -> Router {
    create_dir_all(UPLOAD_DIR).unwrap();
    Router::new()
        .route("/sound/my_audios", get(get_my_audios))
        .route("/sound/{username}", get(get_audio))
        .route("/sound/upload", post(upload))
        .route("/sound/delete/", delete(delete_audio))
        .route("/sound/update/set_private", post(set_private))
        .route("/sound/update/set_public", post(set_public))
        .route("/sound/update/description", post(update_description))
        .route("/sound/update/title", post(update_title))
        .route("/sound/update/tags", post(update_tags))
        .route("/sound/update/category", post(update_category))
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

async fn to_backblaze(
    file_path: &Path,
    state: &AppState,
    id: Uuid,
    s3_url: String,
) -> Result<(), HTTPError> {
    log::debug!("Uploading to backblaze...");
    let region = Region::Custom {
        region: state.config.s3_region.clone(),
        endpoint: state.config.s3_url.clone(),
    };

    log::debug!("Region: {:?}", region);

    audio::update_status(&state.db, id, audio::AudioStatus::Uploading).await?;
    let credentials = match Credentials::new(
        Some(&state.config.s3_access_key),
        Some(&state.config.s3_secret_key),
        None,
        None,
        None,
    ) {
        Ok(credentials) => credentials,
        Err(e) => {
            log::error!("Error creating credentials: {:?}", e);
            audio::update_status(&state.db, id, audio::AudioStatus::Failed).await?;
            return Err(HTTPError::InternalServerError);
        }
    };
    log::debug!("Credentials created");

    let bucket = match Bucket::new(&state.config.s3_bucket, region, credentials) {
        Ok(bucket) => bucket,
        Err(e) => {
            log::error!("Error creating bucket: {:?}", e);
            audio::update_status(&state.db, id, audio::AudioStatus::Failed).await?;
            return Err(HTTPError::InternalServerError);
        }
    };

    log::debug!("Bucket created");

    let mut file = File::open(file_path).await.map_err(|e| {
        log::error!("Error opening file {:?}", e);
        HTTPError::InternalServerError
    })?;

    log::debug!("File opened");

    let stream_resp = match bucket.put_object_stream(&mut file, s3_url).await {
        Ok(resp) => resp,
        Err(e) => {
            log::error!("Error putting object stream: {:?}", e);
            audio::update_status(&state.db, id, audio::AudioStatus::Failed).await?;

            return Err(HTTPError::InternalServerError);
        }
    };

    log::debug!("Stream response: {:?}", stream_resp);

    match stream_resp.status_code() {
        code if code < 300 && code >= 200 => {
            _ = remove_file(file_path).await.map_err(|e| {
                log::error!("Error removing {:?}: {:?}", file_path, e);
            });
            audio::update_status(&state.db, id, audio::AudioStatus::Complete).await?;
            Ok(())
        }
        code => {
            log::error!("Error in stream upload, status code: {:?}", code);
            audio::update_status(&state.db, id, audio::AudioStatus::Failed).await?;

            Err(HTTPError::InternalServerError)
        }
    }
}

todo!("Rework this and split in start, continue and finish handlers. Multipart is not what I thought it was.");
async fn upload(
    State(state): State<Arc<AppState>>,
    auth_user: dependencies::AuthUser,
    mut multipart: Multipart,
) -> Result<impl IntoResponse, HTTPError> {
    log::debug!("Upload request...");

    let mut filename = None;
    let mut title = None;
    let mut description = None;
    let mut category = None;
    let mut tags = Vec::new();
    let mut private = Some(true);
    let mut buffer = BytesMut::new();

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|_| HTTPError::BadRequest)?
    {
        let name = field.name().unwrap_or_default().to_string();

        match name.as_str() {
            "file" => {
                filename = field.file_name().map(|s| s.to_string());
                let b = field.bytes().await.map_err(|e| {
                    log::error!("Failed to read file bytes: {:?}", e);
                    HTTPError::InternalServerError
                })?;
                buffer.extend_from_slice(&b);
            }
            "title" => {
                title = Some(field.text().await.map_err(|e| {
                    log::error!("Failed to read title: {:?}", e);
                    HTTPError::BadRequest
                })?);
            }
            "description" => {
                description = Some(field.text().await.map_err(|e| {
                    log::error!("Failed to read description: {:?}", e);
                    HTTPError::BadRequest
                })?);
            }
            "category" => {
                let category_text = field.text().await.map_err(|e| {
                    log::error!("Failed to read category: {:?}", e);
                    HTTPError::BadRequest
                })?;

                category = serde_json::from_str(&category_text).map_err(|e| {
                    log::error!("Failed to parse category JSON: {:?}", e);
                    HTTPError::BadRequest
                })?;
            }
            "tags" => {
                let tags_text = field.text().await.map_err(|e| {
                    log::error!("Failed to read tags: {:?}", e);
                    HTTPError::BadRequest
                })?;

                tags = serde_json::from_str(&tags_text).map_err(|e| {
                    log::error!("Failed to parse tags JSON: {:?}", e);
                    HTTPError::BadRequest
                })?;
            }
            "private" => {
                private = field.text().await.ok().map(|v| v == "true");
            }
            _ => {
                log::info!("Unknown field: {}", name);
            }
        }
    }
    let file_bytes = buffer.freeze();

    let audio = AudioUpload {
        filename,
        title,
        description,
        category,
        tags,
        private,
        bytes: file_bytes,
    };

    let file_ext = match audio.filename {
        Some(ref name) => {
            let parts: Vec<&str> = name.split('.').collect();
            if parts.len() > 1 {
                parts[parts.len() - 1]
            } else {
                "mp3"
            }
        }
        None => "mp3",
    };

    let file_name = format!("{}/{}.{}", UPLOAD_DIR, Uuid::new_v4(), file_ext);

    // Save file to disk
    let mut file = File::create(&file_name).await.map_err(|e| {
        log::error!("Error creating file: {:?}", e);
        HTTPError::InternalServerError
    })?;
    file.write_all(&audio.bytes).await.map_err(|e| {
        log::error!("Error writing to file: {:?}", e);
        HTTPError::InternalServerError
    })?;
    log::debug!("File saved to disk");
    // Convert file to AAC LC format
    let aac_lc_file = spawn_blocking(move || utils::to_aa_lc(&file_name))
        .await
        .map_err(|e| {
            log::error!("Error converting to AAC LC: {:?}", e);
            HTTPError::InternalServerError
        })??;

    // Save to database
    let audio_ud: Uuid = Uuid::new_v4();
    let current_year = chrono::Utc::now().year();
    let s3_url = format!("{}/{}.m4a", current_year, audio_ud);

    let audio_file = Audio {
        id: audio_ud.clone(),
        title: audio.title.unwrap_or("Untitled".to_string()),
        creator: auth_user.user_id,
        description: audio.description.unwrap_or("".to_string()),
        audio_url: s3_url.clone(),
        private: audio.private.unwrap_or(true),
        category: audio.category.unwrap_or(Category {
            id: Uuid::nil(),
            name: "General".to_string(),
        }),
        tags: audio.tags,
    };

    audio::upload(&state.db, &audio_file).await?;

    // Upload file to B2 Backblaze
    _ = tokio::task::spawn(async move {
        to_backblaze(&Path::new(&aac_lc_file), &state, audio_ud, s3_url).await
    });

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
