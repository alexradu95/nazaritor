-- Rollback: Remove unique constraint on daily note dates
-- This reverts the changes from 0003_unique_daily_note_dates.sql

-- Drop the unique index
DROP INDEX IF EXISTS idx_daily_note_unique_date;
