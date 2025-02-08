create table
    track_plays (
        play_id uuid primary key default gen_random_uuid (),
        track_id uuid not null references tracks (track_id) on delete cascade,
        played_at timestamptz not null default now ()
    );