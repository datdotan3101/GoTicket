-- Migration: 008_google_auth.sql
-- Description: Add google_id and drop NOT NULL constraint on password_hash to support Google Sign-in.

ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
