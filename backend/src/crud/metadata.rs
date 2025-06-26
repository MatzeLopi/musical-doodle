use crate::http::error::Error as HTTPError;
use futures::TryFutureExt;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub enum MetadataInterval {
    Daily,
    Weekly,
    Monthly,
    AllTime,
}

pub async fn add_play(db: &PgPool, track_id: Uuid) -> Result<(), HTTPError> {
    sqlx::query!("INSERT INTO track_plays (track_id) VALUES ($1)", track_id)
        .execute(db)
        .map_err(|e| {
            log::error!("Failed to add play to track {:?}, error: {:?}", track_id, e);
            HTTPError::from(e)
        })
        .await?;
    Ok(())
}

pub async fn get_plays(db: &PgPool, track_id: Uuid) -> Result<i64, HTTPError> {
    let count = sqlx::query_scalar!(
        "SELECT COUNT(*) FROM track_plays WHERE track_id = $1",
        track_id
    )
    .fetch_one(db)
    .map_err(|e| {
        log::error!(
            "Failed to get plays for track {:?}, error: {:?}",
            track_id,
            e
        );
        HTTPError::from(e)
    })
    .await?;
    match count {
        Some(count) => Ok(count),
        None => Err(HTTPError::NotFound(format!(
            "No plays found for track {:?}",
            track_id
        ))),
    }
}

pub async fn get_most_played(
    db: &PgPool,
    interval: MetadataInterval,
) -> Result<Vec<(Uuid, i64)>, HTTPError> {
}
