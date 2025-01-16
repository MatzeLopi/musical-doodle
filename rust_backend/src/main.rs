use axum::{routing::get, Router};

async fn test1() -> String {
    return String::from("Hello, World!");
}

#[tokio::main]
async fn main() {
    // build our application with a single route
    let app: Router = Router::new().route("/", get(test1));

    // run our app with hyper, listening globally on port 8000
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
