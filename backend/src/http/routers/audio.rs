use crate::{
    crud::audio,
    http::{dependencies, error::Error as HTTPError, utils, AppState},
    schemas::audios::{
        Audio, Category, Tag, UpdateCategory, UpdateDescription, UpdateTags, UpdateTitle,
        UploadAudio,
    },
};
use axum::{
    body::Bytes,
    extract::{Json, Multipart, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{delete, get, post, Router},
    BoxError,
};
use futures::{Stream, TryStreamExt};
use s3::{bucket::Bucket, creds::Credentials, region::Region};
use std::{path::Path, sync::Arc};
use tokio::{
    fs::{remove_file, File},
    io::BufWriter,
    io::Error as IoError,
    io::ErrorKind as IoErrorKind,
};
use tokio_util::io::StreamReader;
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

async fn to_backblaze(file_path: &Path, state: &AppState, id: Uuid) -> Result<String, HTTPError> {
    let region = Region::Custom {
        region: state.config.s3_region.clone(),
        endpoint: state.config.s3_url.clone(),
    };
    let credentials = Credentials::new(Some(&state.config.s3_secret), None, None, None, None)
        .map_err(|e| {
            log::error!("Error creating credentials: {:?}", e);
            HTTPError::InternalServerError
        })?;
    let bucket = Bucket::new(&state.config.s3_bucket, region, credentials).map_err(|e| {
        log::error!("Error creating bucket: {:?}", e);
        HTTPError::InternalServerError
    })?;

    let mut file = File::open(file_path).await.map_err(|e| {
        log::error!("Error opening file {:?}", e);
        HTTPError::InternalServerError
    })?;
    let file_name = match file_path.to_str() {
        Some(name) => name,
        None => {
            log::error!("Error getting file name");
            audio::update_status(&state.db, id, audio::AudioStatus::Failed).await?;

            return Err(HTTPError::InternalServerError);
        }
    };
    let stream_resp = bucket
        .put_object_stream(&mut file, file_name)
        .await
        .map_err(|e| {
            log::error!("Error in multipart stream {:?}", e);

            HTTPError::InternalServerError
        })?;

    match stream_resp.status_code() {
        code if code < 300 && code >= 200 => {
            _ = remove_file(file_path).await.map_err(|e| {
                log::error!("Error removing {:?}: {:?}", file_path, e);
            });
            audio::update_status(&state.db, id, audio::AudioStatus::Completed).await?;
            Ok(file_name.to_string())
        }
        code => {
            log::error!("Error in stream upload, status code: {:?}", code);
            audio::update_status(&state.db, id, audio::AudioStatus::Failed).await?;

            Err(HTTPError::InternalServerError)
        }
    }
}

// Save a `Stream` to a file
async fn stream_to_file<S, E>(path: &str, stream: S) -> Result<(), (StatusCode, String)>
where
    S: Stream<Item = Result<Bytes, E>>,
    E: Into<BoxError>,
{
    if !path_is_valid(path) {
        return Err((StatusCode::BAD_REQUEST, "Invalid path".to_string()));
    }

    async {
        // Convert the stream into an `AsyncRead`.
        let body_with_io_error = stream.map_err(|err| {
            log::error!("Error reading body");
            IoError::new(IoErrorKind::Other, err)
        });
        let body_reader = StreamReader::new(body_with_io_error);
        futures::pin_mut!(body_reader);

        // Create the file. `File` implements `AsyncWrite`.
        let path = std::path::Path::new("/temp").join(path);
        let mut file = BufWriter::new(File::create(path).await?);

        // Copy the body into the file.
        tokio::io::copy(&mut body_reader, &mut file).await?;

        Ok::<_, IoError>(())
    }
    .await
    .map_err(|err| (StatusCode::INTERNAL_SERVER_ERROR, err.to_string()))
}

// to prevent directory traversal attacks we ensure the path consists of exactly one normal
// component
fn path_is_valid(path: &str) -> bool {
    let path = std::path::Path::new(path);
    let mut components = path.components().peekable();

    if let Some(first) = components.peek() {
        if !matches!(first, std::path::Component::Normal(_)) {
            return false;
        }
    }

    components.count() == 1
}

async fn upload(
    State(state): State<Arc<AppState>>,
    auth_user: dependencies::AuthUser,
    mut multipart: Multipart,
) -> Result<impl IntoResponse, HTTPError> {
    // Get full file
    let mut file_name: Option<String> = None;
    let mut metadata = UploadAudio::default();

    while let Ok(Some(field)) = multipart.next_field().await {
        let name = field.name().unwrap_or("").to_string();

        if name == "file" {
            if let Some(name) = field.file_name() {
                file_name = Some(name.to_owned());
            } else {
                continue;
            }
            stream_to_file(file_name.as_ref().unwrap(), field).await;
        } else {
            // Extract metadata fields
            let value = field.text().await.map_err(|_| HTTPError::BadRequest)?;
            match name.as_str() {
                "title" => metadata.title = value,
                "description" => metadata.description = value,
                "category" => {
                    let category: Category =
                        serde_json::from_str(&value).map_err(|_| HTTPError::BadRequest)?;
                    metadata.category = category;
                }
                "tags" => {
                    let tags: Vec<Tag> =
                        serde_json::from_str(&value).map_err(|_| HTTPError::BadRequest)?;
                    metadata.tags = tags;
                }
                "private" => {
                    metadata.private = value.parse::<bool>().unwrap_or(false);
                }
                _ => {}
            }
        }
    }

    let file_name = match file_name {
        Some(file_name) => file_name,
        None => return Err(HTTPError::BadRequest),
    };
    // Convert file to AAC LC format
    let aac_lc_file = spawn_blocking(move || utils::to_aa_lc(&file_name))
        .await
        .map_err(|_| HTTPError::InternalServerError)??;

    // Save to database
    let audio_ud = Uuid::new_v4();
    let audio_file = Audio {
        id: audio_ud.clone(),
        title: metadata.title,
        creator: auth_user.user_id,
        description: metadata.description,
        audio_url: aac_lc_file.clone(),
        private: metadata.private,
        category: metadata.category,
        tags: metadata.tags,
    };

    audio::upload(&state.db, &audio_file).await?;

    // Upload file to B2 Backblaze

    let upload_result = tokio::task::spawn(async move {
        to_backblaze(&Path::new(&aac_lc_file), &state, audio_ud).await
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
