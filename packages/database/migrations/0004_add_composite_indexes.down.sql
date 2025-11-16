-- Rollback: Remove composite indexes
-- This reverts the changes from 0004_add_composite_indexes.sql

-- Drop objects table composite indexes
DROP INDEX IF EXISTS idx_objects_type_archived;
DROP INDEX IF EXISTS idx_objects_archived_type;
DROP INDEX IF EXISTS idx_objects_type_updated_at;

-- Drop relations table composite indexes
DROP INDEX IF EXISTS idx_relations_from_type;
DROP INDEX IF EXISTS idx_relations_to_type;
DROP INDEX IF EXISTS idx_relations_from_to;
