# Nazaritor

AI-First Knowledge Management System

## Project Structure

This is a monorepo containing:

- **apps/api** - Backend API server (Hono + tRPC)
- **apps/web** - Frontend web application (Next.js 15 + Tailwind CSS 4)
- **packages/database** - Shared database schema and client (Drizzle ORM)
- **packages/schemas** - Shared Zod schemas and types
- **packages/types** - Shared TypeScript types

## Quick Start

### Prerequisites

- Bun >= 1.0.0
- Node.js >= 20.0.0

### Installation

```bash
# Install dependencies
bun install

# Build shared packages
bun run build:packages
```

### Development

**Run both frontend and backend together (recommended):**

```bash
bun run dev:all
```

This will start:
- API server at **http://localhost:3001**
- Web app at **http://localhost:3000**
- tRPC Panel at **http://localhost:3001/panel** (development only)

**Or run them separately:**

```bash
# Terminal 1 - Backend API
bun run dev

# Terminal 2 - Frontend Web App
bun run dev:web
```

## Available Scripts

### Development

| Command | Description |
|---------|-------------|
| `bun run dev:all` | Run both API and web servers concurrently |
| `bun run dev` | Run API server only |
| `bun run dev:web` | Run web app only |

### Build

| Command | Description |
|---------|-------------|
| `bun run build` | Build all packages and apps |
| `bun run build:packages` | Build shared packages only |
| `bun run build:apps` | Build apps only |

### Testing

| Command | Description |
|---------|-------------|
| `bun run test` | Run tests |
| `bun run test:watch` | Run tests in watch mode |

### Utilities

| Command | Description |
|---------|-------------|
| `bun run format` | Format code with Prettier |
| `bun run clean` | Clean all node_modules and build artifacts |

## Tech Stack

### Backend (apps/api)
- **Runtime**: Bun
- **Framework**: Hono
- **API**: tRPC v11
- **Database**: SQLite with Drizzle ORM
- **Validation**: Zod

### Frontend (apps/web)
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **State Management**: React Query + tRPC
- **Design Pattern**: Atomic Design

## Features

### Current Features

- ✅ **Objects Management** - Create and manage objects (notes, tasks, projects, etc.)
- ✅ **Collections** - Group related objects together
- ✅ **Tags** - Categorize objects with tags
- ✅ **Queries** - Save and execute custom queries
- ✅ **Timeline** - Auto-link objects to daily notes
- ✅ **Type-safe API** - Full TypeScript coverage with tRPC
- ✅ **Responsive Design** - Mobile-first UI
- ✅ **Dark Mode** - Theme support

### API Documentation

Visit **http://localhost:3001/panel** when running in development mode to access the interactive tRPC Panel for testing API endpoints.

## Project Documentation

- [API Documentation](./apps/api/README.md)
- [Web App Documentation](./apps/web/README.md)
- [Database Schema](./packages/database/README.md)

## Development Workflow

1. Make changes to your code
2. The dev servers will automatically reload
3. Visit http://localhost:3000 to see your changes
4. Use http://localhost:3001/panel to test API endpoints

## Architecture

### Monorepo Structure

```
nazaritor/
├── apps/
│   ├── api/           # Backend API (tRPC + Hono)
│   └── web/           # Frontend (Next.js)
├── packages/
│   ├── database/      # Database schema (Drizzle)
│   ├── schemas/       # Shared Zod schemas
│   └── types/         # Shared TypeScript types
└── package.json       # Workspace configuration
```

### Data Flow

```
Web App (Next.js)
    ↓ tRPC Client
API Server (Hono + tRPC)
    ↓ Drizzle ORM
Database (SQLite)
```

## Environment Variables

### API (.env in apps/api)
```bash
PORT=3001
DATABASE_URL=./data/nazaritor.db
NODE_ENV=development
```

### Web (.env.local in apps/web)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Contributing

1. Follow the existing code patterns
2. Maintain type safety
3. Write tests for new features
4. Use the atomic design pattern for components
5. Run `bun run format` before committing

## License

Private - All Rights Reserved
