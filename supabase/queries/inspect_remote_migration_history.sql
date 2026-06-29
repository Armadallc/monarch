-- Run in Supabase SQL Editor (linked project) to see what the remote DB has recorded.
-- Use this before/after aligning local migration filenames with `supabase migration repair`.

SELECT *
FROM supabase_migrations.schema_migrations
ORDER BY version;
