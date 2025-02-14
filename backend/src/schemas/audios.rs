use serde::{Deserialize, Serialize};
use uuid::Uuid;

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
pub struct UploadAudio {
    pub title: String,
    pub description: String,
    pub category: Category,
    pub tags: Vec<Tag>,
    pub private: bool,
}

impl UploadAudio {
    pub fn default() -> Self {
        Self {
            title: "".to_string(),
            description: "".to_string(),
            category: Category {
                id: Uuid::new_v4(),
                name: "".to_string(),
            },
            tags: vec![],
            private: false,
        }
    }
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
