-- Migration: Add 'custom' object type to constraints
-- Allows user-defined custom objects while maintaining type safety

-- Recreate objects table with updated type constraint
CREATE TABLE IF NOT EXISTS objects_new (
  id TEXT PRIMARY KEY NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'project',
    'task',
    'resource',
    'daily-note',
    'calendar-entry',
    'person',
    'weblink',
    'page',
    'custom'
  )),
  title TEXT NOT NULL CHECK (length(trim(title)) > 0),
  content TEXT,
  properties TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(properties)),
  metadata TEXT NOT NULL DEFAULT '{"tags":[],"archived":false,"favorited":false}' CHECK (json_valid(metadata)),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  archived INTEGER NOT NULL DEFAULT 0 CHECK (archived IN (0, 1))
);

-- Copy data from old table to new table
INSERT INTO objects_new SELECT * FROM objects;

-- Drop old table
DROP TABLE objects;

-- Rename new table to objects
ALTER TABLE objects_new RENAME TO objects;

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
