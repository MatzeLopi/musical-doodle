use crate::{http::error::Error as HTTPError, schemas::audios::Audio};
use futures::TryFutureExt;
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Row};
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
    limit: Option<i64>,
) -> Result<Vec<Audio>, HTTPError> {
    let interval_str = match interval {
        MetadataInterval::Daily => "tpc.daily_plays",
        MetadataInterval::Weekly => "tpc.weekly_plays",
        MetadataInterval::Monthly => "tpc.monthly_plays",
        MetadataInterval::AllTime => "tpc.total_plays",
    };

    let query_string = format!(
        r#"
        SELECT
            t.track_id,
            t.title,
            u.username AS creator, -- Select the username for the 'creator' field
            t.description,
            t.audio_url,
            t.private,
            json_build_object('id', c.category_id, 'name', c.name) AS category,
            COALESCE(
                jsonb_agg(DISTINCT jsonb_build_object('id', tg.tag_id, 'name', tg.name))
                    FILTER (WHERE tg.tag_id IS NOT NULL),
                '[]'::jsonb
            ) AS tags,
            COALESCE(tpc.total_plays, 0) AS total_plays,
            COALESCE(tpc.monthly_plays, 0) AS monthly_plays,
            COALESCE(tpc.weekly_plays, 0) AS weekly_plays,
            COALESCE(tpc.daily_plays, 0) AS daily_plays
            
        FROM tracks t
        JOIN users u ON t.creator_id = u.user_id
        JOIN categories c ON t.category_id = c.category_id
        LEFT JOIN track_play_counts tpc ON t.track_id = tpc.track_id
        LEFT JOIN track_tags tt ON t.track_id = tt.track_id
        LEFT JOIN tags tg ON tt.tag_id = tg.tag_id
        
        WHERE 
            t.private = false 
        GROUP BY 
            t.track_id, u.username, c.category_id, c.name, tpc.total_plays, tpc.monthly_plays, tpc.weekly_plays, tpc.daily_plays
        ORDER BY 
            {} DESC
        LIMIT 
            $1
        "#,
        interval_str
    );

    let rows = sqlx::query(&query_string)
        .bind(limit.unwrap_or(10)) // Bind the limit value to the $1 placeholder
        .fetch_all(db)
        .await
        .map_err(|e| {
            log::error!("Failed to get most played tracks, error: {:?}", e);
            HTTPError::from(e)
        })?;

    let audio_tracks: Vec<Audio> = rows
        .into_iter()
        .map(|row| Audio {
            id: row.get("track_id"),
            title: row.get("title"),
            creator: row.get("creator"),
            description: row.get("description"),
            audio_url: row.get("audio_url"),
            private: row.get("private"),
            category: serde_json::from_value(row.get("category")).unwrap_or_default(),
            tags: serde_json::from_value(row.get("tags")).unwrap_or_default(),
            daily_plays: row.get::<i64, _>("daily_plays"),
            weekly_plays: row.get::<i64, _>("weekly_plays"),
            monthly_plays: row.get::<i64, _>("monthly_plays"),
            total_plays: row.get::<i64, _>("total_plays"),
        })
        .collect();

    Ok(audio_tracks)
}
