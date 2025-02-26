use serde::{Deserialize, Serialize};
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

#[derive(Debug, Serialize, Deserialize)]
pub struct Category {
    pub id: Uuid,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Tag {
    pub id: Uuid,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Audio {
    pub id: Uuid,
    pub title: String,
    pub creator: Uuid,
    pub description: String,
    pub audio_url: String,
    pub private: bool,
    pub category: Category,
    pub tags: Vec<Tag>,
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
pub struct UpdateTags {
    pub id: Uuid,
    pub tags: Vec<Tag>,
}
