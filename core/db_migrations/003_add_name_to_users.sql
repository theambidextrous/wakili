-- 003_add_name_to_users.sql
-- Adds `name` column to users table and backfills it from username

BEGIN;

ALTER TABLE IF EXISTS users
    ADD COLUMN IF NOT EXISTS name VARCHAR(100);

-- Backfill name from username: 'john_doe' -> 'John Doe'
UPDATE users
SET name = initcap(replace(username, '_', ' '))
WHERE name IS NULL;

COMMIT;
