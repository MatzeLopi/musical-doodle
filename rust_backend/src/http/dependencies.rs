use crate::http::error::Error as HTTPError;
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use axum::extract::Request;

async fn hash_password(password: String) -> String {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();

    let password_hash: String = argon2
        .hash_password(password.as_bytes(), &salt)
        .unwrap()
        .to_string();

    return password_hash;
}

async fn validate_password(password: &str) -> Result<bool, E> {
    let parsed_hash = PasswordHash::new(&password)?;
    let result = Argon2::default()
        .verify_password(password, &parsed_hash)
        .is_ok();

    if result {
        return Ok(true);
    } else {
        return Err(HTTPError::Unauthorized);
    }
}

async fn validate_csfr(request: Request) -> bool {
    // Get the cookie
    let client_token = request.headers().get("X-CSRF-TOKEN").unwrap();
    let server_token = request.headers().get("csfr_token").unwrap();

    if client_token != server_token {
        return false;
    } else {
        return true;
    }
}
