# Backend API Design

## Overview

The backend API is built with **tRPC**, providing end-to-end type-safe procedures for all client applications. The API is organized into domain-specific routers for clarity and maintainability.

---

## tRPC Router Structure

### Main Router

```typescript
// apps/api/src/trpc/router.ts
import { router } from './init'
import { objectRouter } from './routers/object'
import { aiRouter } from './routers/ai'
import { searchRouter } from './routers/search'
import { userRouter } from './routers/user'

export const appRouter = router({
  object: objectRouter,
  ai: aiRouter,
  search: searchRouter,
  user: userRouter,
})

export type AppRouter = typeof appRouter
```

---

## Object Router

Handles all CRUD operations for objects.

### Procedures

```typescript
// apps/api/src/trpc/routers/object.ts
import { router, publicProcedure } from '../init'
import { z } from 'zod'
import {
  BaseObjectSchema,
  ProjectSchema,
  DailyNoteSchema,
  KnowledgeBitSchema,
  PersonalBitSchema,
  WeblinkSchema,
  PersonSchema,
  PageSchema,
  FinancialEntrySchema,
  TaskSchema,
  CalendarEntrySchema,
  HabitSchema,
} from '@repo/schemas'

export const objectRouter = router({
  // Create a new object
  create: publicProcedure
    .input(BaseObjectSchema.omit({ id: true, metadata: true }))
    .output(BaseObjectSchema)
    .mutation(async ({ input, ctx }) => {
      // Implementation: Create object in database
      const newObject = await ctx.db.objects.create({
        ...input,
        id: generateUUID(),
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: input.tags || [],
          archived: false,
          favorited: false,
        },
      })
      return newObject
    }),

  // Get object by ID
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(BaseObjectSchema.nullable())
    .query(async ({ input, ctx }) => {
      const object = await ctx.db.objects.findById(input.id)
      return object
    }),

  // List objects with filters
  list: publicProcedure
    .input(z.object({
      type: z.string().optional(),
      tags: z.array(z.string()).optional(),
      archived: z.boolean().optional(),
      favorited: z.boolean().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
      sortBy: z.enum(['createdAt', 'updatedAt', 'title']).default('updatedAt'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
    }))
    .output(z.object({
      objects: z.array(BaseObjectSchema),
      total: z.number(),
      hasMore: z.boolean(),
    }))
    .query(async ({ input, ctx }) => {
      const { objects, total } = await ctx.db.objects.list({
        ...input,
      })
      return {
        objects,
        total,
        hasMore: input.offset + objects.length < total,
      }
    }),

  // Update object
  update: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
      updates: BaseObjectSchema.partial().omit({ id: true }),
    }))
    .output(BaseObjectSchema)
    .mutation(async ({ input, ctx }) => {
      const updated = await ctx.db.objects.update(input.id, {
        ...input.updates,
        metadata: {
          ...input.updates.metadata,
          updatedAt: new Date(),
        },
      })
      return updated
    }),

  // Delete object
  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db.objects.delete(input.id)
      return { success: true }
    }),

  // Archive/unarchive object
  archive: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
      archived: z.boolean(),
    }))
    .output(BaseObjectSchema)
    .mutation(async ({ input, ctx }) => {
      const updated = await ctx.db.objects.update(input.id, {
        archived: input.archived,
        metadata: { updatedAt: new Date() },
      })
      return updated
    }),

  // Favorite/unfavorite object
  favorite: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
      favorited: z.boolean(),
    }))
    .output(BaseObjectSchema)
    .mutation(async ({ input, ctx }) => {
      const updated = await ctx.db.objects.update(input.id, {
        'metadata.favorited': input.favorited,
        'metadata.updatedAt': new Date(),
      })
      return updated
    }),

  // Bulk operations
  bulkCreate: publicProcedure
    .input(z.object({
      objects: z.array(BaseObjectSchema.omit({ id: true, metadata: true })),
    }))
    .output(z.array(BaseObjectSchema))
    .mutation(async ({ input, ctx }) => {
      const created = await ctx.db.objects.bulkCreate(input.objects)
      return created
    }),

  bulkDelete: publicProcedure
    .input(z.object({
      ids: z.array(z.string().uuid()),
    }))
    .output(z.object({ success: z.boolean(), count: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const count = await ctx.db.objects.bulkDelete(input.ids)
      return { success: true, count }
    }),

  // Object relations
  addRelation: publicProcedure
    .input(z.object({
      fromObjectId: z.string().uuid(),
      toObjectId: z.string().uuid(),
      relationType: z.string(),
    }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db.relations.create(input)
      return { success: true }
    }),

  removeRelation: publicProcedure
    .input(z.object({
      fromObjectId: z.string().uuid(),
      toObjectId: z.string().uuid(),
      relationType: z.string(),
    }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db.relations.delete(input)
      return { success: true }
    }),

  getRelations: publicProcedure
    .input(z.object({
      objectId: z.string().uuid(),
      relationType: z.string().optional(),
    }))
    .output(z.array(z.object({
      id: z.string().uuid(),
      relatedObject: BaseObjectSchema,
      relationType: z.string(),
    })))
    .query(async ({ input, ctx }) => {
      const relations = await ctx.db.relations.getForObject(input.objectId, input.relationType)
      return relations
    }),
})
```

---

## AI Router

Handles AI agent interactions and streaming responses.

### Procedures

```typescript
// apps/api/src/trpc/routers/ai.ts
import { router, publicProcedure } from '../init'
import { z } from 'zod'
import { observable } from '@trpc/server/observable'

export const aiRouter = router({
  // Chat with AI (streaming)
  chat: publicProcedure
    .input(z.object({
      messages: z.array(z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
      })),
      context: z.object({
        activeObjects: z.array(z.string().uuid()).optional(),
        currentView: z.string().optional(),
      }).optional(),
    }))
    .subscription(({ input, ctx }) => {
      return observable<{ type: string; content: any }>((emit) => {
        const stream = ctx.ai.chat({
          messages: input.messages,
          context: input.context,
        })

        stream.on('data', (chunk) => {
          emit.next({
            type: 'text',
            content: chunk.text,
          })
        })

        stream.on('tool-call', (tool) => {
          emit.next({
            type: 'tool-call',
            content: tool,
          })
        })

        stream.on('end', () => {
          emit.complete()
        })

        return () => {
          stream.abort()
        }
      })
    }),

  // Get AI agent suggestions
  getSuggestions: publicProcedure
    .input(z.object({
      objectId: z.string().uuid(),
      suggestionType: z.enum([
        'relations',
        'tags',
        'properties',
        'next-actions',
        'similar-objects',
      ]),
    }))
    .output(z.object({
      suggestions: z.array(z.any()),
    }))
    .query(async ({ input, ctx }) => {
      const object = await ctx.db.objects.findById(input.objectId)
      const suggestions = await ctx.ai.generateSuggestions(object, input.suggestionType)
      return { suggestions }
    }),

  // Generate content for object
  generateContent: publicProcedure
    .input(z.object({
      objectType: z.string(),
      prompt: z.string(),
      context: z.any().optional(),
    }))
    .output(z.object({
      content: z.string(),
      properties: z.record(z.any()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const generated = await ctx.ai.generateObjectContent({
        objectType: input.objectType,
        prompt: input.prompt,
        context: input.context,
      })
      return generated
    }),

  // Auto-categorize object
  categorize: publicProcedure
    .input(z.object({
      objectId: z.string().uuid(),
    }))
    .output(z.object({
      category: z.string(),
      tags: z.array(z.string()),
      confidence: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const object = await ctx.db.objects.findById(input.objectId)
      const categorization = await ctx.ai.categorize(object)
      return categorization
    }),

  // Extract entities from content
  extractEntities: publicProcedure
    .input(z.object({
      content: z.string(),
    }))
    .output(z.object({
      entities: z.array(z.object({
        type: z.string(),
        value: z.string(),
        confidence: z.number(),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      const entities = await ctx.ai.extractEntities(input.content)
      return { entities }
    }),

  // Summarize content
  summarize: publicProcedure
    .input(z.object({
      objectId: z.string().uuid(),
      length: z.enum(['short', 'medium', 'long']).default('medium'),
    }))
    .output(z.object({
      summary: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const object = await ctx.db.objects.findById(input.objectId)
      const summary = await ctx.ai.summarize(object.content, input.length)
      return { summary }
    }),
})
```

---

## Search Router

Handles searching and filtering across objects.

### Procedures

```typescript
// apps/api/src/trpc/routers/search.ts
import { router, publicProcedure } from '../init'
import { z } from 'zod'
import { BaseObjectSchema } from '@repo/schemas'

export const searchRouter = router({
  // Full-text search
  search: publicProcedure
    .input(z.object({
      query: z.string().min(1),
      types: z.array(z.string()).optional(),
      limit: z.number().min(1).max(100).default(20),
    }))
    .output(z.object({
      results: z.array(z.object({
        object: BaseObjectSchema,
        score: z.number(),
        highlights: z.array(z.string()).optional(),
      })),
    }))
    .query(async ({ input, ctx }) => {
      const results = await ctx.search.fullText(input.query, {
        types: input.types,
        limit: input.limit,
      })
      return { results }
    }),

  // Semantic search (AI-powered)
  semanticSearch: publicProcedure
    .input(z.object({
      query: z.string().min(1),
      types: z.array(z.string()).optional(),
      limit: z.number().min(1).max(50).default(10),
    }))
    .output(z.object({
      results: z.array(z.object({
        object: BaseObjectSchema,
        similarity: z.number(),
        reasoning: z.string().optional(),
      })),
    }))
    .query(async ({ input, ctx }) => {
      const results = await ctx.ai.semanticSearch(input.query, {
        types: input.types,
        limit: input.limit,
      })
      return { results }
    }),

  // Find related objects
  findRelated: publicProcedure
    .input(z.object({
      objectId: z.string().uuid(),
      limit: z.number().min(1).max(50).default(10),
    }))
    .output(z.object({
      related: z.array(z.object({
        object: BaseObjectSchema,
        relationScore: z.number(),
        relationReason: z.string(),
      })),
    }))
    .query(async ({ input, ctx }) => {
      const related = await ctx.ai.findRelatedObjects(input.objectId, input.limit)
      return { related }
    }),

  // Advanced filtering
  filter: publicProcedure
    .input(z.object({
      filters: z.array(z.object({
        field: z.string(),
        operator: z.enum(['equals', 'contains', 'gt', 'lt', 'gte', 'lte', 'in']),
        value: z.any(),
      })),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .output(z.object({
      objects: z.array(BaseObjectSchema),
      total: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const results = await ctx.db.objects.advancedFilter({
        filters: input.filters,
        limit: input.limit,
        offset: input.offset,
      })
      return results
    }),

  // Get object graph
  getGraph: publicProcedure
    .input(z.object({
      objectId: z.string().uuid(),
      depth: z.number().min(1).max(5).default(2),
    }))
    .output(z.object({
      nodes: z.array(BaseObjectSchema),
      edges: z.array(z.object({
        from: z.string().uuid(),
        to: z.string().uuid(),
        type: z.string(),
      })),
    }))
    .query(async ({ input, ctx }) => {
      const graph = await ctx.db.relations.getGraph(input.objectId, input.depth)
      return graph
    }),
})
```

---

## User Router (Future)

Handles user authentication and settings.

```typescript
// apps/api/src/trpc/routers/user.ts
import { router, publicProcedure, protectedProcedure } from '../init'
import { z } from 'zod'

export const userRouter = router({
  // Get current user
  me: protectedProcedure
    .output(z.object({
      id: z.string().uuid(),
      email: z.string().email(),
      name: z.string(),
      preferences: z.any(),
    }))
    .query(async ({ ctx }) => {
      return ctx.user
    }),

  // Update user preferences
  updatePreferences: protectedProcedure
    .input(z.object({
      preferences: z.any(),
    }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db.users.updatePreferences(ctx.user.id, input.preferences)
      return { success: true }
    }),
})
```

---

## tRPC Context

The context provides shared resources to all procedures.

```typescript
// apps/api/src/trpc/context.ts
import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import { db } from '@/db/client'
import { AIService } from '@/ai/service'
import { SearchService } from '@/search/service'

export async function createContext(opts: FetchCreateContextFnOptions) {
  // Get user from auth token (future)
  const user = null // await getUserFromToken(opts.req.headers.get('authorization'))

  return {
    db,
    ai: new AIService(),
    search: new SearchService(),
    user,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
```

---

## Error Handling

Use tRPC's error system for consistent error responses.

```typescript
import { TRPCError } from '@trpc/server'

// Example usage in a procedure
const object = await ctx.db.objects.findById(input.id)
if (!object) {
  throw new TRPCError({
    code: 'NOT_FOUND',
    message: `Object with ID ${input.id} not found`,
  })
}

// Error codes:
// - BAD_REQUEST
// - UNAUTHORIZED
// - FORBIDDEN
// - NOT_FOUND
// - CONFLICT
// - INTERNAL_SERVER_ERROR
// - TIMEOUT
```

---

## Subscriptions (Real-time)

For real-time updates (future feature):

```typescript
import { observable } from '@trpc/server/observable'
import EventEmitter from 'events'

const objectEvents = new EventEmitter()

export const objectRouter = router({
  // ... other procedures

  onObjectUpdate: publicProcedure
    .input(z.object({
      objectId: z.string().uuid(),
    }))
    .subscription(({ input }) => {
      return observable<BaseObject>((emit) => {
        const handler = (data: BaseObject) => {
          if (data.id === input.objectId) {
            emit.next(data)
          }
        }

        objectEvents.on('update', handler)

        return () => {
          objectEvents.off('update', handler)
        }
      })
    }),
})
```

---

## Client Usage (Frontend)

### Setup

```typescript
// apps/web/app/lib/trpc.ts
import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '../../../api/src/trpc/router'

export const trpc = createTRPCReact<AppRouter>()
```

### Usage in Components

```typescript
'use client'

import { trpc } from '@/lib/trpc'

function ObjectList() {
  // Query
  const { data, isLoading } = trpc.object.list.useQuery({
    type: 'task',
    limit: 20,
  })

  // Mutation
  const createObject = trpc.object.create.useMutation({
    onSuccess: () => {
      // Invalidate and refetch
      trpc.object.list.invalidate()
    },
  })

  const handleCreate = () => {
    createObject.mutate({
      type: 'task',
      title: 'New task',
      content: '',
      properties: { status: 'todo' },
      relations: [],
    })
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      {data?.objects.map(obj => (
        <div key={obj.id}>{obj.title}</div>
      ))}
      <button onClick={handleCreate}>Create Task</button>
    </div>
  )
}
```

---

## API Documentation

### Auto-generated Types

tRPC automatically generates types for all procedures:

```typescript
// Input types
type CreateObjectInput = inferProcedureInput<AppRouter['object']['create']>
type ListObjectsInput = inferProcedureInput<AppRouter['object']['list']>

// Output types
type CreateObjectOutput = inferProcedureOutput<AppRouter['object']['create']>
type ListObjectsOutput = inferProcedureOutput<AppRouter['object']['list']>
```

### OpenAPI Generation (Future)

For third-party API access, generate OpenAPI docs:

```bash
pnpm add @trpc/server@next
pnpm add trpc-openapi
```

This allows non-TypeScript clients to consume the API.

---

## Summary

The tRPC API provides:

- **Type-safe procedures** for all client operations
- **Organized routers** by domain (objects, AI, search, users)
- **Streaming support** for AI chat and real-time updates
- **Flexible querying** with filters, search, and graph traversal
- **Error handling** with consistent error responses
- **Future-ready** for authentication, subscriptions, and public API access

This design enables rapid, type-safe development across the entire stack while maintaining clean separation between domains.
