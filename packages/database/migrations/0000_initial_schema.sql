-- Initial schema with all Capacities-like features built-in
-- Created: 2025-01-15
-- This replaces all previous migrations (0000-0004)

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- ============================================================================
-- Objects Table
-- ============================================================================
-- Stores all object types: projects, tasks, resources, daily notes, etc.
-- New types: tag, collection, query (for Capacities features)

CREATE TABLE IF NOT EXISTS objects (
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
    'custom',
    'tag',
    'collection',
    'query'
  )),
  title TEXT NOT NULL CHECK (length(trim(title)) > 0),
  content TEXT,  -- Rich text content (Lexical JSON)

  -- Properties: Type-specific fields stored as JSON
  properties TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(properties)),

  -- Metadata: System fields
  metadata TEXT NOT NULL DEFAULT '{"tags":[],"favorited":false}' CHECK (json_valid(metadata)),

  -- Timestamps (as integers for SQLite)
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),

  -- Archived flag (top-level for indexing)
  archived INTEGER NOT NULL DEFAULT 0 CHECK (archived IN (0, 1)),

  -- Virtual date columns for efficient date queries (NEW for timeline feature)
  created_date TEXT GENERATED ALWAYS AS (date(created_at, 'unixepoch')) VIRTUAL,
  updated_date TEXT GENERATED ALWAYS AS (date(updated_at, 'unixepoch')) VIRTUAL
);

-- ============================================================================
-- Relations Table
-- ============================================================================
-- Stores connections between objects
-- New relation types: created_on (timeline), tagged_with (tags)

CREATE TABLE IF NOT EXISTS relations (
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
    'knows',
    'created_on',    -- NEW: Object was created on this day (links to daily-note)
    'tagged_with'    -- NEW: Object is tagged with a tag object
  )),

  -- Relation metadata (e.g., strength, bidirectional, auto-created)
  metadata TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(metadata)),

  created_at INTEGER NOT NULL DEFAULT (unixepoch()),

  -- Constraints
  CHECK (from_object_id != to_object_id),  -- Prevent self-relations
  FOREIGN KEY (from_object_id) REFERENCES objects(id) ON DELETE CASCADE,
  FOREIGN KEY (to_object_id) REFERENCES objects(id) ON DELETE CASCADE
);

-- ============================================================================
-- Indexes on Objects Table
-- ============================================================================

-- Single-column indexes
CREATE INDEX IF NOT EXISTS idx_type ON objects(type);
CREATE INDEX IF NOT EXISTS idx_created_at ON objects(created_at);
CREATE INDEX IF NOT EXISTS idx_updated_at ON objects(updated_at);
CREATE INDEX IF NOT EXISTS idx_archived ON objects(archived);

-- Note: Cannot index VIRTUAL columns in SQLite
-- Virtual date columns (created_date, updated_date) are queryable but not indexed
-- The underlying timestamp columns (created_at, updated_at) ARE indexed above

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_objects_type_archived ON objects(type, archived);
CREATE INDEX IF NOT EXISTS idx_objects_archived_type ON objects(archived, type);
CREATE INDEX IF NOT EXISTS idx_objects_type_updated_at ON objects(type, updated_at DESC);

-- Unique index for daily notes (one per date)
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_note_unique_date
  ON objects (json_extract(properties, '$.date.value'))
  WHERE type = 'daily-note';

-- ============================================================================
-- Indexes on Relations Table
-- ============================================================================

-- Single-column indexes
CREATE INDEX IF NOT EXISTS idx_from_object_id ON relations(from_object_id);
CREATE INDEX IF NOT EXISTS idx_to_object_id ON relations(to_object_id);
CREATE INDEX IF NOT EXISTS idx_relation_type ON relations(relation_type);

-- Composite indexes for relation queries
CREATE INDEX IF NOT EXISTS idx_relations_from_type ON relations(from_object_id, relation_type);
CREATE INDEX IF NOT EXISTS idx_relations_to_type ON relations(to_object_id, relation_type);
CREATE INDEX IF NOT EXISTS idx_relations_from_to ON relations(from_object_id, to_object_id);

-- ============================================================================
-- Triggers
-- ============================================================================

-- Auto-update updated_at timestamp on object changes
CREATE TRIGGER IF NOT EXISTS update_objects_updated_at
  AFTER UPDATE ON objects
  FOR EACH ROW
BEGIN
  UPDATE objects SET updated_at = unixepoch() WHERE id = NEW.id;
END;

-- ============================================================================
-- Migrations Tracking Table
-- ============================================================================
-- Track which migrations have been applied

CREATE TABLE IF NOT EXISTS _migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  applied_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Record this migration
INSERT INTO _migrations (name) VALUES ('0000_initial_schema.sql');
