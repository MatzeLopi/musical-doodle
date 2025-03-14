ALTER TABLE "users"
    ALTER COLUMN username SET DATA TYPE text COLLATE case_insensitive_d,
    ALTER COLUMN email SET DATA TYPE TEXT COLLATE case_insensitive_d;

ALTER TABLE "tracks"
    ALTER COLUMN title SET DATA TYPE text collate case_insensitive_d;
