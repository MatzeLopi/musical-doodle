use crate::{
    crud::audio::{self, AudioStatus},
    http::{dependencies, error::Error as HTTPError, utils, AppState},
    schemas::{
        audios::{
            Audio, Category, QueryParams, Tag, UpdateCategory, UpdateDescription, UpdateTag,
            UpdateTitle, UploadAudioMetadata, UploadChunk,
        },
        Payload,
    },
};
use axum::{
    extract::{Json, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{delete, get, post, Router},
};
use axum_extra::protobuf::Protobuf;
use chrono::Datelike;
use once_cell::sync::Lazy;
use s3::{bucket::Bucket, creds::Credentials, region::Region};
use std::{collections::HashMap, fs::create_dir_all, path::PathBuf, sync::Arc};
use tokio::io::AsyncSeekExt;
use tokio::task::spawn_blocking; // For the lazy initialization of the lock map

use tokio::{
    fs::{remove_file, File, OpenOptions},
    io::AsyncWriteExt,
    sync::{Mutex, RwLock},
};
use uuid::Uuid;

static FILE_LOCKS: Lazy<RwLock<HashMap<Uuid, Mutex<()>>>> =
    Lazy::new(|| RwLock::new(HashMap::new())); // Use RwLock

static CHUNK_COUNTERS: Lazy<RwLock<HashMap<Uuid, Mutex<u64>>>> =
    Lazy::new(|| RwLock::new(HashMap::new()));

const UPLOAD_DIR: &str = "temp";

pub fn router(state: Arc<AppState>) -> Router {
    create_dir_all(UPLOAD_DIR).unwrap();
    Router::new()
        .route("/sound/my_audios", get(get_my_audios))
        .route("/sound/{username}", get(get_audio))
        .route("/sound/upload/start", post(start_upload))
        .route("/sound/upload/chunk", post(upload))
        .route("/sound/upload/end", post(end_upload))
        .route("/sound/delete/", delete(delete_audio))
        .route("/sound/update/set_private", post(set_private))
        .route("/sound/update/set_public", post(set_public))
        .route("/sound/update/description", post(update_description))
        .route("/sound/update/title", post(update_title))
        .route("/sound/tags/add", post(add_tag_to))
        .route("/sound/tags/remove", post(remove_tag_from))
        .route("/sound/update/category", post(update_category))
        .route("/sound/tags", get(get_tags))
        .route("/sound/tags/create", post(create_tag))
        .route("/sound/categories", get(get_categories))
        .route("/sound/categories/create", post(create_category))
        .route("/sound/status", post(get_status))
        .route("/sound/search", post(search))
        .with_state(state)
}

async fn search(
    State(state): State<Arc<AppState>>,
    Json(query): Json<QueryParams>,
) -> Result<impl IntoResponse, HTTPError> {
    let page = query.page.unwrap_or(1.0);
    let page_size = query.page_size.unwrap_or(20.0);
    let tracks = audio::search(&state.db, query, page, page_size).await;
    match tracks {
        Ok(tracks) => Ok((StatusCode::OK, Json(tracks))),
        Err(e) => Err(e),
    }
}

async fn get_status(
    State(state): State<Arc<AppState>>,
    Json(track_id): Json<Payload<Uuid>>,
) -> Result<impl IntoResponse, HTTPError> {
    let status = audio::get_status(&state.db, track_id.payload).await;
    match status {
        Ok(status) => Ok((StatusCode::OK, Json(status))),
        Err(e) => Err(e),
    }
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
    file_path: PathBuf,
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

    let mut file = File::open(&file_path).await.map_err(|e| {
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
            _ = remove_file(&file_path).await.map_err(|e| {
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

async fn start_upload(
    auth_user: dependencies::AuthUser,

    State(state): State<Arc<AppState>>,
    Json(metadata): Json<UploadAudioMetadata>,
) -> Result<impl IntoResponse, HTTPError> {
    let uid = Uuid::new_v4();

    _ = File::create(format!(
        "{}/{}.{}",
        UPLOAD_DIR,
        uid.simple().to_string(),
        metadata.ext
    ))
    .await
    .map_err(|e| {
        log::error!("Error creating file: {:?}", e);
        HTTPError::InternalServerError
    })?;

    let s3_url = format!("{}/{}.m4a", chrono::Utc::now().year(), uid);
    let s3_url = format!("{}/{}", state.config.s3_url, s3_url);

    let audio = Audio {
        id: uid,
        title: metadata.title,
        creator: auth_user.user_id,
        description: metadata.description,
        audio_url: s3_url,
        private: metadata.private,
        category: metadata.category,
        tags: metadata.tags,
        daily_plays: 0,
        monthly_plays: 0,
        total_plays: 0,
        weekly_plays: 0,
    };

    audio::upload(&state.db, &audio).await?;
    audio::update_status(&state.db, uid, AudioStatus::Pending).await?;

    FILE_LOCKS.write().await.insert(uid, Mutex::new(()));

    Ok((StatusCode::CREATED, Json(serde_json::json!({ "id": uid }))))
}

async fn upload(
    _: dependencies::AuthUser,
    Protobuf(part): Protobuf<UploadChunk>,
) -> Result<impl IntoResponse, HTTPError> {
    let id = Uuid::parse_str(&part.id).map_err(|e| {
        let message = format!("Error parsing UUID {:?}", e);
        log::error!("{}", message);
        HTTPError::BadRequest(message)
    })?;

    let file_path = format!("{}/{}.{}", UPLOAD_DIR, id.simple().to_string(), part.ext);
    let locks = FILE_LOCKS.read().await;

    let lock = match locks.get(&id) {
        Some(lock) => lock,
        None => return Err(HTTPError::BadRequest("No Lock with ID found.".to_string())),
    };

    // Lock the mutex for the file.
    let _guard = lock.lock().await;

    let mut file = OpenOptions::new()
        .write(true)
        .open(&file_path)
        .await
        .map_err(|e| {
            log::error!("Error opening file: {:?}", e);
            HTTPError::InternalServerError
        })?;

    file.seek(tokio::io::SeekFrom::Start(
        (part.chunk_number * 1024 * 1024) as u64,
    ))
    .await
    .map_err(|e| {
        log::error!("Error seeking file: {:?}", e);
        HTTPError::InternalServerError
    })?;

    file.write_all(&part.chunk).await.map_err(|e| {
        log::error!("Error writing to file: {:?}", e);
        HTTPError::InternalServerError
    })?;

    drop(_guard);

    // Get the chunk counter lock for the file
    let mut counters = CHUNK_COUNTERS.write().await;
    let counter = counters.entry(id).or_insert_with(|| Mutex::new(0));

    // Increment the chunk counter
    let mut counter_guard = counter.lock().await;
    *counter_guard += 1; // Increment the counter for the file

    drop(counter_guard);

    Ok(StatusCode::CREATED)
}

async fn end_upload(
    _: dependencies::AuthUser,
    State(state): State<Arc<AppState>>,
    Json(metadata): Json<UploadAudioMetadata>,
) -> Result<impl IntoResponse, HTTPError> {
    let id = match metadata.id {
        Some(id) => id,
        None => {
            let msg = "No ID provided".to_string();
            log::error!("{}", msg);
            return Err(HTTPError::BadRequest(msg));
        }
    };

    let recieved_chunks = {
        let counters = CHUNK_COUNTERS.read().await;
        let counter = match counters.get(&id) {
            Some(counter) => counter,
            None => {
                let msg = format!("No chunk upload counter found for {:?}", id);
                log::error!("{}", msg);
                return Err(HTTPError::BadRequest(msg));
            }
        };

        let counter_guard = counter.lock().await;
        *counter_guard
    };

    if recieved_chunks != metadata.total_chunks {
        let message = format!(
            "Expected {} chunks, but got {}",
            metadata.total_chunks, recieved_chunks
        );
        log::error!("{}", message);
        return Err(HTTPError::BadRequest(message));
    } else {
        CHUNK_COUNTERS.write().await.remove(&id);
        FILE_LOCKS.write().await.remove(&id);
        log::debug!("All chunks received");
    }

    let s3_url = audio::get_audio_url(&state.db, id).await?;
    let file_path = format!("{}/{}.{}", UPLOAD_DIR, id.simple(), metadata.ext);
    let raw_path = format!("{}/{}.m4a", chrono::Utc::now().year(), id);
    let out_path = PathBuf::new().join(&raw_path);
    let out_path_clone = raw_path.clone();

    _ = spawn_blocking(move || utils::to_aa_lc(&file_path, &out_path_clone))
        .await
        .map_err(|e| {
            log::error!("Error converting to AAC LC: {:?}", e);
            HTTPError::InternalServerError
        })?;

    tokio::task::spawn({
        async move {
            _ = to_backblaze(out_path, &state, id, s3_url)
                .await
                .map_err(|e| {
                    log::error!("Error uploading to backblaze: {:?}", e);
                })
        }
    });

    Ok(StatusCode::NO_CONTENT)
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
    // Update audio fitle description
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
    audio::update_category(&state.db, data.id, auth_user.user_id, data.category.id).await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn add_tag_to(
    State(state): State<Arc<AppState>>,
    auth_user: dependencies::AuthUser,
    Json(data): Json<UpdateTag>,
) -> Result<impl IntoResponse, HTTPError> {
    audio::add_tag_to(&state.db, data.id, auth_user.user_id, data.tag.id).await?;
    Ok(StatusCode::NO_CONTENT)
}
async fn remove_tag_from(
    State(state): State<Arc<AppState>>,
    auth_user: dependencies::AuthUser,
    Json(data): Json<UpdateTag>,
) -> Result<impl IntoResponse, HTTPError> {
    audio::remove_tag_from(&state.db, data.id, auth_user.user_id, data.tag.id).await?;
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
