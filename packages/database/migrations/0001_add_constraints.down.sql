-- Rollback: Remove database constraints
-- This reverts the changes from 0001_add_constraints.sql

-- Note: SQLite doesn't support ALTER TABLE DROP CONSTRAINT
-- So we need to recreate tables without constraints

-- Objects table without constraints
CREATE TABLE IF NOT EXISTS objects_rollback (
  id TEXT PRIMARY KEY NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  properties TEXT NOT NULL DEFAULT '{}',
  metadata TEXT NOT NULL DEFAULT '{"tags":[],"favorited":false}',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  archived INTEGER NOT NULL DEFAULT 0
);

-- Copy data from constrained table
INSERT INTO objects_rollback SELECT * FROM objects;

-- Drop constrained table
DROP TABLE objects;

-- Rename rollback table to objects
ALTER TABLE objects_rollback RENAME TO objects;

-- Recreate basic indexes (from 0000_initial.sql)
CREATE INDEX IF NOT EXISTS type_idx ON objects(type);
CREATE INDEX IF NOT EXISTS created_at_idx ON objects(created_at);
CREATE INDEX IF NOT EXISTS updated_at_idx ON objects(updated_at);
CREATE INDEX IF NOT EXISTS archived_idx ON objects(archived);

-- Recreate update trigger
CREATE TRIGGER IF NOT EXISTS update_objects_updated_at
  AFTER UPDATE ON objects
  FOR EACH ROW
BEGIN
  UPDATE objects SET updated_at = unixepoch() WHERE id = NEW.id;
END;

-- Relations table without constraints
CREATE TABLE IF NOT EXISTS relations_rollback (
  id TEXT PRIMARY KEY NOT NULL,
  from_object_id TEXT NOT NULL,
  to_object_id TEXT NOT NULL,
  relation_type TEXT NOT NULL,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (from_object_id) REFERENCES objects(id) ON DELETE CASCADE,
  FOREIGN KEY (to_object_id) REFERENCES objects(id) ON DELETE CASCADE
);

-- Copy data from constrained table
INSERT INTO relations_rollback SELECT * FROM relations;

-- Drop constrained table
DROP TABLE relations;

-- Rename rollback table to relations
ALTER TABLE relations_rollback RENAME TO relations;

-- Recreate basic indexes
CREATE INDEX IF NOT EXISTS from_object_id_idx ON relations(from_object_id);
CREATE INDEX IF NOT EXISTS to_object_id_idx ON relations(to_object_id);
CREATE INDEX IF NOT EXISTS relation_type_idx ON relations(relation_type);
