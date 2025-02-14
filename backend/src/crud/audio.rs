use crate::{
    http::error::Error as HTTPError,
    schemas::audios::{Audio, Category, Tag},
};
use futures::TryFutureExt;
use itertools;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "audio_status", rename_all = "lowercase")]
pub enum AudioStatus {
    Pending,
    Uploading,
    Completed,
    Failed,
}

pub async fn update_status(
    db: &PgPool,
    audio_id: Uuid,
    status: AudioStatus,
) -> Result<(), HTTPError> {
    // Update the status in the database
    let result = sqlx::query!(
        "UPDATE tracks SET status = $1 WHERE track_id = $2",
        status as AudioStatus,
        audio_id
    )
    .execute(db)
    .map_err(HTTPError::from)
    .await?;

    // Check the result and return appropriate response
    match result.rows_affected() {
        1 => Ok(()),
        _ => Err(HTTPError::InternalServerError),
    }
}

pub async fn get_tags(db: &PgPool) -> Result<Vec<Tag>, HTTPError> {
    let result = sqlx::query!("SELECT * FROM tags")
        .fetch_all(db)
        .map_err(HTTPError::from)
        .await;
    match result {
        Ok(tags) => {
            let mut result = Vec::new();
            for tag in tags {
                result.push(Tag {
                    id: tag.tag_id,
                    name: tag.name,
                });
            }
            return Ok(result);
        }
        Err(e) => {
            log::error!("Error getting tags: {:?}", e);
            return Err(HTTPError::from(e));
        }
    }
}

pub async fn create_tag(db: &PgPool, tag: String) -> Result<(), HTTPError> {
    let result = sqlx::query!("INSERT INTO tags (name) VALUES ($1)", tag)
        .execute(db)
        .map_err(HTTPError::from)
        .await?;
    match result.rows_affected() {
        1 => Ok(()),
        _ => Err(HTTPError::InternalServerError),
    }
}

pub async fn get_categories(db: &PgPool) -> Result<Vec<Category>, HTTPError> {
    let result = sqlx::query!("SELECT * FROM categories")
        .fetch_all(db)
        .map_err(HTTPError::from)
        .await;
    match result {
        Ok(categories) => {
            let mut result = Vec::new();
            for category in categories {
                result.push(Category {
                    id: category.category_id,
                    name: category.name,
                });
            }
            return Ok(result);
        }
        Err(e) => {
            log::error!("Error getting categories: {:?}", e);
            return Err(HTTPError::from(e));
        }
    }
}

pub async fn create_category(db: &PgPool, category: String) -> Result<(), HTTPError> {
    let result = sqlx::query!("INSERT INTO categories (name) VALUES ($1)", category)
        .execute(db)
        .map_err(HTTPError::from)
        .await?;
    match result.rows_affected() {
        1 => Ok(()),
        _ => Err(HTTPError::InternalServerError),
    }
}

pub async fn upload(db: &PgPool, audio: &Audio) -> Result<(), HTTPError> {
    let result = sqlx::query!(
        "INSERT INTO tracks (title, creator_id, description, audio_url, category_id) VALUES ($1, $2, $3, $4, $5)",
        audio.title,
        audio.creator,
        audio.description,
        audio.audio_url,
        audio.category.id
    ).execute(db).map_err(HTTPError::from).await?;
    match result.rows_affected() {
        1 => Ok(()),
        _ => Err(HTTPError::InternalServerError),
    }
}

pub async fn update_title(
    db: &PgPool,
    audio_id: Uuid,
    user_id: Uuid,
    new_title: String,
) -> Result<(), HTTPError> {
    let result = sqlx::query!(
        "UPDATE tracks SET title = $1 WHERE track_id = $2 AND creator_id = $3",
        new_title,
        audio_id,
        user_id
    )
    .execute(db)
    .map_err(HTTPError::from)
    .await?;
    match result.rows_affected() {
        1 => Ok(()),
        _ => Err(HTTPError::Forbidden),
    }
}

pub async fn update_description(
    db: &PgPool,
    audio_id: Uuid,
    user_id: Uuid,
    new_description: String,
) -> Result<(), HTTPError> {
    let result = sqlx::query!(
        "UPDATE tracks SET description = $1 WHERE track_id = $2 AND creator_id = $3",
        new_description,
        audio_id,
        user_id
    )
    .execute(db)
    .map_err(HTTPError::from)
    .await?;
    match result.rows_affected() {
        1 => Ok(()),
        _ => Err(HTTPError::Forbidden),
    }
}

pub async fn set_public(db: &PgPool, audio_id: Uuid, user_id: Uuid) -> Result<(), HTTPError> {
    let result = sqlx::query!(
        "UPDATE tracks SET private = false WHERE track_id = $1 AND creator_id = $2",
        audio_id,
        user_id
    )
    .execute(db)
    .map_err(HTTPError::from)
    .await?;
    match result.rows_affected() {
        1 => Ok(()),
        _ => Err(HTTPError::Forbidden),
    }
}

pub async fn set_private(db: &PgPool, audio_id: Uuid, user_id: Uuid) -> Result<(), HTTPError> {
    let result = sqlx::query!(
        "UPDATE tracks SET private = true WHERE track_id = $1 AND creator_id = $2",
        audio_id,
        user_id
    )
    .execute(db)
    .map_err(HTTPError::from)
    .await?;
    match result.rows_affected() {
        1 => Ok(()),
        _ => Err(HTTPError::Forbidden),
    }
}

pub async fn delete(db: &PgPool, audio_id: Uuid, user_id: Uuid) -> Result<(), HTTPError> {
    let result = sqlx::query!(
        "DELETE FROM tracks WHERE track_id = $1 AND creator_id = $2",
        audio_id,
        user_id
    )
    .execute(db)
    .map_err(HTTPError::from)
    .await?;
    match result.rows_affected() {
        1 => Ok(()),
        _ => Err(HTTPError::Forbidden),
    }
}

pub async fn get_audios(db: &PgPool, username: String) -> Result<Vec<Audio>, HTTPError> {
    let result = sqlx::query!(
        r#"
        SELECT 
            t.track_id,
            t.title,
            t.creator_id,
            t.description,
            t.audio_url,
            t.private,
            c.category_id,
            c.name AS category_name,
            ARRAY_REMOVE(ARRAY_AGG(DISTINCT tg.tag_id), NULL) AS tag_ids,
            ARRAY_REMOVE(ARRAY_AGG(DISTINCT tg.name), NULL) AS tag_names
        FROM tracks t
        JOIN users u ON t.creator_id = u.user_id
        JOIN categories c ON t.category_id = c.category_id
        LEFT JOIN track_tags tt ON t.track_id = tt.track_id
        LEFT JOIN tags tg ON tt.tag_id = tg.tag_id
        WHERE u.username = $1 and t.private = false
        GROUP BY t.track_id, c.category_id, c.name
        "#,
        username
    )
    .fetch_all(db)
    .map_err(HTTPError::from)
    .await;

    match result {
        Ok(audios) => {
            let mut result = Vec::new();
            for audio in audios {
                result.push(Audio {
                    id: audio.track_id,
                    title: audio.title,
                    creator: audio.creator_id,
                    description: audio.description.unwrap_or_default(),
                    audio_url: audio.audio_url,
                    private: audio.private,
                    category: Category {
                        id: audio.category_id,
                        name: audio.category_name,
                    },
                    tags: itertools::izip!(
                        audio.tag_ids.unwrap_or_default(),
                        audio.tag_names.unwrap_or_default()
                    )
                    .map(|(id, name)| Tag { id, name })
                    .collect(),
                });
            }
            Ok(result)
        }
        Err(e) => {
            log::error!("Error getting audios: {:?}", e);
            Err(HTTPError::from(e))
        }
    }
}

pub async fn get_my_audios(db: &PgPool, uid: Uuid) -> Result<Vec<Audio>, HTTPError> {
    let result = sqlx::query!("SELECT 
        t.track_id, 
        t.title, 
        t.creator_id, 
        t.description, 
        t.audio_url, 
        c.category_id, 
        c.name AS category_name,
        COALESCE(ARRAY_AGG(DISTINCT tg.tag_id) FILTER (WHERE tg.tag_id IS NOT NULL), '{}') AS tag_ids,
        COALESCE(ARRAY_AGG(DISTINCT tg.name) FILTER (WHERE tg.name IS NOT NULL), '{}') AS tag_names
    FROM tracks t
    JOIN categories c ON t.category_id = c.category_id
    LEFT JOIN track_tags tt ON t.track_id = tt.track_id
    LEFT JOIN tags tg ON tt.tag_id = tg.tag_id
    WHERE t.creator_id = $1
    GROUP BY t.track_id, c.category_id, c.name"
    ,uid
    )
    .fetch_all(db)
    .map_err(HTTPError::from)
    .await;
    match result {
        Ok(audios) => {
            let mut result = Vec::new();
            for audio in audios {
                result.push(Audio {
                    id: audio.track_id,
                    title: audio.title,
                    creator: audio.creator_id,
                    description: audio.description.unwrap_or_default(),
                    audio_url: audio.audio_url,
                    private: true,
                    category: Category {
                        id: audio.category_id,
                        name: audio.category_name,
                    },
                    tags: itertools::izip!(
                        audio.tag_ids.unwrap_or_default(),
                        audio.tag_names.unwrap_or_default()
                    )
                    .map(|(id, name)| Tag { id, name })
                    .collect(),
                });
            }
            Ok(result)
        }
        Err(e) => {
            log::error!("Error getting audios: {:?}", e);
            return Err(HTTPError::from(e));
        }
    }
}
