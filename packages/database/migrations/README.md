# Database Migrations

This directory contains all database migrations for the Nazaritor project.

## Migration Strategy

### Naming Convention

Migrations are numbered sequentially with descriptive names:
- `0000_initial.sql` - Initial database schema
- `0001_add_constraints.sql` - Database constraints for data integrity
- `0002_add_custom_type.sql` - Support for custom object types
- `0003_unique_daily_note_dates.sql` - Unique constraint for daily notes
- `0004_add_composite_indexes.sql` - Performance optimization indexes

### Rollback Strategy

Each migration has a corresponding rollback file with the `.down.sql` suffix that reverses its changes:
- `0001_add_constraints.down.sql` - Removes constraints added in 0001
- `0002_add_custom_type.down.sql` - Removes custom type support
- `0003_unique_daily_note_dates.down.sql` - Removes unique constraint
- `0004_add_composite_indexes.down.sql` - Removes composite indexes

**Note**: `0000_initial.sql` has no rollback - rolling back the initial migration means dropping all tables.

### Running Migrations

**Apply migrations:**
```bash
bun run packages/database/scripts/migrate.ts
```

**Rollback last migration:**
```bash
bun run packages/database/scripts/rollback.ts
```

**Rollback to specific migration:**
```bash
bun run packages/database/scripts/rollback.ts --to=0002
```

### Creating New Migrations

1. Create the migration file: `000X_description.sql`
2. Create the rollback file: `000X_description.down.sql`
3. Add migration to test setup: `apps/api/tests/setup.ts`
4. Test both up and down migrations

### Migration Best Practices

1. **Always create rollback migrations** - Every forward migration needs a down migration
2. **Test rollbacks** - Ensure down migrations actually work
3. **Atomic changes** - Each migration should do one logical thing
4. **No data loss** - Rollbacks should preserve data when possible
5. **Sequential numbering** - Never skip numbers or reorder existing migrations
6. **Idempotent** - Migrations should be safe to run multiple times (use `IF NOT EXISTS`)

### Migration Order

Migrations are applied in numerical order. The system tracks which migrations have been applied to avoid re-running them.

### Schema Changes

For schema changes that require data migration:
1. Add new columns/tables (forward migration)
2. Migrate data in separate step if needed
3. Remove old columns/tables (forward migration)
4. Reverse process in down migration

### Example Migration Pair

**Forward (0005_add_priority_field.sql):**
```sql
-- Add priority field to objects table
ALTER TABLE objects ADD COLUMN priority TEXT DEFAULT 'medium';

-- Add index for priority
CREATE INDEX idx_objects_priority ON objects(priority);
```

**Rollback (0005_add_priority_field.down.sql):**
```sql
-- Remove priority index
DROP INDEX IF EXISTS idx_objects_priority;

-- Remove priority field (SQLite requires table recreation)
CREATE TABLE objects_temp AS SELECT
  id, type, title, content, properties, metadata,
  created_at, updated_at, archived
FROM objects;

DROP TABLE objects;
ALTER TABLE objects_temp RENAME TO objects;

-- Recreate indexes
CREATE INDEX type_idx ON objects(type);
CREATE INDEX created_at_idx ON objects(created_at);
CREATE INDEX updated_at_idx ON objects(updated_at);
CREATE INDEX archived_idx ON objects(archived);
```

## Troubleshooting

**Migration failed mid-way:**
1. Check the error message
2. Fix the SQL
3. Rollback to last known good state
4. Reapply fixed migration

**Can't rollback:**
1. Check that `.down.sql` file exists
2. Verify the rollback SQL is correct
3. Manual intervention may be required

**Conflict between migrations:**
1. Ensure migrations are applied in order
2. Check for missing prerequisite migrations
3. Verify database state matches expected schema
