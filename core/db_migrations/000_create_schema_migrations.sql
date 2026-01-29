-- 000_create_schema_migrations.sql
-- Creates the schema_migrations table used to track applied migrations

CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(100) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
