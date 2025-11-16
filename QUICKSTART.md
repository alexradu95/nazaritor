# Quick Start Guide - Nazaritor

This guide will get you up and running in under 5 minutes with SQLite!

## Prerequisites

Before starting, make sure you have:

- **Bun** v1.0.0+ - [Install here](https://bun.sh)
- **Node.js** v20+ - [Install here](https://nodejs.org)
- **pnpm** v8+ - `npm install -g pnpm`

That's it! No database server needed - we use SQLite with Bun's native support.

## Step 1: Install Dependencies

```bash
# From the root directory
pnpm install
```

This will install all dependencies for the monorepo (backend, frontend, and packages).

**Expected output:** `Packages: +XXX` and no errors

---

## Step 2: Configure Environment Variables (Optional)

SQLite works out of the box with no configuration needed! But you can customize if you want.

### Backend Environment (Optional)

```bash
cd apps/api
cp .env.example .env
```

Edit `apps/api/.env` (optional):

```bash
# Database path (optional - defaults to ./data/nazaritor.db)
DATABASE_URL=./data/nazaritor.db

# Required: Add your OpenAI API key (for AI features later)
OPENAI_API_KEY=sk-your-key-here

# Optional: Change port if 3001 is in use
PORT=3001
```

**Note:** If you don't create a `.env` file, the database will automatically be created at `./data/nazaritor.db` with sensible defaults.

### Frontend Environment (Optional)

```bash
cd apps/web
cp .env.example .env.local
```

Edit `apps/web/.env.local` (optional - defaults are fine):

```bash
# Backend API URL (default is fine for local development)
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Step 3: Run Database Migrations

```bash
# From apps/api directory
cd apps/api

# Run migrations (creates SQLite database automatically)
bun src/db/migrate.ts
```

**Expected output:**
```
Running migrations...
Database path: ./data/nazaritor.db
✅ Migrations complete!
Database created at: ./data/nazaritor.db
Tables created: objects, relations
```

**That's it!** No database server to install, configure, or manage. The SQLite file is created automatically.

---

## Step 4: Run Tests (Verify Everything Works)

```bash
# Still in apps/api directory
bun test
```

**Expected output:**
```
✓ Object Router > ping
✓ Object Router > create > should create a new project object
✓ Object Router > create > should create a new task object
✓ Object Router > getById > should retrieve an object by ID
✓ Object Router > list > should list all objects
✓ Object Router > update > should update an object
✓ Object Router > delete > should delete an object
✓ Object Router > archive > should archive an object

All 14 tests passed! 🎉
```

If tests pass, everything is working perfectly!

---

## Step 5: Start Development Servers

```bash
# Go back to root directory
cd ../..

# Start both backend and frontend
pnpm dev
```

This starts:
- **Backend API**: http://localhost:3001
- **Frontend Web**: http://localhost:3000

**Expected output:**
```
api:dev: 🚀 Server running at http://localhost:3001
web:dev: ▲ Next.js 15.0.0
web:dev: - Local: http://localhost:3000
```

---

## Step 6: Verify Everything is Running

### Test Backend API

**Health Check:**
```bash
curl http://localhost:3001/health
```

Expected: `{"status":"ok","timestamp":"..."}`

**Test tRPC:**
```bash
curl http://localhost:3001/trpc/object.ping
```

Expected: `{"result":{"data":{"message":"pong from object router"}}}`

### Test Frontend

Open http://localhost:3000 in your browser

You should see: "Nazaritor - AI-First Knowledge Management System"

---

## Step 7: Create Your First Object!

Let's create a project via the API.

Create a file `test-project.json`:

```json
{
  "type": "project",
  "title": "My First Project",
  "content": "This is a test project created via the API",
  "properties": {
    "status": { "type": "text", "value": "planning" },
    "priority": { "type": "text", "value": "high" }
  },
  "relations": []
}
```

Create the object:

```bash
curl -X POST http://localhost:3001/trpc/object.create \
  -H "Content-Type: application/json" \
  -d @test-project.json
```

You should get back a JSON response with your created project including an `id`!

### List All Objects

```bash
curl http://localhost:3001/trpc/object.list
```

You should see your created project in the response.

---

## SQLite Benefits

### Why SQLite is Perfect for This Project

✅ **Zero Configuration** - No database server to install or manage
✅ **Single File** - Entire database is one file (`./data/nazaritor.db`)
✅ **Fast** - Bun's native SQLite is incredibly fast
✅ **Portable** - Copy the .db file to backup or share
✅ **Perfect for Local Dev** - No external dependencies
✅ **Production Ready** - SQLite handles millions of rows easily

### Database Location

Your database is stored at:
```
apps/api/data/nazaritor.db       # Main database
apps/api/data/nazaritor.test.db  # Test database (separate file)
```

### Viewing Your Data

You can view your SQLite database with:

```bash
# Using sqlite3 CLI (if installed)
sqlite3 ./data/nazaritor.db
> .tables
> SELECT * FROM objects;
> .quit

# Or use Drizzle Studio
cd apps/api
bun run db:studio
# Opens at http://localhost:4983
```

### Backup Your Data

To backup your database, just copy the file:

```bash
cp ./data/nazaritor.db ./backups/nazaritor-backup-$(date +%Y%m%d).db
```

---

## Common Issues & Solutions

### Port Already in Use

```bash
# Kill process on port 3001 (backend)
lsof -ti:3001 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9

# Or change PORT in apps/api/.env
```

### Tests Failing

```bash
# Delete test database and retry
rm ./data/nazaritor.test.db
bun test

# Rebuild packages
pnpm build
```

### Module Not Found Errors

```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Database Locked Error

```bash
# If you get "database is locked", close all connections:
# 1. Stop the dev server (Ctrl+C)
# 2. Close Drizzle Studio if open
# 3. Restart: pnpm dev
```

---

## What's Next?

Now that everything is running, you can:

### 1. Explore the Code

- **Backend API**: `apps/api/src/trpc/routers/object.ts`
- **Database Schema**: `packages/database/src/schema/`
- **Object Schemas**: `packages/schemas/src/objects/`
- **Tests**: `apps/api/tests/trpc/routers/object.test.ts`

### 2. Add More Features

Follow the **Roadmap** in `docs/roadmap.md`:
- Add bulk operations
- Implement relations
- Add search functionality

### 3. Build the Frontend

Start building the chat interface following `docs/frontend-guide.md`

### 4. Learn More

Read the comprehensive documentation:
- [Architecture](docs/architecture.md)
- [Object System](docs/object-system.md)
- [API Design](docs/api-design.md)
- [Development Guide](docs/development.md)

---

## Development Workflow

### Running Commands

```bash
# Root level (runs all apps)
pnpm dev          # Start all apps
pnpm build        # Build all apps
pnpm test         # Run all tests
pnpm lint         # Lint all code

# Backend only
pnpm --filter api dev
pnpm --filter api test
pnpm --filter api db:studio  # Open database UI

# Frontend only
pnpm --filter web dev
pnpm --filter web build
```

### TDD Workflow

1. Write failing test in `apps/api/tests/`
2. Run `bun test --watch`
3. Implement feature to make test pass
4. Refactor while keeping tests green
5. Commit changes

### Database Changes

```bash
cd apps/api

# After changing schema in packages/database:
bun run db:generate    # Generate migration
bun src/db/migrate.ts  # Run migration

# View database
bun run db:studio      # Opens at http://localhost:4983
```

---

## Success! 🎉

You now have a fully functional system with:
- ✅ **SQLite database** - Fast, zero-config, single file
- ✅ **Backend API** with tRPC and Bun
- ✅ **Frontend** with Next.js
- ✅ **Complete CRUD operations**
- ✅ **Comprehensive test suite**
- ✅ **Type-safe full-stack** with shared schemas

**Total setup time:** ~5 minutes (no database server needed!)

Ready to build! For detailed implementation guidance, see `docs/roadmap.md`.

Happy coding! 🚀
