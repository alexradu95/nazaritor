-- Migration: Add database constraints for data integrity
-- Adds CHECK constraints to enforce type safety and valid data at the database level

-- Objects table constraints

-- Ensure type is one of the valid object types
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
    'page'
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

-- Relations table constraints

-- Ensure relation_type is valid and prevent self-relations
CREATE TABLE IF NOT EXISTS relations_new (
  id TEXT PRIMARY KEY NOT NULL,
  from_object_id TEXT NOT NULL,
  to_object_id TEXT NOT NULL,
  relation_type TEXT NOT NULL CHECK (relation_type IN (
    'parent_of',
    'child_of',
    'blocks',
    'blocked_by',
    'relates_to',
    'assigned_to',
    'member_of',
    'references',
    'contains',
    'attends',
    'knows'
  )),
  metadata TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(metadata)),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  CHECK (from_object_id != to_object_id),
  FOREIGN KEY (from_object_id) REFERENCES objects(id) ON DELETE CASCADE,
  FOREIGN KEY (to_object_id) REFERENCES objects(id) ON DELETE CASCADE
);

-- Copy data from old table to new table
INSERT INTO relations_new SELECT * FROM relations;

-- Drop old table
DROP TABLE relations;

-- Rename new table to relations
ALTER TABLE relations_new RENAME TO relations;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS from_object_id_idx ON relations(from_object_id);
CREATE INDEX IF NOT EXISTS to_object_id_idx ON relations(to_object_id);
CREATE INDEX IF NOT EXISTS relation_type_idx ON relations(relation_type);
