use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use axum::extract::Request;
use uuid::Uuid;
use crate::http::error::Error as HTTPError;
use hmac::Hmac;
use sha2::Sha384;
use crate::http::AppState;
use jwt::{SignWithKey, VerifyWithKey};
use time::OffsetDateTime;


const DEFAULT_SESSION_DURATION:time::Duration = time::Duration::weeks(1);

const DEFAULT_AUTH:&str = "Bearer";


pub enum TokenType {
    Bearer,
    JWT,
}
pub struct Token {
    pub access_token: String,
    pub token_type: TokenType,
}

// Use in handler if Auth is needed
pub struct AuthUser {
    pub user_id:Uuid,
}

// Use in handler if auth is optional
pub struct OptionalAuthUser(pub Option<AuthUser>);

#[derive(serde::Serialize, serde::Deserialize)]
struct AuthClaims {
    user_id: Uuid,
    exp: i64,
}

impl AuthUser {
    pub(in crate::http) fn to_jwt(&self, context: &AppState) -> String {
        let hmac = Hmac::<Sha384>::new_from_slice(context.config.hmac_key.as_bytes())
            .expect("HMAC-SHA-384 can accept any key length");

        AuthClaims {
            user_id: self.user_id,
            exp: (OffsetDateTime::new_utc() + DEFAULT_SESSION_DURATION).unix_timestamp(),
        }.sing_with_key(&hmc).expect("JWT signing can not fail.")
    }


}

async fn hash_password(password: String) -> String {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();

    let password_hash: String = argon2
        .hash_password(password.as_bytes(), &salt)
        .unwrap()
        .to_string();

    return password_hash;
}

async fn validate_password(password: &str) -> Result<bool, HTTPError> {
    let parsed_hash = PasswordHash::new(&password).unwrap();
    let result = Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .is_ok();

    if result {
        return Ok(true);
    } else {
        return Err(HTTPError::Unauthorized);
    }
}

pub async fn validate_csrf(request: &Request) -> bool {
    let client_token = request.headers().get("X-CSRF-TOKEN");
    let server_token = request.headers().get("csfr_token");

    // Only return true if both tokens exist and are equal
    match (client_token, server_token) {
        (Some(client_token), Some(server_token)) => client_token == server_token,
        _ => false,
    }
}


