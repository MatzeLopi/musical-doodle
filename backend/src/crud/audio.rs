use crate::{
    http::error::Error as HTTPError,
    schemas::audios::Audio,
};
use futures::TryFutureExt;
use sqlx::PgPool;
use uuid::Uuid;

pub async fn upload(db:&PgPool, audio:Audio)  -> Result<(), HTTPError> {
    let result = sqlx::query!(
        "INSERT INTO tracks (title, creator_id, description, audio_url, category_id) VALUES ($1, $2, $3, $4, $5)",
        audio.title,
        audio.creator,
        audio.description,
        audio.audio_url,
        audio.category
    ).execute(db).map_err(HTTPError::from).await?;
    match result.rows_affected() {
        1 => Ok(()),
        _ => Err(HTTPError::InternalServerError),
    }
}

pub async fn update_title(db:&PgPool, audio_id:Uuid, user_id:Uuid, new_title:String) -> Result<(), HTTPError> {
    let result = sqlx::query!(
        "UPDATE tracks SET title = $1 WHERE track_id = $2 AND creator_id = $3",
        new_title, audio_id, user_id)
        .execute(db).map_err(HTTPError::from).await?;
    match result.rows_affected() {
        1 => Ok(()),
        _ => Err(HTTPError::Forbidden),
    }
}

pub async fn update_description(db:&PgPool, audio_id:Uuid, user_id:Uuid, new_description:String) -> Result<(), HTTPError> {
    let result = sqlx::query!(
        "UPDATE tracks SET description = $1 WHERE track_id = $2 AND creator_id = $3",
        new_description, audio_id, user_id)
        .execute(db).map_err(HTTPError::from).await?;
    match result.rows_affected() {
        1 => Ok(()),
        _ => Err(HTTPError::Forbidden),
    }
}

pub async fn set_public(db:&PgPool, audio_id:Uuid, user_id:Uuid) -> Result<(), HTTPError> {
    let result = sqlx::query!(
        "UPDATE tracks SET private = false WHERE track_id = $1 AND creator_id = $2",
        audio_id, user_id)
        .execute(db).map_err(HTTPError::from).await?;
    match result.rows_affected() {
        1 => Ok(()),
        _ => Err(HTTPError::Forbidden),
    }
}

pub async fn set_private(db:&PgPool, audio_id:Uuid, user_id:Uuid) -> Result<(), HTTPError> {
    let result = sqlx::query!(
        "UPDATE tracks SET private = true WHERE track_id = $1 AND creator_id = $2",
        audio_id, user_id)
        .execute(db).map_err(HTTPError::from).await?;
    match result.rows_affected() {
        1 => Ok(()),
        _ => Err(HTTPError::Forbidden),
    }
}

pub async fn delete(db:&PgPool, audio_id:Uuid, user_id:Uuid) -> Result<(), HTTPError> {
    let result = sqlx::query!(
        "DELETE FROM tracks WHERE track_id = $1 AND creator_id = $2",
        audio_id, user_id)
        .execute(db).map_err(HTTPError::from).await?;
    match result.rows_affected() {
        1 => Ok(()),
        _ => Err(HTTPError::Forbidden),
    }
}


pub async fn get_audios(db: &PgPool, username:String) -> Result<Vec<Audio>, HTTPError> {
    
    let result = sqlx::query!(
        "SELECT t. * 
        FROM tracks t
        JOIN users u ON t.creator_id = u.user_id
        WHERE u.username = $1",
        username)
    .fetch_all(db).map_err(HTTPError::from).await;
    
    match result {
        Ok(audios) => {
            let mut result = Vec::new();
            for audio in audios {
                result.push(Audio {
                    id:audio.track_id,
                    title:audio.title,
                    creator:audio.creator_id,
                    description: match audio.description {
                        Some(desc) => desc,
                        None => "".to_string(),
                    },
                    audio_url:audio.audio_url,
                    category:audio.category_id,
                });
            }
            return Ok(result);
        },
        Err(e) => {
            log::error!("Error getting audios: {:?}", e);
            return Err(HTTPError::from(e));
        }
    }

}

pub async fn get_my_audios(db:&PgPool, uid:Uuid) -> Result<Vec<Audio>, HTTPError> {
    let result = sqlx::query!(
        "select * 
        from tracks 
        where creator_id = $1", uid)
        .fetch_all(db).map_err(HTTPError::from).await;
    match result {
        Ok(audios) => {
            let mut result = Vec::new();
            for audio in audios {
                result.push(Audio {
                    id:audio.track_id,
                    title:audio.title,
                    creator:audio.creator_id,
                    description: match audio.description {
                        Some(desc) => desc,
                        None => "".to_string(),
                    },
                    audio_url:audio.audio_url,
                    category:audio.category_id,
                });
            }
            return Ok(result);
        },
        Err(e) => {
            log::error!("Error getting audios: {:?}", e);
            return Err(HTTPError::from(e));
        }
    }
}