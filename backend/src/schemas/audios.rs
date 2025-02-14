use serde::{Deserialize, Serialize};
use tokio_util::bytes::Bytes;
use uuid::Uuid;

#[derive(Debug)]
pub struct AudioUpload {
    pub filename: Option<String>,
    pub title: Option<String>,
    pub description: Option<String>,
    pub category: Option<Category>,
    pub tags: Vec<Tag>,
    pub private: Option<bool>,

    pub bytes: Bytes,
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
