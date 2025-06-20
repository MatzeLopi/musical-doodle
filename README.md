# Musical Doodle

This is a personal project to build a full-stack audio streaming application. The main goal is to practice and learn by building something from scratch, focusing on a Rust backend and a React/Next.js frontend.

## Tech Stack

The project is divided into two main parts: a backend API and a frontend web application.

| Area         | Technology                                   |
| :----------- | :------------------------------------------- |
| **Frontend** | React, Next.js, TypeScript, Tailwind CSS     |
| **Backend** | Rust, Axum, Tokio, SQLx                      |
| **Database** | PostgreSQL                                   |
| **Storage** | S3-Compatible Object Storage (for audio files) |

## Current Features

This is a work-in-progress, but the following features are currently implemented:

#### Backend Features

  * **REST API**: Built with the Axum framework in Rust.
  * **Database**: Asynchronous queries to a PostgreSQL database using `sqlx`.
  * **Authentication**: JWT-based authentication for securing routes, along with CSRF protection.
  * **User Management**: Endpoints for user creation, login, and profile data retrieval.
  * **Audio Upload**: Handles chunked file uploads, processes them with `ffmpeg`, and moves them to cloud storage.
  * **Search Functionality**: An endpoint to search for tracks based on various filters like tags, categories, title, and creator.

#### Frontend Features

  * **UI**: Built with Next.js and styled with Tailwind CSS.
  * **State Management**: Uses React Context for handling global auth and player state.
  * **Audio Player**: A client-side audio player with track progress and playback controls.
  * **Dynamic UI Elements**: Includes an auto-hiding navigation bar and auto-scrolling carousels for displaying tracks.
  * **User Interaction**: Features user registration, login, file upload, and a search page with multi-select filters.

## Project Structure

The repository is a monorepo containing the frontend and backend applications.

```
/
├── backend/         # The Rust/Axum backend application
│   ├── src/
│   │   ├── crud/    # Database query logic
│   │   ├── http/    # Axum route handlers and middleware
│   │   └── ...
│   ├── migrations/  # SQL database schema migrations
│   └── Cargo.toml
│
└── frontend/        # The React/Next.js frontend application
    ├── src/
    │   ├── components/
    │   ├── contexts/
    │   ├── pages/
    │   └── ...
    └── package.json
```