-- Migration: Add composite indexes for common query patterns
-- These indexes optimize frequently used filter combinations

-- Objects table composite indexes
-- Optimize filtering by type + archived (used in list queries)
CREATE INDEX IF NOT EXISTS idx_objects_type_archived
ON objects(type, archived);

-- Optimize filtering by archived + type (reverse order for different query patterns)
CREATE INDEX IF NOT EXISTS idx_objects_archived_type
ON objects(archived, type);

-- Optimize sorting by updated_at within type
CREATE INDEX IF NOT EXISTS idx_objects_type_updated_at
ON objects(type, updated_at DESC);

-- Relations table composite indexes
-- Optimize finding relations by object and type (most common pattern)
CREATE INDEX IF NOT EXISTS idx_relations_from_type
ON relations(from_object_id, relation_type);

CREATE INDEX IF NOT EXISTS idx_relations_to_type
ON relations(to_object_id, relation_type);

-- Optimize bidirectional relation lookups
CREATE INDEX IF NOT EXISTS idx_relations_from_to
ON relations(from_object_id, to_object_id);

-- Why these indexes matter:
-- 1. type + archived: "Show me all active projects" - very common
-- 2. from_object_id + relation_type: "Get all 'parent_of' relations for this object"
-- 3. Covering indexes reduce the need for table lookups (index-only scans)
