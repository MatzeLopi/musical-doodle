create table
    categories (
        category_id uuid primary key default gen_random_uuid (),
        name text collate "case_insensitive" unique not null
    );

create table
    tags (
        tag_id uuid primary key default gen_random_uuid (),
        name text collate "case_insensitive" unique not null
    );

create index idx_tags_name on tags (name);