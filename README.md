# Nazaritor - AI-First Knowledge Management System

An intelligent, object-based personal knowledge and project management system built with a conversational AI interface. Think Capacities meets ChatGPT - manage your entire life through natural conversation.

## Overview

Nazaritor is an AI-first application where users interact primarily through chat to manage their knowledge, tasks, projects, and personal information. The system uses multiple specialized AI agents to organize, search, and visualize your data dynamically.

### Key Features

- **AI-First Interaction**: Accomplish complex tasks through natural conversation
- **Multi-Agent System**: Three specialized AI agents (Curator, Researcher, Builder) working together
- **Dynamic UI Generation**: AI generates and streams UI components in real-time
- **Object-Based Architecture**: Everything is an object - flexible, interconnected, and AI-understandable
- **11 Default Object Types**: Projects, Daily Notes, Knowledge Bits, Personal Bits, Weblinks, People, Pages, Financial Entries, Tasks, Calendar Entries, Habits
- **Custom Objects**: Create your own object types with custom properties
- **Multiple Views**: Table, Kanban, Calendar, and Graph visualizations
- **Type-Safe Full Stack**: End-to-end type safety with tRPC and TypeScript

## Tech Stack

### Backend
- **Runtime**: Bun (faster than Node.js, native TypeScript)
- **Framework**: Hono (ultra-fast, edge-ready)
- **API**: tRPC v11 (end-to-end type safety)
- **Database**: SQLite (Bun native) + Drizzle ORM
- **AI**: OpenAI/Anthropic SDK with multi-agent orchestration
- **Validation**: Zod schemas

### Frontend
- **Framework**: Next.js 15 (minimal approach - mainly for AI SDK)
- **AI**: Vercel AI SDK v3.x with `streamUI` for dynamic components
- **State**: tRPC's built-in React Query
- **UI**: shadcn/ui + Tailwind CSS
- **Editor**: Lexical (rich text)
- **Search**: Fuse.js (fuzzy) + AI semantic search

### Monorepo
- **Package Manager**: Bun (fast, native)
- **Testing**: Bun test (TDD throughout)

## Architecture

```
┌─────────────────────────────────────────────┐
│         Backend API (Hono + tRPC)            │
│  - Object system (CRUD)                      │
│  - Multi-agent AI orchestration              │
│  - SQLite database (Bun native)              │
└─────────────────┬───────────────────────────┘
                  │ tRPC (Type-safe)
        ┌─────────┴─────────┬───────────┬──────┐
        │                   │           │      │
┌───────▼───────┐  ┌────────▼──────┐  ...   ...
│  Next.js Web  │  │  Mobile App   │
│  + AI SDK     │  │  (Future)     │
└───────────────┘  └───────────────┘
```

### Hybrid Architecture
- **Platform-agnostic backend**: Ready for web, mobile, desktop, and public API
- **Minimal Next.js frontend**: Leverages AI SDK's `streamUI` without over-complexity
- **Shared type system**: Zod schemas and TypeScript types across the stack

## Project Structure

```
nazaritor/
├── apps/
│   ├── api/                    # Backend (Hono + tRPC + Bun)
│   └── web/                    # Next.js frontend
├── packages/
│   ├── schemas/                # Shared Zod schemas
│   ├── types/                  # Shared TypeScript types
│   ├── ui/                     # Shared React components
│   └── database/               # Drizzle schemas & migrations
├── docs/                       # Comprehensive documentation
├── turbo.json                  # Turborepo config
└── README.md                   # This file
```

## Quick Start

### Prerequisites

- **Bun** v1.0.0+ - [Install here](https://bun.sh)
- **Node.js** v20+ (for Next.js frontend only) - [Install here](https://nodejs.org)

No database server needed - SQLite works out of the box! Bun handles both runtime and package management.

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd nazaritor

# Install dependencies
bun install

# Setup environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# Edit .env files with your configuration

# Run database migrations (creates SQLite database)
cd apps/api
bun src/db/migrate.ts

# Start development servers
cd ../..
bun run dev        # Backend API
# OR
bun run dev:web    # Frontend (in separate terminal)
```

The backend will be available at http://localhost:3001 and the frontend at http://localhost:3000.

## Development

### Running the Project

```bash
# From root directory
bun run dev          # Start backend API
bun run dev:web      # Start frontend
bun run build        # Build all packages and apps
bun run test         # Run tests
bun run test:watch   # Run tests in watch mode

# From apps/api directory
cd apps/api
bun run dev          # Start backend dev server
bun run test         # Run backend tests
bun run db:studio    # Open Drizzle Studio

# From apps/web directory
cd apps/web
bun run dev          # Start frontend dev server
bun run build        # Build for production
```

### Test-Driven Development

This project follows **strict TDD** using the Red-Green-Refactor cycle:

1. **Red**: Write failing test
2. **Green**: Write minimal code to pass
3. **Refactor**: Improve code quality

Example:

```typescript
// 1. Write failing test
it('should create a project', () => {
  const project = createProject({ title: 'New Project' })
  expect(project.type).toBe('project')
})

// 2. Implement
export function createProject(input) {
  return { ...input, type: 'project' }
}

// 3. Refactor with proper types and validation
```

### Database Management

```bash
# Open Drizzle Studio (database UI)
cd apps/api
pnpm db:studio

# Generate migration from schema changes
pnpm db:generate

# Run migrations
pnpm db:migrate
```

## AI Agents

The system uses three specialized AI agents:

### 1. Curator Agent
**Role**: Organizes and structures knowledge
- Categorizes objects
- Suggests tags and properties
- Creates relations between objects
- Maintains knowledge structure

### 2. Researcher Agent
**Role**: Finds and synthesizes information
- Semantic search across objects
- Summarizes content
- Extracts entities and concepts
- Generates insights

### 3. Builder Agent
**Role**: Generates UI dynamically
- Creates UI components from descriptions
- Builds dashboards and visualizations
- Updates views in real-time

## Object Types

### Default Objects (11 types)

1. **Projects** - Large initiatives with tasks and timelines
2. **Daily Notes** - Journal entries for specific days
3. **Knowledge Bits** - Atomic pieces of knowledge (Zettelkasten-style)
4. **Personal Bits** - Private thoughts and reflections
5. **Weblinks** - Saved URLs with metadata
6. **People** - Contacts and relationships
7. **Pages** - Long-form documents
8. **Financial Entries** - Wealth tracking and budgets
9. **Tasks** - Actionable items with deadlines
10. **Calendar Entries** - Events and scheduled time
11. **Habits** - Repeating behaviors to track

### Custom Objects

Users can create custom object types with their own properties and relations.

## Example Workflows

### Create a Project via Chat

```
User: "Create a new project called Mobile App Redesign"
AI: "I've created a new project 'Mobile App Redesign' with status
'planning'. Would you like me to break this down into tasks?"

User: "Yes, create tasks for the main phases"
AI: *Creates tasks for Design, Development, Testing, Launch*
"I've created 4 tasks and linked them to your project.
Want to see them in a kanban board?"

User: "Show kanban"
AI: *Generates and streams Kanban component*
```

### Find and Summarize Information

```
User: "What have I learned about React hooks?"
AI: *Searches knowledge bits*
"I found 5 notes about React hooks. Here's a summary:
- useState for state management
- useEffect for side effects
- Custom hooks for reusable logic
Would you like me to create a comprehensive page combining these?"
```

### Financial Tracking

```
User: "What's my current net worth?"
AI: *Finds latest financial entry*
"Based on your latest snapshot from Jan 15:
- Assets: $150,000
- Liabilities: $50,000
- Net Worth: $100,000
Shall I create a chart showing your wealth trend over time?"
```

## Documentation

Documentation is organized into three categories in the `docs/` directory:

### 📁 [Current Status](docs/current_status/) - What's Built Now
- **[Quick Start](docs/current_status/QUICKSTART.md)** - Get up and running in 5 minutes
- **[Setup Guide](docs/current_status/SETUP.md)** - Detailed installation and configuration
- **[Project Status](docs/current_status/STATUS.md)** - Current capabilities and metrics
- **[Architecture](docs/current_status/architecture.md)** - Tech stack decisions and rationale
- **[API Design](docs/current_status/api-design.md)** - tRPC procedures and usage
- **[Development](docs/current_status/development.md)** - Development workflow and commands

### 📋 [Tasks](docs/tasks/) - Discrete Implementation Work
- Ready-to-implement user stories
- Self-contained, parallelizable tasks
- Clear acceptance criteria and specs
- (Tasks will be added as roadmap is broken down)

### 🔮 [Future Plans](docs/future/) - Vision & Roadmap
- **[Roadmap](docs/future/roadmap.md)** - 6-month implementation plan
- **[Object System](docs/future/object-system.md)** - Full specification of all 11 object types
- **[AI Agents](docs/future/ai-agents.md)** - Multi-agent system specification
- **[Frontend Guide](docs/future/frontend-guide.md)** - Next.js minimal approach with AI SDK

**See [docs/README.md](docs/README.md) for complete navigation guide.**

## Development Principles

### Code Quality
- **TDD always**: 100% coverage of business logic
- **Type safety**: TypeScript strict mode, no `any` types
- **Functional programming**: Pure functions, immutable data
- **Small functions**: Focused, composable, testable

### Architecture
- **Schema-first**: Zod schemas define all data structures
- **Domain-driven**: Business logic separate from framework code
- **API-first**: Backend API platform-agnostic
- **Progressive enhancement**: Start simple, add complexity when beneficial

## Roadmap

### Phase 1: Foundation (Months 1-3)
- ✅ Core object system
- ✅ Backend API with tRPC
- ✅ Basic AI agent
- ✅ Next.js frontend with chat interface

### Phase 2: AI-First Features (Months 3-5)
- [ ] Multi-agent system (Curator, Researcher, Builder)
- [ ] Dynamic UI generation with `streamUI`
- [ ] All view types (table, kanban, calendar, graph)
- [ ] Rich text editing and search

### Phase 3: Advanced Features (Months 5-6)
- [ ] Custom object types
- [ ] Real-time collaboration
- [ ] Mobile app foundation
- [ ] Public API

See [docs/roadmap.md](docs/roadmap.md) for detailed timeline.

## Contributing

This is currently a solo project, but contributions are welcome once the foundation is complete.

### Development Workflow

1. Create feature branch from `develop`
2. Write tests first (TDD)
3. Implement feature
4. Ensure all tests pass
5. Update documentation
6. Create pull request

### Commit Messages

Follow Conventional Commits:

```bash
feat(objects): add project creation endpoint
fix(ai): resolve streaming issue
docs: update development guide
test(objects): add relation tests
```

## License

[MIT License](LICENSE) - feel free to use this project as inspiration or a starting point for your own AI-first applications.

## Contact

For questions or feedback, please open an issue on GitHub.

---

**Built with TypeScript, tRPC, Next.js, and AI**

*Transforming knowledge management through intelligent conversation*
