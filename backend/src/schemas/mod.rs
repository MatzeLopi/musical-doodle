use serde::{Deserialize, Serialize};
pub mod audios;
pub mod metadata;
pub mod users;

#[derive(Debug, Serialize, Deserialize)]
pub struct Payload<T> {
    pub payload: T,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Page<T> {
    pub current_page: f64,
    pub page_size: f64,
    pub items: Vec<T>,
    pub has_more: bool,
}
