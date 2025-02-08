-- Track Likes (Users can like tracks)
create table
    track_likes (
        user_id uuid not null references users (user_id) on delete cascade,
        track_id uuid not null references tracks (track_id) on delete cascade,
        primary key (user_id, track_id)
    );

-- User Favorites
create table
    user_favorites (
        user_id uuid not null references users (user_id) on delete cascade,
        track_id uuid not null references tracks (track_id) on delete cascade,
        primary key (user_id, track_id)
    );

-- Last Played Tracks
create table
    last_played_tracks (
        user_id uuid not null references users (user_id) on delete cascade,
        track_id uuid not null references tracks (track_id) on delete cascade,
        last_played timestamptz not null default now (),
        primary key (user_id, track_id)
    );