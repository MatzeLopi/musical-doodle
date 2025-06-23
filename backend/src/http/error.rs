use axum::http::header::WWW_AUTHENTICATE;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde_json::json;
use sqlx::error::DatabaseError;

#[derive(thiserror::Error, Debug)]
pub enum Error {
    #[error("authentication required")]
    Unauthorized,

    #[error("user may not perform that action")]
    Forbidden,

    // KORREKTUR 1: Muss einen Typ enthalten, hier `String`.
    // Der `#[error(...)]`-Text wird auch angepasst, um die Nachricht anzuzeigen.
    #[error("Not Found: {0}")]
    NotFound(String),

    #[error("Internal Server Error")]
    InternalServerError,

    #[error("an internal server error occurred")]
    Anyhow(#[from] anyhow::Error),

    #[error("conflict, resource already exists")]
    Conflict,

    #[error("Bad Request")]
    BadRequest,

    #[error("Database Error")]
    Sqlx(sqlx::Error),
}

// KORREKTUR 2: Hinzufügen der `Default`-Implementierung für einen Standard-Fehler.
impl Default for Error {
    fn default() -> Self {
        // Hier legen wir fest, dass unser "Standardfehler" ein NotFound
        // mit einer generischen Nachricht ist.
        Error::NotFound("The requested resource was not found.".to_string())
    }
}

impl From<sqlx::Error> for Error {
    fn from(err: sqlx::Error) -> Self {
        match &err {
            sqlx::Error::Database(db_err) => {
                if let Some(pg_err) = db_err.try_downcast_ref::<sqlx::postgres::PgDatabaseError>() {
                    match pg_err.code() {
                        "23505" => return Error::Conflict,
                        "23503" => return Error::BadRequest,
                        _ => {}
                    }
                }
                log::warn!("Unhandled database error: {:?}", err);
                Error::Sqlx(err)
            }
            _ => {
                log::error!("Unhandled SQLx error: {:?}", err);
                Error::Sqlx(err)
            }
        }
    }
}

impl Error {
    fn status_code(&self) -> StatusCode {
        match self {
            Self::Unauthorized => StatusCode::UNAUTHORIZED,
            Self::Forbidden => StatusCode::FORBIDDEN,
            // KORREKTUR 3: Der Match-Arm muss jetzt den inneren Wert mit `_` ignorieren.
            Self::NotFound(_) => StatusCode::NOT_FOUND,
            Self::InternalServerError => StatusCode::INTERNAL_SERVER_ERROR,
            Self::Sqlx(_) | Self::Anyhow(_) => StatusCode::INTERNAL_SERVER_ERROR,
            Self::Conflict => StatusCode::CONFLICT,
            Self::BadRequest => StatusCode::BAD_REQUEST,
        }
    }
}

impl IntoResponse for Error {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            Self::Unauthorized => {
                let body = Json(json!({ "error": self.to_string() }));
                return (self.status_code(), [(WWW_AUTHENTICATE, "JWT")], body).into_response();
            }
            // KORREKTUR 4: Dieser Arm funktioniert jetzt, weil die Enum-Definition korrekt ist.
            // Er extrahiert die spezifische Nachricht für eine bessere Fehlerausgabe.
            Self::NotFound(message) => (self.status_code(), message),

            _ => (self.status_code(), self.to_string()),
        };

        if matches!(self, Self::Sqlx(_) | Self::Anyhow(_)) {
            log::error!("Error Detail: {:?}", self);
        }

        let body = Json(json!({
            "error": error_message
        }));

        (status, body).into_response()
    }
}

pub trait ResultExt<T> {
    fn on_constraint(
        self,
        name: &str,
        f: impl FnOnce(Box<dyn DatabaseError>) -> Error,
    ) -> Result<T, Error>;
}

impl<T, E> ResultExt<T> for Result<T, E>
where
    E: Into<Error>,
{
    fn on_constraint(
        self,
        name: &str,
        map_err: impl FnOnce(Box<dyn DatabaseError>) -> Error,
    ) -> Result<T, Error> {
        self.map_err(|e| match e.into() {
            Error::Sqlx(sqlx::Error::Database(dbe)) if dbe.constraint() == Some(name) => {
                map_err(dbe)
            }
            e => e,
        })
    }
}
