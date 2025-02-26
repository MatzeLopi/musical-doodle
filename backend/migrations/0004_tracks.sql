create table
    tracks (
        track_id uuid primary key,
        creator_id uuid not null references users (user_id) on delete cascade,
        title text collate "case_insensitive" not null,
        private boolean not null default false,
        description text,
        category_id uuid not null references categories (category_id) on delete restrict,
        audio_url text not null, -- link to s3 or other storage
        created_at timestamptz not null default now (),
        updated_at timestamptz
    );

select
    trigger_updated_at ('"tracks"');

create index idx_tracks_category on tracks (category_id);