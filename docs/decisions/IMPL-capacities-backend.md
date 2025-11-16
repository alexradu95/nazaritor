# Implementation Guide: Capacities-Inspired Features

**Related**: [TD001-capacities-architecture.md](./TD001-capacities-architecture.md)
**Audience**: Backend Developers, Frontend Developers integrating with API
**Date**: 2025-01-16

## Overview

This guide provides practical examples for using the new Capacities-inspired features in Nazaritor:

1. **Timeline & Auto-Linking**: Objects automatically linked to daily notes
2. **Tags**: Cross-type categorization with rich metadata
3. **Collections**: Within-type grouping and organization
4. **Queries**: Saved filters for dynamic object views

All examples use tRPC v11 with type-safe procedures.

## Prerequisites

- tRPC client configured and connected to backend
- Understanding of base object system (see [Architecture Overview](../current_status/architecture.md))
- Fresh database with `0000_initial_schema.sql` applied

## Timeline & Auto-Linking

### How It Works

Every object created (except daily-note objects) is automatically linked to its creation day's daily note via a `created_on` relation.

**Backend Implementation** (`apps/api/src/trpc/routers/object.ts:72-92`):

```typescript
// In object.create mutation
const newObject = result[0]

// AUTO-LINKING: Skip for daily-note objects to avoid circular references
if (input.type !== 'daily-note') {
  try {
    const todayDate = getTodayDateString() // Returns YYYY-MM-DD
    const dailyNote = await getOrCreateDailyNote(todayDate, ctx.db)

    await ctx.db.insert(relations).values({
      fromObjectId: newObject.id,
      toObjectId: dailyNote.id,
      relationType: 'created_on',
      metadata: { auto: true }, // Mark as auto-created
    })
  } catch (error) {
    console.error('Failed to auto-link to daily note:', error)
    // Don't fail object creation if linking fails
  }
}
```

### Frontend Usage

**Create any object - it auto-links to today's daily note:**

```typescript
// Create a project - automatically linked to today
const project = await trpc.object.create.mutate({
  type: 'project',
  title: 'Q1 Marketing Campaign',
  content: 'Launch new product campaign',
  properties: {
    status: 'planning',
    priority: 'high',
  },
})
// Behind the scenes: project is now linked to today's daily note via 'created_on' relation
```

**Query timeline: Get all objects created on a specific date:**

```typescript
// Get everything created on 2025-01-15
const objects = await trpc.object.objectsCreatedOnDate.query({
  date: '2025-01-15', // YYYY-MM-DD format
})
// Returns: [project1, task1, person1, ...] - all objects created that day
```

**Query timeline: Get all objects for a daily note:**

```typescript
// Get daily note first
const dailyNote = await trpc.object.getById.query({
  id: 'daily-note-id',
})

// Get its timeline (all objects created that day)
const timeline = await trpc.object.dailyNoteTimeline.query({
  dailyNoteId: dailyNote.id,
})
// Returns: All objects linked via 'created_on' relation
```

**Query by modification date:**

```typescript
// Get all objects modified on 2025-01-15
const modified = await trpc.object.objectsModifiedOnDate.query({
  date: '2025-01-15',
})
```

### Database Schema

**Virtual Date Columns** (`0000_initial_schema.sql`):

```sql
CREATE TABLE objects (
  -- ... other columns ...
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,

  -- Virtual columns for efficient date queries (indexed)
  created_date TEXT GENERATED ALWAYS AS (date(created_at, 'unixepoch')) VIRTUAL,
  updated_date TEXT GENERATED ALWAYS AS (date(updated_at, 'unixepoch')) VIRTUAL
);

CREATE INDEX idx_objects_created_date ON objects(created_date);
CREATE INDEX idx_objects_updated_date ON objects(updated_date);
```

## Tags System

### Concept

Tags are **first-class objects** (`type: 'tag'`) that provide cross-type categorization. Unlike collections (which group objects of the same type), tags can be applied to any object type.

### Schema

**Tag Object** (`packages/schemas/src/objects/tag.ts`):

```typescript
{
  id: string
  type: 'tag'
  title: string // Tag name (e.g., "Important", "Work", "Personal")
  content: string // Optional description
  properties: {
    color?: string      // Hex color for UI (e.g., "#FF5733")
    icon?: string       // Icon name or emoji (e.g., "⭐", "work-icon")
    description?: string
    category?: string   // Group tags (e.g., "Status", "Priority")
  }
  archived: boolean
  metadata: { ... }
}
```

### Frontend Usage

**Create tags:**

```typescript
// Create a priority tag
const importantTag = await trpc.tag.create.mutate({
  title: 'Important',
  content: 'High priority items requiring immediate attention',
  properties: {
    color: '#FF5733',
    icon: '⭐',
    category: 'Priority',
  },
})

// Create a context tag
const workTag = await trpc.tag.create.mutate({
  title: 'Work',
  content: 'Work-related items',
  properties: {
    color: '#3498DB',
    icon: '💼',
    category: 'Context',
  },
})
```

**List all tags:**

```typescript
const tags = await trpc.tag.list.query()
// Returns all non-archived tags
```

**Tag an object:**

```typescript
// Apply "Important" tag to a project
await trpc.tag.tagObject.mutate({
  objectId: project.id,
  tagId: importantTag.id,
})

// Apply "Work" tag to same project (multiple tags allowed)
await trpc.tag.tagObject.mutate({
  objectId: project.id,
  tagId: workTag.id,
})
```

**Untag an object:**

```typescript
await trpc.tag.untagObject.mutate({
  objectId: project.id,
  tagId: importantTag.id,
})
```

**Get all objects with a specific tag:**

```typescript
// Get all "Important" items (across all object types)
const importantItems = await trpc.tag.objectsByTag.query({
  tagId: importantTag.id,
})
// Returns: [project1, task5, person3, ...] - any object type
```

**Get all tags for an object:**

```typescript
const projectTags = await trpc.tag.tagsForObject.query({
  objectId: project.id,
})
// Returns: [importantTag, workTag, ...]
```

### Backend Implementation

**Tag Relation** (`apps/api/src/trpc/routers/tag.ts:157-162`):

```typescript
// Create 'tagged_with' relation
await ctx.db.insert(relations).values({
  fromObjectId: input.objectId, // The object being tagged
  toObjectId: input.tagId,       // The tag object
  relationType: 'tagged_with',
  metadata: {},
})
```

**Query by Tag** (using SQL JOIN):

```typescript
// Find all objects via 'tagged_with' relation
const result = await ctx.db
  .select({ object: objects })
  .from(relations)
  .innerJoin(objects, eq(relations.fromObjectId, objects.id))
  .where(
    and(
      eq(relations.toObjectId, input.tagId),
      eq(relations.relationType, 'tagged_with'),
      eq(objects.archived, false) // Exclude archived
    )
  )
  .orderBy(desc(objects.createdAt))
```

## Collections System

### Concept

Collections are **first-class objects** (`type: 'collection'`) that group objects **within the same type**. They provide organizational structure within a specific object type.

**Examples**:
- "Work Projects" collection groups specific project objects
- "High Priority Tasks" collection groups specific task objects
- "Team Members" collection groups specific person objects

### Schema

**Collection Object** (`packages/schemas/src/objects/collection.ts`):

```typescript
{
  id: string
  type: 'collection'
  title: string // Collection name (e.g., "Work Projects")
  content: string // Optional description
  properties: {
    objectType: string           // REQUIRED: Which type this groups (e.g., "project")
    icon?: string
    color?: string
    description?: string
    defaultFilters?: {           // Optional smart collection filters
      properties?: Record<string, any>
      tags?: string[]
    }
    defaultSort?: {
      field: string
      order: 'asc' | 'desc'
    }
  }
  archived: boolean
  metadata: { ... }
}
```

### Frontend Usage

**Create collections:**

```typescript
// Create a "Work Projects" collection
const workProjects = await trpc.collection.create.mutate({
  title: 'Work Projects',
  content: 'All work-related projects',
  properties: {
    objectType: 'project', // MUST specify which type it groups
    icon: '💼',
    color: '#3498DB',
    defaultSort: {
      field: 'createdAt',
      order: 'desc',
    },
  },
})

// Create a "High Priority" task collection
const highPriorityTasks = await trpc.collection.create.mutate({
  title: 'High Priority Tasks',
  content: 'Urgent tasks requiring immediate attention',
  properties: {
    objectType: 'task',
    icon: '🔥',
    color: '#E74C3C',
  },
})
```

**List collections:**

```typescript
// Get all collections
const allCollections = await trpc.collection.list.query()

// Get only project collections
const projectCollections = await trpc.collection.list.query({
  objectType: 'project',
})
```

**Add object to collection:**

```typescript
// Add a project to "Work Projects" collection
await trpc.collection.addObject.mutate({
  objectId: project.id,
  collectionId: workProjects.id,
})

// ERROR: Type mismatch - can't add task to project collection
await trpc.collection.addObject.mutate({
  objectId: task.id,
  collectionId: workProjects.id, // Will throw: object type doesn't match
})
```

**Remove object from collection:**

```typescript
await trpc.collection.removeObject.mutate({
  objectId: project.id,
  collectionId: workProjects.id,
})
```

**Get all objects in a collection:**

```typescript
const projects = await trpc.collection.objectsInCollection.query({
  collectionId: workProjects.id,
})
// Returns: All project objects in this collection
```

**Get all collections for an object:**

```typescript
const projectCollections = await trpc.collection.collectionsForObject.query({
  objectId: project.id,
})
// Returns: [workProjects, q1Collection, ...] - all collections this project belongs to
```

### Backend Implementation

**Type Validation** (`apps/api/src/trpc/routers/collection.ts:160-169`):

```typescript
// Validate object type matches collection's objectType
const collection = dbToBaseObject(collectionObject[0]) as Collection
const targetObj = dbToBaseObject(targetObject[0])

if (collection.properties.objectType !== targetObj.type) {
  throw new TRPCError({
    code: 'BAD_REQUEST',
    message: `Object type ${targetObj.type} does not match collection's objectType ${collection.properties.objectType}`,
  })
}
```

**Collection Relation**:

```typescript
// Create 'member_of' relation
await ctx.db.insert(relations).values({
  fromObjectId: input.objectId,      // The object
  toObjectId: input.collectionId,    // The collection
  relationType: 'member_of',
  metadata: {},
})
```

## Query System (Phase 1)

### Concept

Queries are **saved filters** stored as first-class objects (`type: 'query'`). They enable dynamic, reusable views of objects.

**Phase 1 Scope**: Basic object-type queries only (filter by type, properties, tags, dates)

### Schema

**Query Object** (`packages/schemas/src/objects/query.ts`):

```typescript
{
  id: string
  type: 'query'
  title: string // Query name (e.g., "Active Work Projects")
  content: string // Optional description
  properties: {
    queryType: 'object-type' // Phase 1: only this type
    filters?: {
      objectType?: string              // Filter by type
      properties?: Record<string, any> // Filter by property values
      tags?: string[]                  // Filter by tag names
      dateRange?: {
        start?: Date
        end?: Date
      }
      archived?: boolean               // Include archived (default: false)
    }
    sort?: {
      field: string
      order: 'asc' | 'desc'
    }
    limit?: number                     // Max results
    groupBy?: string                   // Future: group results
  }
  archived: boolean
  metadata: { ... }
}
```

### Frontend Usage

**Create queries:**

```typescript
// Query: Active work projects
const activeProjectsQuery = await trpc.query.create.mutate({
  title: 'Active Work Projects',
  content: 'All non-archived projects',
  properties: {
    queryType: 'object-type',
    filters: {
      objectType: 'project',
      archived: false,
    },
    sort: {
      field: 'updatedAt',
      order: 'desc',
    },
    limit: 50,
  },
})

// Query: High priority tasks created this week
const thisWeekTasks = await trpc.query.create.mutate({
  title: 'This Week's High Priority Tasks',
  content: 'Tasks created this week with high priority',
  properties: {
    queryType: 'object-type',
    filters: {
      objectType: 'task',
      properties: {
        priority: 'high',
      },
      dateRange: {
        start: new Date('2025-01-13'),
        end: new Date('2025-01-19'),
      },
      archived: false,
    },
    sort: {
      field: 'createdAt',
      order: 'desc',
    },
  },
})

// Query: Items tagged "Important"
const importantItems = await trpc.query.create.mutate({
  title: 'Important Items',
  content: 'All items tagged as Important',
  properties: {
    queryType: 'object-type',
    filters: {
      tags: ['Important'], // Tag names, not IDs
      archived: false,
    },
  },
})
```

**Execute saved queries:**

```typescript
// Execute a saved query
const results = await trpc.query.execute.query({
  id: activeProjectsQuery.id,
})
// Returns: Array of objects matching query filters
```

**Test queries without saving:**

```typescript
// Experiment with filters before saving
const testResults = await trpc.query.test.query({
  filters: {
    objectType: 'project',
    properties: {
      status: 'active',
    },
  },
  sort: {
    field: 'updatedAt',
    order: 'desc',
  },
  limit: 10,
})
// Returns: Matching objects without creating a query object
```

**List saved queries:**

```typescript
const savedQueries = await trpc.query.list.query()
```

**Update query:**

```typescript
await trpc.query.update.mutate({
  id: activeProjectsQuery.id,
  updates: {
    properties: {
      queryType: 'object-type',
      filters: {
        objectType: 'project',
        archived: false,
        properties: {
          status: 'active', // Added status filter
        },
      },
      limit: 100, // Increased limit
    },
  },
})
```

**Delete query:**

```typescript
await trpc.query.delete.mutate({
  id: activeProjectsQuery.id,
})
```

### Backend Implementation

**Query Execution** (`apps/api/src/services/query-executor.ts:41-152`):

```typescript
export async function executeQuery(query: Query, db: Database) {
  const { filters, sort, limit } = query.properties

  // Build SQL WHERE conditions
  const conditions = []

  if (filters?.objectType) {
    conditions.push(eq(objects.type, filters.objectType))
  }

  if (filters?.archived !== undefined) {
    conditions.push(eq(objects.archived, filters.archived))
  } else {
    conditions.push(eq(objects.archived, false)) // Default: exclude archived
  }

  if (filters?.dateRange?.start) {
    conditions.push(gte(objects.createdAt, filters.dateRange.start))
  }

  // Execute base query
  let queryBuilder = db.select().from(objects).where(and(...conditions))

  // Apply sorting
  if (sort) {
    queryBuilder = queryBuilder.orderBy(
      sort.order === 'asc' ? asc(objects[sort.field]) : desc(objects[sort.field])
    )
  }

  // Apply limit
  if (limit && limit > 0) {
    queryBuilder = queryBuilder.limit(limit)
  }

  let results = await queryBuilder

  // Post-process complex filters in JavaScript
  // (Future: optimize with SQL for performance)

  // Filter by property values
  if (filters?.properties) {
    results = results.filter(obj => {
      for (const [key, value] of Object.entries(filters.properties!)) {
        if (obj.properties?.[key] !== value) return false
      }
      return true
    })
  }

  // Filter by tags (via relations JOIN)
  if (filters?.tags && filters.tags.length > 0) {
    // Find tag objects by name, then filter by relations
    // See full implementation in query-executor.ts:115-148
  }

  return results.map(dbToBaseObject)
}
```

**Performance Note**: Phase 1 uses JavaScript post-processing for complex filters (properties, tags). This is acceptable for initial implementation but should be optimized with SQL JOINs and indexes for production.

## Combining Features

### Example: Tagged Collection with Timeline

```typescript
// 1. Create a tag for work items
const workTag = await trpc.tag.create.mutate({
  title: 'Work',
  properties: { color: '#3498DB', icon: '💼' },
})

// 2. Create a collection for Q1 projects
const q1Projects = await trpc.collection.create.mutate({
  title: 'Q1 Projects',
  properties: {
    objectType: 'project',
    icon: '📅',
  },
})

// 3. Create a project (auto-links to today's daily note)
const project = await trpc.object.create.mutate({
  type: 'project',
  title: 'Launch Marketing Campaign',
  properties: { status: 'planning' },
})

// 4. Tag the project
await trpc.tag.tagObject.mutate({
  objectId: project.id,
  tagId: workTag.id,
})

// 5. Add to collection
await trpc.collection.addObject.mutate({
  objectId: project.id,
  collectionId: q1Projects.id,
})

// 6. Create a query for work projects in Q1
const workProjectsQuery = await trpc.query.create.mutate({
  title: 'Q1 Work Projects',
  properties: {
    queryType: 'object-type',
    filters: {
      objectType: 'project',
      tags: ['Work'],
      dateRange: {
        start: new Date('2025-01-01'),
        end: new Date('2025-03-31'),
      },
    },
  },
})

// 7. Execute query
const results = await trpc.query.execute.query({
  id: workProjectsQuery.id,
})

// 8. View project's timeline context
const dailyNote = await trpc.object.getById.query({
  id: project.metadata.dailyNoteId, // Or query by creation date
})

const timeline = await trpc.object.dailyNoteTimeline.query({
  dailyNoteId: dailyNote.id,
})
// See everything else created on the same day
```

## Testing Considerations

### Unit Tests

Test each router independently:

```typescript
// Example: Tag router tests
describe('Tag Router', () => {
  it('should create a tag with metadata', async () => {
    const tag = await trpc.tag.create.mutate({
      title: 'Important',
      properties: { color: '#FF0000', icon: '⭐' },
    })

    expect(tag.type).toBe('tag')
    expect(tag.title).toBe('Important')
    expect(tag.properties.color).toBe('#FF0000')
  })

  it('should tag an object', async () => {
    // Create tag and object
    // Call tagObject
    // Verify relation created
  })

  it('should prevent duplicate tagging', async () => {
    // Tag object twice
    // Expect CONFLICT error
  })
})
```

### Integration Tests

Test feature combinations:

```typescript
describe('Timeline Integration', () => {
  it('should auto-link object to daily note on creation', async () => {
    const project = await trpc.object.create.mutate({
      type: 'project',
      title: 'Test Project',
    })

    const todayDate = getTodayDateString()
    const timeline = await trpc.object.objectsCreatedOnDate.query({
      date: todayDate,
    })

    expect(timeline).toContainEqual(expect.objectContaining({ id: project.id }))
  })
})
```

## Migration Path (Future)

When migrating from old `metadata.tags` to tag objects:

1. **Create tag objects** for each unique tag name
2. **Create `tagged_with` relations** for each object-tag pair
3. **Remove `metadata.tags`** references from codebase
4. **Update queries** to use tag relations instead of metadata

See TD001 for detailed migration strategy (to be documented).

## Performance Optimization (Future)

### Query Execution

**Current** (Phase 1):
- SQL for basic filters (type, archived, dates)
- JavaScript for complex filters (properties, tags)

**Future** (Phase 2+):
- SQL JOINs for tag filtering
- JSON operators for property filtering
- Composite indexes for common query patterns

### Indexes to Consider

```sql
-- For tag queries
CREATE INDEX idx_tagged_objects ON relations(to_object_id, relation_type)
  WHERE relation_type = 'tagged_with';

-- For collection queries
CREATE INDEX idx_collection_members ON relations(to_object_id, relation_type)
  WHERE relation_type = 'member_of';

-- For property queries (requires JSON support)
CREATE INDEX idx_object_properties ON objects(json_extract(properties, '$.status'));
```

## References

- [TD001: Capacities Architecture](./TD001-capacities-architecture.md)
- [Capacities Comparison](../future/capacities-comparison.md)
- [tRPC Documentation](https://trpc.io)
- Database Schema: `packages/database/migrations/0000_initial_schema.sql`

## Questions & Support

For questions or issues:
- Check [TD001](./TD001-capacities-architecture.md) for architectural decisions
- Review router implementations in `apps/api/src/trpc/routers/`
- Check service implementations in `apps/api/src/services/`
