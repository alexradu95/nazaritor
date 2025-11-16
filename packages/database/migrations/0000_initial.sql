-- Initial migration for Nazaritor (SQLite)
-- Creates objects and relations tables

-- Objects table
CREATE TABLE IF NOT EXISTS objects (
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

-- Create indexes for objects
CREATE INDEX IF NOT EXISTS type_idx ON objects(type);
CREATE INDEX IF NOT EXISTS created_at_idx ON objects(created_at);
CREATE INDEX IF NOT EXISTS updated_at_idx ON objects(updated_at);
CREATE INDEX IF NOT EXISTS archived_idx ON objects(archived);

-- Relations table
CREATE TABLE IF NOT EXISTS relations (
  id TEXT PRIMARY KEY NOT NULL,
  from_object_id TEXT NOT NULL,
  to_object_id TEXT NOT NULL,
  relation_type TEXT NOT NULL,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (from_object_id) REFERENCES objects(id) ON DELETE CASCADE,
  FOREIGN KEY (to_object_id) REFERENCES objects(id) ON DELETE CASCADE
);

-- Create indexes for relations
CREATE INDEX IF NOT EXISTS from_object_id_idx ON relations(from_object_id);
CREATE INDEX IF NOT EXISTS to_object_id_idx ON relations(to_object_id);
CREATE INDEX IF NOT EXISTS relation_type_idx ON relations(relation_type);

-- Create trigger to update updated_at automatically
CREATE TRIGGER IF NOT EXISTS update_objects_updated_at
  AFTER UPDATE ON objects
  FOR EACH ROW
BEGIN
  UPDATE objects SET updated_at = unixepoch() WHERE id = NEW.id;
END;
