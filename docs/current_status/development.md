# Development Guide

## Getting Started

This guide covers everything you need to start developing the AI-First Knowledge Management System.

---

## Prerequisites

### Required Software

- **Bun** v1.0+ (runtime and package manager)
- **Node.js** v20+ (for Next.js frontend, optional)
- **SQLite** (embedded database, no installation needed)
- **Git** (version control)

### Optional Tools

- **VSCode** (recommended IDE)
- **GitHub Copilot** (AI pair programming)

---

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd nazaritor
```

### 2. Install Dependencies

```bash
# Install Bun (if not installed)
curl -fsSL https://bun.sh/install | bash

# Install all dependencies (monorepo)
bun install
```

### 3. Setup Environment Variables

Create `.env` files for backend and frontend:

#### Backend `.env` (apps/api/.env)

```bash
# Database (optional - defaults to ./data/nazaritor.db)
DATABASE_URL=./data/nazaritor.db

# AI Provider
OPENAI_API_KEY=sk-...
# OR
ANTHROPIC_API_KEY=sk-ant-...

# Server
PORT=3001
NODE_ENV=development
```

#### Frontend `.env` (apps/web/.env.local)

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001

# AI SDK (if needed for frontend)
OPENAI_API_KEY=sk-...
```

### 4. Setup Database (SQLite - Zero Configuration!)

**No setup needed!** SQLite works out of the box with Bun's native support.

The database file will be automatically created at `apps/api/data/nazaritor.db` when you run migrations.

**Benefits:**
- ✅ Zero configuration - no database server required
- ✅ Single file database - easy to backup and share
- ✅ Bun native SQLite - ultra-fast performance
- ✅ Perfect for local development
- ✅ Production ready for single-server deployments

**Optional:** You can customize the database location by setting `DATABASE_URL` in `.env`:
```bash
DATABASE_URL=./custom/path/nazaritor.db
```

### 5. Run Database Migrations

```bash
cd apps/api
bun db:migrate
```

---

## Running the Project

### Development Mode

#### Run Everything (Recommended)

```bash
# From root directory
bun dev
```

This starts:
- Backend API (http://localhost:3001)
- Frontend Web (http://localhost:3000)

#### Run Services Individually

```bash
# Backend only
bun --filter api dev

# Frontend only
bun --filter web dev
```

### Production Build

```bash
# Build all apps
bun build

# Start production servers
bun start
```

---

## Project Scripts

### Root Scripts

```bash
# Development
bun dev               # Run all apps in dev mode
bun build             # Build all apps
bun lint              # Lint all code
bun type-check        # TypeScript type checking
bun test              # Run all tests
bun test:watch        # Run tests in watch mode

# Clean
bun clean             # Remove all build artifacts and node_modules
```

### Backend Scripts (apps/api)

```bash
# Development
bun dev               # Start backend in dev mode
bun build             # Build for production
bun start             # Start production server

# Database
bun db:generate       # Generate migration from schema changes
bun db:migrate        # Run migrations
bun db:push           # Push schema changes directly (dev only)
bun db:studio         # Open Drizzle Studio (database UI)
bun db:seed           # Seed database with sample data

# Testing
bun test              # Run tests
bun test:watch        # Run tests in watch mode
bun test:coverage     # Run tests with coverage report
```

### Frontend Scripts (apps/web)

```bash
# Development
bun dev               # Start Next.js dev server
bun build             # Build for production
bun start             # Start production server

# Testing
bun test              # Run tests
bun test:watch        # Run tests in watch mode

# Linting
bun lint              # Run ESLint
bun lint:fix          # Auto-fix lint issues
```

---

## Test-Driven Development (TDD)

### TDD Workflow

We follow **strict TDD** - all features must be built using the Red-Green-Refactor cycle.

#### 1. Red - Write Failing Test

```typescript
// apps/api/tests/domain/objects/project.test.ts
import { describe, it, expect } from 'vitest'
import { createProject } from '@/domain/objects/project'

describe('createProject', () => {
  it('should create a project with valid data', () => {
    const project = createProject({
      title: 'New Project',
      properties: {
        status: 'planning',
        priority: 'high',
      },
    })

    expect(project).toBeDefined()
    expect(project.type).toBe('project')
    expect(project.title).toBe('New Project')
    expect(project.properties.status).toBe('planning')
  })
})
```

Run test: `bun test` → **Test fails** (Red)

#### 2. Green - Write Minimal Code to Pass

```typescript
// apps/api/src/domain/objects/project.ts
import { BaseObject } from '@repo/types'
import { generateUUID } from '@/utils/uuid'

export function createProject(input: {
  title: string
  properties: any
}): BaseObject {
  return {
    id: generateUUID(),
    type: 'project',
    title: input.title,
    content: '',
    properties: input.properties,
    relations: [],
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      archived: false,
      favorited: false,
    },
  }
}
```

Run test: `bun test` → **Test passes** (Green)

#### 3. Refactor - Improve Code Quality

```typescript
// Refactored version with Zod validation
import { ProjectSchema } from '@repo/schemas'

export function createProject(input: {
  title: string
  properties: any
}): BaseObject {
  const project = ProjectSchema.parse({
    id: generateUUID(),
    type: 'project',
    title: input.title,
    content: '',
    properties: input.properties,
    relations: [],
    metadata: createDefaultMetadata(),
  })

  return project
}

function createDefaultMetadata() {
  return {
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [],
    archived: false,
    favorited: false,
  }
}
```

Run test: `bun test` → **Test still passes** (Refactor)

### Test Structure

```
tests/
├── domain/           # Unit tests for domain logic
│   ├── objects/
│   └── properties/
├── trpc/             # Integration tests for tRPC procedures
│   └── routers/
└── ai/               # Tests for AI agent logic
    └── agents/
```

### Testing Best Practices

1. **Test behavior, not implementation**
2. **Write descriptive test names**
3. **One assertion per test** (when possible)
4. **Use arrange-act-assert pattern**
5. **Mock external dependencies** (database, AI API)
6. **Aim for 100% coverage** of business logic

---

## Code Style & Conventions

### TypeScript

- **Strict mode always**: `"strict": true` in `tsconfig.json`
- **No `any` types**: Use proper types or `unknown`
- **Explicit return types** for functions
- **Prefer interfaces over types** for objects

### Naming Conventions

- **Files**: kebab-case (`base-object.ts`, `curator-agent.ts`)
- **Components**: PascalCase (`ObjectCard.tsx`)
- **Functions**: camelCase (`createProject`, `handleSubmit`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_PAGE_SIZE`)
- **Types/Interfaces**: PascalCase (`BaseObject`, `ProjectSchema`)

### Code Organization

```typescript
// File structure template
// 1. Imports
import { z } from 'zod'
import { BaseObject } from '@repo/types'

// 2. Types and interfaces
interface CreateProjectInput {
  title: string
  properties: any
}

// 3. Constants
const DEFAULT_STATUS = 'planning'

// 4. Main functions
export function createProject(input: CreateProjectInput): BaseObject {
  // Implementation
}

// 5. Helper functions (not exported)
function createDefaultMetadata() {
  // Implementation
}

// 6. Exports
export type { CreateProjectInput }
```

### Functional Programming

- **Pure functions**: No side effects
- **Immutable data**: Use spread operators, no mutations
- **Composition**: Build complex logic from small functions
- **No classes** (except for React components and services)

**Example:**

```typescript
// ❌ Bad - Mutation
function addTag(object: BaseObject, tag: string) {
  object.metadata.tags.push(tag)
  return object
}

// ✅ Good - Immutable
function addTag(object: BaseObject, tag: string): BaseObject {
  return {
    ...object,
    metadata: {
      ...object.metadata,
      tags: [...object.metadata.tags, tag],
    },
  }
}
```

---

## Database Management

### Drizzle ORM Workflow

#### 1. Define Schema

```typescript
// packages/database/src/schema/objects.ts
import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core'

export const objects = pgTable('objects', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: text('type').notNull(),
  title: text('title').notNull(),
  content: text('content'),
  properties: jsonb('properties').notNull().default({}),
  metadata: jsonb('metadata').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
```

#### 2. Generate Migration

```bash
cd apps/api
bun db:generate
```

This creates a SQL migration file in `apps/api/src/db/migrations/`.

#### 3. Review Migration

```sql
-- migrations/0001_add_objects_table.sql
CREATE TABLE "objects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "type" text NOT NULL,
  "title" text NOT NULL,
  "content" text,
  "properties" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "metadata" jsonb NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
```

#### 4. Run Migration

```bash
bun db:migrate
```

### Database Studio

Drizzle Studio provides a visual interface for your database:

```bash
bun db:studio
```

Opens at http://localhost:4983

---

## Git Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation

### Commit Messages

Follow Conventional Commits format:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, no code change
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance

**Examples:**

```bash
git commit -m "feat(objects): add project creation endpoint"
git commit -m "fix(ai): resolve streaming issue with long responses"
git commit -m "docs: update development guide with TDD workflow"
git commit -m "test(objects): add tests for object relations"
```

### Pull Request Process

1. Create feature branch from `develop`
2. Write tests first (TDD)
3. Implement feature
4. Ensure all tests pass
5. Update documentation
6. Create PR to `develop`
7. Code review
8. Merge when approved

---

## Debugging

### Backend Debugging

#### Using Bun Debugger

```bash
# Run with debugger
bun --inspect src/server.ts
```

Attach VSCode debugger with `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "attach",
      "name": "Attach to Bun",
      "port": 9229
    }
  ]
}
```

#### Logging

```typescript
import { logger } from '@/utils/logger'

logger.info('Object created', { objectId: object.id })
logger.error('Failed to create object', { error })
logger.debug('Request payload', { data: input })
```

### Frontend Debugging

#### React DevTools

Install React DevTools browser extension for component debugging.

#### tRPC DevTools

```typescript
import { loggerLink } from '@trpc/client'

const trpcClient = trpc.createClient({
  links: [
    loggerLink({
      enabled: (opts) =>
        process.env.NODE_ENV === 'development' ||
        (opts.direction === 'down' && opts.result instanceof Error),
    }),
    httpBatchLink({ url: 'http://localhost:3001/trpc' }),
  ],
})
```

---

## VSCode Setup

### Recommended Extensions

- **ESLint** - Linting
- **Prettier** - Code formatting
- **Tailwind CSS IntelliSense** - Tailwind autocomplete
- **Vitest** - Test runner
- **Error Lens** - Inline error display
- **GitLens** - Git integration

### VSCode Settings

`.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

---

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001 (backend)
lsof -ti:3001 | xargs kill -9
```

#### Database Issues

```bash
# Check if database file exists
ls -la apps/api/data/

# View database path being used
echo $DATABASE_URL

# Reset database (warning: deletes all data)
rm apps/api/data/nazaritor.db
cd apps/api && bun src/db/migrate.ts

# Database locked error
# 1. Stop dev server (Ctrl+C)
# 2. Close Drizzle Studio if open
# 3. Restart: bun dev
```

#### tRPC Type Errors

```bash
# Rebuild backend to update types
cd apps/api
bun build

# Restart frontend dev server
cd apps/web
bun dev
```

#### Module Not Found

```bash
# Clean and reinstall dependencies
bun clean
bun install
```

---

## Performance Monitoring

### Backend Performance

```typescript
// Add timing middleware
app.use(async (c, next) => {
  const start = Date.now()
  await next()
  const duration = Date.now() - start
  logger.info(`${c.req.method} ${c.req.url} - ${duration}ms`)
})
```

### Frontend Performance

```typescript
// Use React Profiler
import { Profiler } from 'react'

<Profiler id="ChatInterface" onRender={onRenderCallback}>
  <ChatInterface />
</Profiler>
```

---

## Deployment

### Backend Deployment (Railway)

```bash
# Install Railway CLI
npm install -g railway

# Login
railway login

# Create project
railway init

# Deploy
railway up
```

### Frontend Deployment (Vercel)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

---

## Summary

**Development Workflow:**
1. Setup environment (database, env variables)
2. Run tests in watch mode (`bun test:watch`)
3. Write failing test (Red)
4. Implement feature (Green)
5. Refactor code (Refactor)
6. Commit with conventional message
7. Create PR for review

**Key Commands:**
- `bun dev` - Run all apps
- `bun test` - Run all tests
- `bun db:studio` - Open database UI
- `bun lint` - Check code quality
- `bun type-check` - Verify types

**Remember:**
- TDD is non-negotiable
- Write tests first, always
- Keep functions pure and small
- Type safety throughout
- Document as you code
