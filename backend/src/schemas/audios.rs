use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct Categories {
    pub id: Uuid,
    pub name:String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Tags {
    pub id: Uuid,
    pub name:String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Audio {
    pub id: Uuid,
    pub title:String,
    pub creator:Uuid,
    pub description:String,
    pub audio_url:String,
    pub private:bool,
    pub category:Categories,
    pub tags:Vec<Tags>,

}

#[derive(Debug, Serialize, Deserialize)]
pub struct UploadAudio {
    pub title:String,
    pub description:String,
    pub category:Categories,
    pub tags:Vec<Uuid>,
    pub private:bool,

}