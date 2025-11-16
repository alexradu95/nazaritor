-- Migration: Ensure unique dates for daily notes
-- This prevents duplicate daily notes for the same date
-- Uses a unique partial index on the date property (JSON extract) where type is 'daily-note'

-- Create unique index on date property for daily-note objects
-- The index ensures only one daily note can exist per date
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_note_unique_date
ON objects (json_extract(properties, '$.date.value'))
WHERE type = 'daily-note';

-- Why unique daily notes are important:
-- 1. Business Logic: One journal entry per day is the expected behavior
-- 2. Data Integrity: Prevents confusion from duplicate entries
-- 3. Query Reliability: Ensures deterministic "find today's note" queries
