use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(prost::Message)]
pub struct UploadChunk {
    #[prost(string, tag = "1")]
    pub id: String,
    #[prost(int32, tag = "2")]
    pub chunk_number: i32,
    #[prost(bytes, tag = "3")]
    pub chunk: Vec<u8>,
    #[prost(string, tag = "4")]
    pub ext: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QueryParams {
    pub creator: Option<String>,
    pub title: Option<String>,
    pub categories_included: Option<Vec<Category>>,
    pub categories_excluded: Option<Vec<Category>>,
    pub tags_included: Option<Vec<Tag>>,
    pub tags_excluded: Option<Vec<Tag>>,
    pub private: Option<bool>,
    pub sort_by: Option<String>,
    pub page: Option<f64>,
    pub page_size: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UploadAudioMetadata {
    pub id: Option<Uuid>,
    pub title: String,
    pub ext: String,
    pub description: String,
    pub category: Category,
    pub tags: Vec<Tag>,
    pub private: bool,
    pub total_chunks: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct Category {
    pub id: Uuid,
    pub name: String,
}

impl Default for Category {
    fn default() -> Self {
        Category {
            id: Uuid::nil(),
            name: "None".to_string(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct Tag {
    pub id: Uuid,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Audio {
    pub id: Uuid,
    pub title: String,
    pub creator: Uuid,
    pub description: String,
    pub audio_url: String,
    pub private: bool,
    pub category: Category,
    pub tags: Vec<Tag>,
    pub daily_plays: i64,
    pub weekly_plays: i64,
    pub monthly_plays: i64,
    pub total_plays: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateDescription {
    pub id: Uuid,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateTitle {
    pub id: Uuid,
    pub title: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateCategory {
    pub id: Uuid,
    pub category: Category,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateTag {
    pub id: Uuid,
    pub tag: Tag,
}
