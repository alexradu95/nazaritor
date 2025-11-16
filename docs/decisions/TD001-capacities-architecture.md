# TD001: Capacities-Inspired Architecture Implementation

**Status**: Implemented
**Date**: 2025-01-16
**Authors**: Development Team
**Related**: [Capacities Comparison](../future/capacities-comparison.md)

## Context

After analyzing [Capacities](https://capacities.io) - a sophisticated personal knowledge management tool - we identified several powerful architectural patterns that align with our vision for Nazaritor. These features provide a more connected, timeline-based, and queryable knowledge management experience.

### Key Capacities Features Analyzed

1. **Central Calendar & Timeline**: Every object is automatically linked to its creation date's daily note, creating a temporal index
2. **Tags vs. Collections**:
   - Tags: Cross-type categorization (e.g., "Important" tag across tasks, projects, people)
   - Collections: Within-type grouping (e.g., "Work Projects" collection groups specific projects)
3. **Everything is Connected**: Graph-based architecture where objects reference each other
4. **Query System**: Saved filters that create dynamic views of objects

## Decision

We will implement a **fresh database schema** (no migrations) incorporating:

### 1. Timeline & Auto-Linking System

**Implementation**:
- Virtual date columns (`created_date`, `updated_date`) for efficient date queries
- Auto-link ALL objects (except daily-note) to their creation day's daily note via `created_on` relation
- Timeline queries: `objectsCreatedOnDate()`, `objectsModifiedOnDate()`, `dailyNoteTimeline()`

**Rationale**:
- Provides temporal context for all work
- Daily notes become powerful hubs for reviewing "what happened when"
- Virtual columns avoid data duplication while enabling indexed date queries
- Skip auto-linking daily notes to avoid circular references

**Code Location**:
- Service: `apps/api/src/services/daily-note-helpers.ts`
- Router: `apps/api/src/trpc/routers/object.ts` (timeline procedures + auto-linking in create mutation)
- Schema: Virtual columns in `packages/database/migrations/0000_initial_schema.sql`

### 2. Tag System (Tags as Objects)

**Implementation**:
- Tags are first-class objects (`type: 'tag'`)
- Rich metadata: color, icon, description, category
- Link via `tagged_with` relations in relations table
- Full CRUD via dedicated tag router

**Alternatives Considered**:
- Hybrid approach (metadata.tags + tag objects) - Rejected due to complexity
- Metadata-only tags - Rejected due to lack of flexibility and graph connectivity

**Rationale**:
- Tags become part of the knowledge graph with full object capabilities
- Can establish relations between tags and other objects
- Supports rich tag metadata (colors, icons, descriptions)
- Enables querying by tags efficiently via SQL JOINs
- Migration from old metadata.tags can happen later (app not launched)

**Code Location**:
- Schema: `packages/schemas/src/objects/tag.ts`
- Router: `apps/api/src/trpc/routers/tag.ts`
- Procedures: `create`, `list`, `getById`, `tagObject`, `untagObject`, `objectsByTag`, `tagsForObject`

### 3. Collection System

**Implementation**:
- Collections are first-class objects (`type: 'collection'`)
- Metadata includes: `objectType` (what it groups), icon, color, defaultFilters, defaultSort
- Link via existing `member_of` relation type
- Objects can belong to multiple collections
- Type validation: object type must match collection's objectType

**Rationale**:
- Provides within-type organization (unlike tags which are cross-type)
- Supports visual customization (colors, icons)
- Default filters/sorting allow "smart collections"
- Reuses existing `member_of` relation pattern

**Code Location**:
- Schema: `packages/schemas/src/objects/collection.ts`
- Router: `apps/api/src/trpc/routers/collection.ts`
- Procedures: `create`, `list`, `getById`, `addObject`, `removeObject`, `objectsInCollection`, `collectionsForObject`

### 4. Query System (Phase 1)

**Implementation**:
- Queries are first-class objects (`type: 'query'`)
- Phase 1 scope: Basic object-type queries only
  - Filter by: objectType, properties, tags, dateRange, archived status
  - Sort by any field
  - Limit results
- Execution via dedicated query-executor service
- Test queries without saving via `query.test()` procedure

**Future Phases** (not yet implemented):
- Phase 2: Search queries (full-text search)
- Phase 3: Tag queries (objects tagged with X)
- Phase 4: Variable queries (context-aware, e.g., "my tasks")

**Rationale**:
- Start with simple, well-defined query type
- Saved queries enable consistent reporting and dashboards
- Post-processing complex filters in JS initially (optimize to SQL later)
- Query objects can themselves be tagged, collected, related

**Code Location**:
- Schema: `packages/schemas/src/objects/query.ts`
- Service: `apps/api/src/services/query-executor.ts`
- Router: `apps/api/src/trpc/routers/query.ts`
- Procedures: `create`, `list`, `getById`, `update`, `delete`, `execute`, `test`

### 5. Schema Architecture

**Fresh Schema Approach**:
- Deleted all incremental migrations (0000-0004)
- Created single comprehensive schema: `0000_initial_schema.sql`
- No backward compatibility concerns (app not launched)

**New Object Types**:
```typescript
type ObjectType =
  | 'project' | 'task' | 'resource' | 'daily-note'
  | 'calendar-entry' | 'person' | 'weblink' | 'page'
  | 'custom'
  | 'tag'        // NEW
  | 'collection' // NEW
  | 'query'      // NEW
```

**New Relation Types**:
```typescript
type RelationType =
  | 'parent_of' | 'child_of' | 'blocks' | 'blocked_by'
  | 'relates_to' | 'assigned_to' | 'member_of' | 'references'
  | 'contains' | 'attends' | 'knows'
  | 'created_on'  // NEW - Timeline
  | 'tagged_with' // NEW - Tags
```

**Virtual Columns**:
```sql
created_date TEXT GENERATED ALWAYS AS (date(created_at, 'unixepoch')) VIRTUAL,
updated_date TEXT GENERATED ALWAYS AS (date(updated_at, 'unixepoch')) VIRTUAL
```

**Indexes**:
```sql
CREATE INDEX idx_objects_type ON objects(type);
CREATE INDEX idx_objects_archived ON objects(archived);
CREATE INDEX idx_objects_created_date ON objects(created_date);
CREATE INDEX idx_objects_updated_date ON objects(updated_date);
CREATE INDEX idx_relations_type ON relations(relation_type);
CREATE INDEX idx_relations_from ON relations(from_object_id);
CREATE INDEX idx_relations_to ON relations(to_object_id);
CREATE INDEX idx_relations_composite ON relations(from_object_id, relation_type, to_object_id);
```

## Consequences

### Positive

1. **Temporal Context**: All objects automatically linked to creation date provides powerful timeline view
2. **Rich Tagging**: Tags with metadata (colors, icons) improve UX and organization
3. **Flexible Grouping**: Collections + Tags provide both within-type and cross-type organization
4. **Graph Connectivity**: Tags and collections as objects enable richer knowledge graph
5. **Query Power**: Saved queries enable dashboards, reports, and consistent filters
6. **Clean Start**: Fresh schema avoids migration complexity
7. **Performance**: Virtual columns and indexes enable efficient date/type queries
8. **Type Safety**: Full Zod schemas for all new object types with tRPC integration

### Negative

1. **Migration Complexity (Future)**: When migrating old metadata.tags, need to:
   - Create tag objects
   - Create tagged_with relations
   - Remove metadata.tags references
2. **Query Performance**: Phase 1 uses JS post-processing for complex filters (needs SQL optimization later)
3. **Storage Overhead**: Tags and collections as objects use more storage than metadata-only approach
4. **Graph Complexity**: More relation types increase graph traversal complexity

### Neutral

1. **No Backward Compatibility**: Clean break acceptable since app not launched
2. **Phase 1 Queries**: Limited to object-type queries initially (search/context queries later)
3. **Auto-linking All**: Every object gets `created_on` relation (small overhead)

## Implementation Checklist

- [x] Delete old migration files (0000-0004)
- [x] Create fresh schema `0000_initial_schema.sql`
- [x] Extend object types (tag, collection, query)
- [x] Extend relation types (created_on, tagged_with)
- [x] Create TagSchema, CollectionSchema, QuerySchema
- [x] Create daily-note-helpers service
- [x] Implement auto-linking in object.create mutation
- [x] Add timeline query procedures to object router
- [x] Create tag router with full CRUD
- [x] Create collection router with full CRUD
- [x] Create query-executor service
- [x] Create query router with execute/test procedures
- [x] Update main router (appRouter) with new routers
- [ ] Write comprehensive tests (timeline, tags, collections, queries)
- [ ] Update test setup for fresh schema
- [ ] Create implementation guide
- [ ] Document migration path from metadata.tags (future)

## References

- [Capacities Comparison Analysis](../future/capacities-comparison.md)
- [Implementation Guide](./IMPL-capacities-backend.md) (to be created)
- Database Schema: `packages/database/migrations/0000_initial_schema.sql`
- Object Schemas: `packages/schemas/src/objects/`
- API Routers: `apps/api/src/trpc/routers/`

## Related Decisions

- **Future TD002**: Search query implementation (Phase 2)
- **Future TD003**: Variable/context-aware queries (Phase 4)
- **Future TD004**: Migration strategy from metadata.tags to tag objects
- **Future TD005**: Query performance optimization (SQL vs JS filtering)

## Notes

This decision represents a significant architectural enhancement inspired by Capacities' approach to knowledge management. The implementation prioritizes:

1. **Graph thinking**: Everything is an object, everything can relate
2. **Temporal context**: Time is a first-class dimension
3. **Flexible organization**: Multiple ways to group and categorize
4. **Query power**: Dynamic, saved views of knowledge

The fresh schema approach was chosen explicitly to avoid migration complexity, as the app has not launched yet. This provides a clean foundation for these powerful features.
