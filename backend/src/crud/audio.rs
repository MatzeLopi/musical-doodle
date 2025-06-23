use crate::{
    http::error::Error as HTTPError,
    schemas::{
        audios::{Audio, Category, QueryParams, Tag},
        Page,
    },
};
use futures::TryFutureExt;
use itertools;
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgRow, FromRow, PgPool, Postgres, QueryBuilder, Row};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "track_status", rename_all = "lowercase")]
pub enum AudioStatus {
    Pending,
    Uploading,
    Complete,
    Failed,
}

impl FromRow<'_, PgRow> for AudioStatus {
    fn from_row(row: &PgRow) -> Result<AudioStatus, sqlx::Error> {
        let status: &str = row.try_get("status")?;
        return match status {
            "pending" => Ok(AudioStatus::Pending),
            "uploading" => Ok(AudioStatus::Uploading),
            "complete" => Ok(AudioStatus::Complete),
            "failed" => Ok(AudioStatus::Failed),
            _ => Err(sqlx::Error::Decode(Box::new(std::io::Error::new(
                std::io::ErrorKind::InvalidData,
                format!("Invalid audio status: {}", status),
            )))),
        };
    }
}

pub async fn search(
    db: &PgPool,
    params: QueryParams,
    page: f64,
    page_size: f64,
) -> Result<Page<Audio>, HTTPError> {
    // Start building the base query from tracks
    log::debug!("Searching audios with params: {:?}", params);

    let mut qb: QueryBuilder<Postgres> = QueryBuilder::new(
        "SELECT 
            t.track_id, 
            t.title, 
            t.creator_id AS creator, 
            t.description, 
            t.audio_url, 
            t.private, 
            json_build_object('id', c.category_id, 'name', c.name) AS category, 
            COALESCE(
                jsonb_agg(jsonb_build_object('id', tg.tag_id, 'name', tg.name))
                    FILTER (WHERE tg.tag_id IS NOT NULL),
                '[]'
            ) AS tags
        FROM tracks t
        JOIN users u ON t.creator_id = u.user_id
        JOIN categories c ON t.category_id = c.category_id
        LEFT JOIN track_tags tt ON t.track_id = tt.track_id
        LEFT JOIN tags tg ON tg.tag_id = tt.tag_id
        WHERE 1=1
        AND t.private = false",
    );

    // Filter by creator name
    if let Some(creator) = params.creator {
        qb.push(" AND u.username LIKE lower(")
            .push_bind(format!("%{}%", creator));
        qb.push(")");
    }

    // Filter by track title
    if let Some(title) = params.title {
        qb.push(" AND t.title LIKE lower(")
            .push_bind(format!("%{}%", title));
        qb.push(")");
    }

    // For tags_included: ensure the track has all the provided tag IDs
    if let Some(tags) = params.tags_included {
        qb.push(" AND (SELECT COUNT(*) FROM track_tags tt2 WHERE tt2.track_id = t.track_id AND tt2.tag_id = ANY(")
          .push_bind(
              tags.clone()
                  .into_iter()
                  .map(|tag: Tag| tag.id)
                  .collect::<Vec<Uuid>>()
          )
          .push(")) = ")
          .push_bind(tags.len() as i64);
    }

    // For tags_excluded: ensure none of the tag IDs are present
    if let Some(tags) = params.tags_excluded {
        qb.push(" AND NOT EXISTS (SELECT 1 FROM track_tags tt2 WHERE tt2.track_id = t.track_id AND tt2.tag_id = ANY(")
          .push_bind(
              tags.into_iter()
                  .map(|tag| tag.id)
                  .collect::<Vec<Uuid>>()
          )
          .push("))");
    }

    // For categories_included: ensure the track has all the provided category IDs
    if let Some(categories) = params.categories_included {
        qb.push(" AND c.category_id = ANY(")
            .push_bind(
                categories
                    .into_iter()
                    .map(|cat| cat.id)
                    .collect::<Vec<Uuid>>(),
            )
            .push(")");
    }

    // For categories_excluded: ensure none of the category IDs are present
    if let Some(categories) = params.categories_excluded {
        qb.push(" AND NOT (c.category_id = ANY(")
            .push_bind(
                categories
                    .into_iter()
                    .map(|cat| cat.id)
                    .collect::<Vec<Uuid>>(),
            )
            .push("))");
    }

    // Group by track ID, title, creator ID, description, audio URL, private, and category
    qb.push(" GROUP BY t.track_id, t.title, t.creator_id, t.description, t.audio_url, t.private, c.category_id");

    // Add an ORDER BY clause for backend sorting
    match params.sort_by {
        Some(sort) => match sort.as_str() {
            "title" => qb.push(" ORDER BY t.title ASC"),
            "creator" => qb.push(" ORDER BY u.name ASC"),
            "created" => qb.push(" ORDER BY t.created_at ASC"),
            _ => qb.push(" ORDER BY t.created_at ASC"),
        },
        None => qb.push(" ORDER BY t.created_at ASC"),
    };

    let offset = (page - 1.0) * page_size;

    qb.push(" LIMIT ")
        .push_bind(page_size)
        .push(" OFFSET ")
        .push_bind(offset);

    // Execute the query

    let query = qb.build();

    let result: Result<Vec<PgRow>, HTTPError> = query.fetch_all(db).map_err(HTTPError::from).await;
    match result {
        Ok(audios) => {
            let mut result = Vec::new();
            for audio in audios {
                log::debug!("Audio: {:?}", audio);
                result.push(Audio {
                    id: audio.get("track_id"),
                    title: audio.get("title"),
                    creator: audio.get("creator"),
                    description: audio.get("description"),
                    audio_url: audio.get("audio_url"),
                    private: audio.get("private"),
                    category: serde_json::from_value(audio.get("category")).unwrap(),
                    tags: serde_json::from_value(audio.get("tags")).unwrap(),
                });
            }
            Ok(Page {
                current_page: page,
                page_size,
                has_more: result.len() as f64 == page_size,
                items: result,
            })
        }
        Err(e) => {
            log::error!("Error searching audios: {:?}", e);
            Err(e)
        }
    }
}

pub async fn update_url(db: &PgPool, audio_id: Uuid, url: &str) -> Result<(), HTTPError> {
    let result = sqlx::query!(
        "UPDATE tracks SET audio_url = $1 WHERE track_id = $2",
        url,
        audio_id
    )
    .execute(db)
    .map_err(|e| {
        log::error!("Error updating audio url: {:?}", e);
        HTTPError::InternalServerError
    })
    .await?;

    match result.rows_affected() {
        1 => Ok(()),
        _ => Err(HTTPError::InternalServerError),
    }
}

pub async fn get_status(db: &PgPool, audio_id: Uuid) -> Result<AudioStatus, HTTPError> {
    let result = sqlx::query!(
        "SELECT status as \"status: AudioStatus\" FROM tracks WHERE track_id = $1",
        audio_id
    )
    .fetch_one(db)
    .map_err(HTTPError::from)
    .await;

    match result {
        Ok(record) => Ok(record.status),
        Err(e) => {
            log::error!("Error getting status: {:?}", e);
            Err(HTTPError::from(e))
        }
    }
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
    .map_err(|e| {
        log::error!("Error updating status: {:?}", e);
        HTTPError::InternalServerError
    })
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
        "INSERT INTO tracks (track_id,  creator_id, title, description, audio_url, category_id) VALUES ($1, $2, $3, $4, $5, $6)",
        audio.id,
        audio.creator,
        audio.title,
        audio.description,
        audio.audio_url,
        audio.category.id
    ).execute(db).map_err(|e|{
        log::error!("Error uploading audio: {:?}", e);
        HTTPError::InternalServerError}).await?;

    for tag in &audio.tags {
        _ = sqlx::query!(
            "INSERT INTO track_tags (track_id, tag_id) VALUES ($1, $2)",
            audio.id,
            tag.id
        )
        .execute(db)
        .map_err(|e| {
            log::error!("Error uploading audio: {:?}", e);
            HTTPError::from(e)
        })
        .await?;
    }

    match result.rows_affected() {
        1 => Ok(()),
        count => {
            log::debug!("Expected 1 row affected, got {}", count);
            Err(HTTPError::InternalServerError)
        }
    }
}

pub async fn update_category(
    db: &PgPool,
    audio_id: Uuid,
    user_id: Uuid,
    category_id: Uuid,
) -> Result<(), HTTPError> {
    sqlx::query!("UPDATE tracks SET category_id = $1 WHERE track_id = $2 AND creator_id = $3 AND EXISTS (SELECT 1 FROM categories WHERE category_id = $1);", category_id, audio_id, user_id)
        .execute(db)
        .map_err(|e| 
            {
                log::error!("Error when updating audio category: {}",e);
                HTTPError::from(e)
            }
        ).await?;
    Ok(())
}
pub async fn remove_tag_from(
    db: &PgPool,
    audio_id: Uuid,
    user_id: Uuid,
    tag_id: Uuid,
) -> Result<(), HTTPError> {
    sqlx::query!("DELETE FROM track_tags USING tracks where track_tags.track_id = tracks.track_id and tracks.track_id = $1 and track_tags.tag_id = $2 and tracks.creator_id = $3", audio_id, tag_id, user_id)
        .execute(db)
        .map_err(|e| {
            log::error!("Error when removing Tag: {}",e);
            HTTPError::from(e)}
        ).await?;

    Ok(())
}

pub async fn add_tag_to(
    db: &PgPool,
    audio_id: Uuid,
    user_id: Uuid,
    tag_id: Uuid,
) -> Result<(), HTTPError> {
    let mut tx = db.begin().await?;

    let owner_check: bool = sqlx::query_scalar!(
        "SELECT EXISTS(SELECT 1 FROM tracks WHERE track_id = $1 AND creator_id = $2)", 
        audio_id,
        user_id
    )
    .fetch_one(&mut *tx) 
    .await?
    .unwrap_or(false);

    if !owner_check {
        // Um zwischen NotFound und Forbidden zu unterscheiden (optional aber gut für die API)
        let audio_exists: bool = sqlx::query_scalar!(
            "SELECT EXISTS(SELECT 1 FROM tracks WHERE track_id = $1)",
            audio_id
        )
        .fetch_one(&mut *tx)
        .await?.unwrap_or(false);

        if !audio_exists {
            return Err(HTTPError::NotFound(format!("Audio with ID {} not found.", audio_id)));
        } else {
            return Err(HTTPError::Forbidden);
        }
    }

    let tag_exists: bool = sqlx::query_scalar!(
        "SELECT EXISTS(SELECT 1 FROM tags WHERE tag_id = $1)",
        tag_id
    )
    .fetch_one(&mut *tx)
    .await?
    .unwrap_or(false);

    if !tag_exists {
        return Err(HTTPError::BadRequest(format!("Tag with ID {} not found.", tag_id)));
    }

    sqlx::query!(
        r#"
        INSERT INTO track_tags (track_id, tag_id)
        VALUES ($1, $2)
        ON CONFLICT (track_id, tag_id) DO NOTHING
        "#,
        audio_id,
        tag_id
    )
    .execute(&mut *tx)
    .await?;

    tx.commit().map_err(|e| {
        log::error!("Could not commit TX on Tag add: {}",e);
        HTTPError::from(e)
    }).await?;

    Ok(())
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

pub async fn get_audio_url(db: &PgPool, audio_id: Uuid) -> Result<String, HTTPError> {
    let result = sqlx::query!("SELECT audio_url FROM tracks WHERE track_id = $1", audio_id)
        .fetch_one(db)
        .map_err(HTTPError::from)
        .await;
    match result {
        Ok(audio) => Ok(audio.audio_url),
        Err(e) => {
            log::error!("Error getting audio url: {:?}", e);
            Err(HTTPError::from(e))
        }
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
