# Project Structure

## Monorepo Organization

This project uses **Bun workspaces** to organize code, share dependencies, and maintain type safety across the entire stack.

```
nazaritor/
├── apps/
│   ├── api/                    # Backend API (Hono + tRPC + Bun)
│   └── web/                    # Next.js frontend (minimal approach)
├── packages/
│   ├── schemas/                # Shared Zod schemas
│   ├── types/                  # Shared TypeScript types
│   ├── ui/                     # Shared React components
│   └── database/               # Drizzle schemas & migrations
├── docs/                       # Project documentation
├── package.json                # Root package.json with Bun workspaces
├── bun.lockb                   # Bun lockfile
└── README.md                   # Project overview
```

---

## Backend API (`apps/api/`)

The backend contains all business logic, database interactions, and AI agent orchestration.

### Directory Structure

```
apps/api/
├── src/
│   ├── server.ts               # Main entry point (Hono server)
│   ├── trpc/
│   │   ├── router.ts           # Main tRPC router
│   │   ├── context.ts          # tRPC context (auth, db, etc.)
│   │   └── routers/            # Domain-specific routers
│   │       ├── object.ts       # Object CRUD operations
│   │       ├── ai.ts           # AI agent interactions
│   │       ├── search.ts       # Search and filtering
│   │       └── user.ts         # User management
│   ├── domain/                 # Core business logic (pure TypeScript)
│   │   ├── objects/            # Object system logic
│   │   │   ├── base-object.ts
│   │   │   ├── project.ts
│   │   │   ├── daily-note.ts
│   │   │   ├── knowledge-bit.ts
│   │   │   ├── personal-bit.ts
│   │   │   ├── weblink.ts
│   │   │   ├── person.ts
│   │   │   ├── page.ts
│   │   │   ├── financial-entry.ts
│   │   │   ├── task.ts
│   │   │   ├── calendar-entry.ts
│   │   │   └── habit.ts
│   │   ├── properties/         # Property system
│   │   │   ├── property-types.ts
│   │   │   └── validators.ts
│   │   └── relations/          # Object relations
│   │       ├── relation-types.ts
│   │       └── graph.ts
│   ├── ai/                     # AI agent system
│   │   ├── agents/
│   │   │   ├── curator.ts      # Curator agent (organize, categorize)
│   │   │   ├── researcher.ts   # Researcher agent (search, summarize)
│   │   │   └── builder.ts      # Builder agent (generate UI)
│   │   ├── orchestrator.ts     # Agent orchestration logic
│   │   ├── context-manager.ts  # Conversation context
│   │   └── tools.ts            # AI tool definitions
│   ├── db/                     # Database layer
│   │   ├── client.ts           # Drizzle client instance
│   │   ├── schema.ts           # Database schema (imports from @repo/database)
│   │   └── migrations/         # Database migrations
│   └── utils/                  # Utility functions
│       ├── errors.ts           # Error handling
│       ├── logger.ts           # Logging
│       └── validators.ts       # Common validators
├── tests/                      # Test files (mirrors src/ structure)
│   ├── domain/
│   ├── trpc/
│   └── ai/
├── package.json
├── tsconfig.json
└── vitest.config.ts            # Vitest configuration
```

### Key Principles

- **Domain logic is pure**: No framework dependencies in `domain/`
- **Framework code in `trpc/` and `server.ts`**: Keep framework-specific code isolated
- **Test alongside implementation**: Tests mirror source structure
- **TDD always**: Write tests before implementation

---

## Frontend Web App (`apps/web/`)

The Next.js frontend follows a **minimal approach**: mostly client components with one server action file for AI streaming.

### Directory Structure

```
apps/web/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page (main chat interface)
│   ├── actions/
│   │   └── chat.tsx            # ONLY server action file (streamUI)
│   ├── components/             # React components (90% 'use client')
│   │   ├── chat/
│   │   │   ├── chat-interface.tsx
│   │   │   ├── message-list.tsx
│   │   │   ├── input-box.tsx
│   │   │   └── streaming-response.tsx
│   │   ├── objects/
│   │   │   ├── object-card.tsx         # Generic object card
│   │   │   ├── object-editor.tsx       # Edit any object
│   │   │   ├── object-list.tsx         # List view
│   │   │   ├── project-card.tsx
│   │   │   ├── daily-note-card.tsx
│   │   │   ├── knowledge-bit-card.tsx
│   │   │   ├── personal-bit-card.tsx
│   │   │   ├── weblink-card.tsx
│   │   │   ├── person-card.tsx
│   │   │   ├── page-card.tsx
│   │   │   ├── financial-entry-card.tsx
│   │   │   ├── task-card.tsx
│   │   │   ├── calendar-entry-card.tsx
│   │   │   └── habit-card.tsx
│   │   ├── views/
│   │   │   ├── table-view.tsx          # Table view for objects
│   │   │   ├── kanban-view.tsx         # Kanban board (tasks, projects)
│   │   │   ├── calendar-view.tsx       # Calendar (dated objects)
│   │   │   ├── graph-view.tsx          # Relationship graph
│   │   │   └── dashboard-view.tsx      # Overview dashboard
│   │   ├── properties/
│   │   │   ├── property-editor.tsx     # Edit object properties
│   │   │   ├── text-property.tsx
│   │   │   ├── number-property.tsx
│   │   │   ├── date-property.tsx
│   │   │   ├── select-property.tsx
│   │   │   └── relation-property.tsx
│   │   └── ui/                         # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── card.tsx
│   │       └── ... (other shadcn components)
│   └── lib/
│       ├── trpc.ts                     # tRPC client setup
│       ├── providers.tsx               # React Query provider
│       └── utils.ts                    # Utility functions
├── public/                             # Static assets
├── tests/                              # Component tests
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── vitest.config.ts
```

### Key Principles

- **One server action**: Only `app/actions/chat.tsx` uses `'use server'`
- **Client components by default**: 90% of components use `'use client'`
- **Component library for AI**: Build comprehensive set of components AI can compose
- **Type-safe tRPC client**: All backend communication via tRPC hooks
- **Minimal Next.js features**: Use only what provides clear value

---

## Shared Packages (`packages/`)

### `packages/schemas/`

Shared Zod schemas for validation across backend and frontend.

```
packages/schemas/
├── src/
│   ├── index.ts                # Export all schemas
│   ├── objects/                # Object schemas
│   │   ├── base-object.ts
│   │   ├── project.ts
│   │   ├── daily-note.ts
│   │   ├── knowledge-bit.ts
│   │   ├── personal-bit.ts
│   │   ├── weblink.ts
│   │   ├── person.ts
│   │   ├── page.ts
│   │   ├── financial-entry.ts
│   │   ├── task.ts
│   │   ├── calendar-entry.ts
│   │   └── habit.ts
│   ├── properties/             # Property schemas
│   │   └── property-types.ts
│   ├── relations/              # Relation schemas
│   │   └── relation-types.ts
│   └── api/                    # API request/response schemas
│       ├── object-mutations.ts
│       └── ai-requests.ts
├── package.json
└── tsconfig.json
```

### `packages/types/`

Shared TypeScript types (derived from Zod schemas).

```
packages/types/
├── src/
│   ├── index.ts                # Export all types
│   ├── objects.ts              # Object types (inferred from schemas)
│   ├── properties.ts           # Property types
│   ├── relations.ts            # Relation types
│   └── api.ts                  # API types
├── package.json
└── tsconfig.json
```

### `packages/database/`

Drizzle ORM schemas and migrations.

```
packages/database/
├── src/
│   ├── index.ts                # Export schema
│   ├── schema/
│   │   ├── objects.ts          # Objects table
│   │   ├── properties.ts       # Properties table
│   │   ├── relations.ts        # Relations table
│   │   └── users.ts            # Users table (future)
│   └── migrations/             # SQL migrations
│       └── 0001_initial.sql
├── drizzle.config.ts           # Drizzle configuration
├── package.json
└── tsconfig.json
```

### `packages/ui/`

Shared React components (used across web, mobile, desktop).

```
packages/ui/
├── src/
│   ├── index.ts                # Export components
│   ├── object-card.tsx         # Generic object card
│   ├── property-editor.tsx     # Property editing
│   └── ... (other shared components)
├── package.json
└── tsconfig.json
```

---

## Documentation (`docs/`)

All project documentation lives here:

- `architecture.md` - Architecture decisions
- `project-structure.md` - This file
- `object-system.md` - Object system specification
- `api-design.md` - Backend API design
- `ai-agents.md` - AI agent system
- `frontend-guide.md` - Next.js frontend guide
- `development.md` - Development guide
- `roadmap.md` - Implementation roadmap

---

## File Naming Conventions

### TypeScript Files

- **kebab-case** for file names: `base-object.ts`, `curator-agent.ts`
- **PascalCase** for component files: `ObjectCard.tsx` (optional but common in React)
- **index.ts** for barrel exports

### Test Files

- **Mirror source structure**: `src/domain/objects/project.ts` → `tests/domain/objects/project.test.ts`
- **Suffix with `.test.ts`**: `project.test.ts`, `curator.test.ts`

### Schema Files

- **Match domain concept**: `project.ts` (schema for Project object)
- **Singular naming**: `object.ts` not `objects.ts`

---

## Import Aliases

Use TypeScript path aliases for clean imports:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@repo/schemas": ["../../packages/schemas/src"],
      "@repo/types": ["../../packages/types/src"],
      "@repo/database": ["../../packages/database/src"],
      "@repo/ui": ["../../packages/ui/src"]
    }
  }
}
```

### Example Usage

```typescript
// Backend (apps/api/)
import { ProjectSchema } from '@repo/schemas'
import { db } from '@/db/client'
import { createProject } from '@/domain/objects/project'

// Frontend (apps/web/)
import { ObjectCard } from '@repo/ui'
import { trpc } from '@/lib/trpc'
```

---

## Package Management

### Tool: **bun**

Use bun for package management (faster, better disk space usage).

```yaml
# bun-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

### Installing Dependencies

```bash
# Install all dependencies
bun install

# Add dependency to specific app
bun --filter api add hono
bun --filter web add next

# Add dependency to shared package
bun --filter @repo/schemas add zod
```

---

## Build & Development Scripts

### Root `package.json` Scripts

```json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check"
  }
}
```

### Turborepo Pipeline

```json
// turbo.json
{
  "pipeline": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "lint": {},
    "type-check": {}
  }
}
```

---

## Summary

This structure provides:

- **Clear separation**: Backend, frontend, and shared code are well-organized
- **Type safety**: Shared schemas and types ensure consistency
- **Scalability**: Easy to add new apps (mobile, desktop, CLI)
- **Testability**: Test structure mirrors source structure
- **Maintainability**: Domain logic is pure and framework-agnostic
- **DX**: Turborepo caching speeds up builds and tests

The monorepo approach ensures all parts of the stack stay in sync while maintaining clear boundaries between domains.
