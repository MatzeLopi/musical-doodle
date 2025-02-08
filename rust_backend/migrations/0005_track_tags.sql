create table
    track_tags (
        track_id uuid not null references tracks (track_id) on delete cascade,
        tag_id uuid not null references tags (tag_id) on delete cascade,
        primary key (track_id, tag_id)
    );

create index idx_track_tags_track on track_tags (track_id);

create index idx_track_tags_tag on track_tags (tag_id);