-- Add the enum type first
DO $$ BEGIN
  CREATE TYPE track_status AS ENUM ('pending', 'uploading', 'complete', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Now, add the status column with the enum type
ALTER TABLE tracks ADD COLUMN status track_status NOT NULL DEFAULT 'pending';