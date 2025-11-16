-- Rollback: Remove 'custom' object type from constraints
-- This reverts the changes from 0002_add_custom_type.sql

-- Recreate objects table without 'custom' type
CREATE TABLE IF NOT EXISTS objects_rollback (
  id TEXT PRIMARY KEY NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'project',
    'task',
    'resource',
    'daily-note',
    'calendar-entry',
    'person',
    'weblink',
    'page'
    -- 'custom' removed
  )),
  title TEXT NOT NULL CHECK (length(trim(title)) > 0),
  content TEXT,
  properties TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(properties)),
  metadata TEXT NOT NULL DEFAULT '{"tags":[],"favorited":false}' CHECK (json_valid(metadata)),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  archived INTEGER NOT NULL DEFAULT 0 CHECK (archived IN (0, 1))
);

-- Copy data from current table (excluding any custom types)
INSERT INTO objects_rollback
SELECT * FROM objects
WHERE type != 'custom';

-- Drop current table
DROP TABLE objects;

-- Rename rollback table to objects
ALTER TABLE objects_rollback RENAME TO objects;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS type_idx ON objects(type);
CREATE INDEX IF NOT EXISTS created_at_idx ON objects(created_at);
CREATE INDEX IF NOT EXISTS updated_at_idx ON objects(updated_at);
CREATE INDEX IF NOT EXISTS archived_idx ON objects(archived);

-- Recreate the update trigger
CREATE TRIGGER IF NOT EXISTS update_objects_updated_at
  AFTER UPDATE ON objects
  FOR EACH ROW
BEGIN
  UPDATE objects SET updated_at = unixepoch() WHERE id = NEW.id;
END;
