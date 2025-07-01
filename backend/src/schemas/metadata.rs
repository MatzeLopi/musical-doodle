use crate::crud::metadata::MetadataInterval;
use serde::{Deserialize, Serialize};

pub struct MetaDataQuery {
    pub interval: MetadataInterval,
    pub limit: Option<i64>,
}
