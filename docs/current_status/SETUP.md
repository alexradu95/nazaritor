# Monorepo Setup Complete! 🎉

The Nazaritor monorepo has been initialized with Bun workspaces and all necessary configurations.

## What's Been Created

### Root Configuration
- ✅ `package.json` - Root package with workspace configuration and build scripts
- ✅ `pnpm-workspace.yaml` - Workspace configuration (Bun compatible)
- ✅ `tsconfig.json` - Base TypeScript configuration
- ✅ `.gitignore` - Git ignore rules
- ✅ `.prettierrc` - Code formatting configuration
- ✅ `bun.lockb` - Bun's binary lockfile

### Packages

#### `packages/schemas`
- All 11 object type Zod schemas:
  - Project, Task, Daily Note, Knowledge Bit, Personal Bit
  - Weblink, Person, Page, Financial Entry
  - Calendar Entry, Habit
- Property and Relation schemas
- Fully type-safe with Zod

#### `packages/types`
- TypeScript types inferred from Zod schemas
- Utility types for API and AI
- Re-exports all schema types

#### `packages/database`
- Drizzle ORM setup
- Database schemas for objects and relations
- Migration configuration
- Database client

### Apps

#### `apps/api` (Backend)
- Hono server setup
- tRPC configuration
- Basic object router with `ping` and `getById` procedures
- Database connection
- Migration script
- TypeScript path aliases configured

#### `apps/web` (Frontend)
- Next.js 15 with App Router
- tRPC client setup
- React Query provider
- Tailwind CSS configured
- Basic homepage
- TypeScript configured with path aliases

## Next Steps

### 1. Install Dependencies

```bash
# Install all dependencies (using Bun)
bun install
```

This installs all workspace dependencies across the monorepo. Bun is 20-100x faster than npm/pnpm!

### 2. Setup Environment Variables

```bash
# Copy example env files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# Edit apps/api/.env and add your database URL and API keys
# Edit apps/web/.env.local and configure frontend settings
```

### 3. Setup Database (SQLite - Zero Configuration!)

**No setup needed!** SQLite works out of the box with Bun's native support.

The database file will be automatically created at `apps/api/data/nazaritor.db` when you run migrations.

**Benefits:**
- ✅ Zero configuration - no database server to install
- ✅ Single file database - easy to backup and share
- ✅ Bun native - ultra-fast performance
- ✅ Perfect for local development
- ✅ Production ready for appropriate use cases

### 4. Run Database Migrations

```bash
cd apps/api

# Generate initial migration
bun run db:generate

# Run migrations
bun src/db/migrate.ts
```

### 5. Start Development Servers

```bash
# From root directory
bun run dev        # Start backend API
# OR
bun run dev:web    # Start frontend (in separate terminal)
```

This will start:
- **Backend API**: http://localhost:3001
- **Frontend Web**: http://localhost:3000

### 6. Test the Setup

```bash
# Test backend health
curl http://localhost:3001/health

# Test tRPC ping
curl http://localhost:3001/trpc/object.ping

# Open frontend
open http://localhost:3000
```

## Project Structure

```
nazaritor/
├── apps/
│   ├── api/                 # Backend (Bun + Hono + tRPC)
│   │   ├── src/
│   │   │   ├── server.ts    # Entry point
│   │   │   ├── trpc/        # tRPC setup
│   │   │   └── db/          # Database utilities
│   │   └── package.json
│   └── web/                 # Frontend (Next.js)
│       ├── app/             # Next.js App Router
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   └── lib/         # tRPC client, providers
│       └── package.json
├── packages/
│   ├── schemas/             # Zod schemas
│   │   └── src/
│   │       ├── objects/     # All 11 object types
│   │       ├── properties/
│   │       └── relations/
│   ├── types/               # TypeScript types
│   └── database/            # Drizzle schemas
│       └── src/
│           ├── schema/
│           └── client.ts
├── docs/                    # Comprehensive documentation
├── package.json             # Root package
├── pnpm-workspace.yaml
└── turbo.json
```

## Available Scripts

### Root Level
```bash
pnpm dev          # Run all apps in development
pnpm build        # Build all apps
pnpm test         # Run all tests
pnpm lint         # Lint all code
pnpm type-check   # TypeScript type checking
pnpm clean        # Clean all build artifacts
```

### Backend (`apps/api`)
```bash
pnpm dev          # Start backend dev server
pnpm db:generate  # Generate migration
pnpm db:migrate   # Run migrations
pnpm db:studio    # Open Drizzle Studio
pnpm test         # Run tests
```

### Frontend (`apps/web`)
```bash
pnpm dev          # Start Next.js dev server
pnpm build        # Build for production
pnpm lint         # Run ESLint
```

## Development Workflow

1. **Write Tests First** (TDD)
   - Create test file in `apps/api/tests/`
   - Write failing test
   - Implement feature
   - Make test pass

2. **Create Schemas**
   - Define Zod schema in `packages/schemas`
   - Types automatically inferred

3. **Add tRPC Procedures**
   - Create procedure in `apps/api/src/trpc/routers/`
   - Types automatically available in frontend

4. **Build Frontend**
   - Use tRPC client hooks in React components
   - Fully type-safe, autocomplete works!

## What's Next?

Now that the monorepo is set up, follow the **[Implementation Roadmap](docs/roadmap.md)** to start building:

### Phase 1 - Week 3-6: Core Object System
- Implement create, update, delete procedures
- Add all 11 object types
- Build relation system
- Write comprehensive tests

See `docs/roadmap.md` for the full 6-month plan.

## Documentation

All documentation is in the `docs/` directory:
- [Architecture](docs/architecture.md)
- [Object System](docs/object-system.md)
- [API Design](docs/api-design.md)
- [AI Agents](docs/ai-agents.md)
- [Frontend Guide](docs/frontend-guide.md)
- [Development Guide](docs/development.md)
- [Roadmap](docs/roadmap.md)

## Troubleshooting

### Dependencies Won't Install
```bash
# Clear pnpm cache
pnpm store prune

# Reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Database File Issues
```bash
# Check if database exists
ls -la apps/api/data/

# Reset database (warning: deletes all data)
rm apps/api/data/nazaritor.db
cd apps/api && bun src/db/migrate.ts

# Database locked error (close all connections)
# 1. Stop dev server (Ctrl+C)
# 2. Close Drizzle Studio if open
# 3. Restart: pnpm dev
```

### TypeScript Errors
```bash
# Rebuild all packages
pnpm build

# Check types
pnpm type-check
```

### Port Already in Use
```bash
# Kill process on port 3001 (backend)
lsof -ti:3001 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

## Need Help?

- Check the [Development Guide](docs/development.md)
- Review the [Architecture](docs/architecture.md)
- See example code in `apps/api/src/trpc/routers/object.ts`

Happy coding! 🚀
