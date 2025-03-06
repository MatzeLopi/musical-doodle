use serde::{Deserialize, Serialize};
pub mod users;
pub mod audios;

#[derive(Debug, Serialize, Deserialize)]
pub struct Payload<T> {
    pub payload: T,
}