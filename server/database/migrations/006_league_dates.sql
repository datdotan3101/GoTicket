-- Add start_date and end_date columns to leagues table
ALTER TABLE leagues
  ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;
