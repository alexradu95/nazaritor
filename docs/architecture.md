# Architecture Decision Record

## Overview

This document outlines the architectural decisions for the AI-First Knowledge Management System, explaining the rationale behind our technology choices and system design.

## System Architecture

### High-Level Design

```
┌─────────────────────────────────────────────┐
│           Backend API (The Brain)            │
│  - Core business logic                       │
│  - Object system (CRUD)                      │
│  - Multi-agent AI orchestration              │
│  - Database (PostgreSQL + Drizzle)           │
│  - Authentication & authorization            │
│  - Real-time subscriptions                   │
└─────────────────┬───────────────────────────┘
                  │ tRPC (Type-safe API)
        ┌─────────┴─────────┬─────────────┬───────────┐
        │                   │             │           │
┌───────▼───────┐  ┌────────▼──────┐  ┌──▼──┐  ┌────▼────┐
│  Next.js Web  │  │  Mobile Apps  │  │ CLI │  │ Desktop │
│  + AI SDK     │  │  (Future)     │  │     │  │  Apps   │
│  (streamUI)   │  │               │  │     │  │ (Future)│
└───────────────┘  └───────────────┘  └─────┘  └─────────┘
```

### Architecture Type: **Hybrid (Separate Backend + Frontend)**

We chose a hybrid architecture with a platform-agnostic backend API and a Next.js frontend for the following reasons:

1. **Multi-Platform Requirements**: Need to support web, mobile apps (iOS/Android), desktop apps (Electron/Tauri), and a public API
2. **Clean Separation**: Backend business logic is independent of presentation layer
3. **Type Safety**: tRPC provides end-to-end type safety between backend and all TypeScript clients
4. **Scalability**: Can scale backend and frontend independently
5. **Team Growth**: Clear boundaries enable parallel development in the future

---

## Technology Decisions

### Backend Technology Stack

#### Runtime: **Bun**

**Decision:** Use Bun instead of Node.js

**Rationale:**
- Significantly faster than Node.js (3-4x performance improvement)
- Native TypeScript support (no transpilation needed)
- Built-in test runner (alternative to Vitest)
- Compatible with Node.js ecosystem
- Modern tooling designed for TypeScript-first development
- Better developer experience with faster install and execution

**Tradeoffs:**
- Newer technology (less mature than Node.js)
- Smaller ecosystem of Bun-specific packages
- Some edge cases may require Node.js fallback

#### Framework: **Hono**

**Decision:** Use Hono instead of Express or Fastify

**Rationale:**
- Ultra-fast, edge-ready framework
- Excellent TypeScript support (built with TypeScript first)
- Lightweight and minimal (no unnecessary bloat)
- Works seamlessly with Bun
- tRPC adapter available
- Modern API design (better DX than Express)
- Can deploy to edge runtimes (Cloudflare Workers, Deno, etc.) if needed

**Alternatives Considered:**
- **Express**: Too old, poor TypeScript support, slower
- **Fastify**: Good option, but Hono is faster and more modern
- **NestJS**: Too heavy, over-engineered for our needs

#### API Layer: **tRPC v11**

**Decision:** Use tRPC for API communication

**Rationale:**
- **End-to-end type safety**: Automatic type inference from backend to frontend
- **No code generation**: Types flow automatically through TypeScript
- **Excellent DX**: Autocomplete, type checking, refactoring across full stack
- **Subscriptions support**: Built-in support for real-time updates
- **Multi-client support**: Works with Next.js, React Native, and any TypeScript client
- **Smaller learning curve**: Simpler than GraphQL, more powerful than REST

**Why not GraphQL?**
- GraphQL adds complexity (schema definition language, resolvers, etc.)
- Code generation required for type safety
- Over-engineered for a TypeScript-only stack
- tRPC gives us the same benefits with less overhead

**Why not REST?**
- No automatic type safety
- Manual API contracts and validation
- More boilerplate code
- Higher risk of frontend/backend mismatches

#### Database: **PostgreSQL + Drizzle ORM**

**Decision:** Use PostgreSQL with Drizzle ORM

**Rationale:**
- **PostgreSQL**:
  - Robust, production-ready relational database
  - Excellent support for JSON columns (needed for flexible object properties)
  - JSONB indexing for fast queries on dynamic properties
  - Powerful full-text search capabilities
  - Strong consistency guarantees
  - Great ecosystem and tooling

- **Drizzle ORM**:
  - Type-safe query builder (TypeScript-first)
  - Lightweight (not a heavy abstraction like TypeORM)
  - SQL-like syntax (easy to understand and debug)
  - Excellent migrations system
  - Works perfectly with Bun
  - Better performance than Prisma
  - No runtime schema validation overhead

**Alternatives Considered:**
- **Prisma**: Good but slower, heavier abstraction, schema language overhead
- **TypeORM**: Too heavy, decorators-based (not functional style)
- **Raw SQL**: Too low-level, no type safety

#### Validation: **Zod**

**Decision:** Use Zod for schema validation

**Rationale:**
- TypeScript-first schema validation
- Works seamlessly with tRPC
- Shared schemas between frontend and backend
- Excellent error messages
- Type inference (schemas become TypeScript types)
- Composable and functional
- Runtime validation + compile-time type checking

---

### Frontend Technology Stack

#### Framework: **Next.js 15 (Minimal Approach)**

**Decision:** Use Next.js, but keep it minimal (primarily for Vercel AI SDK's `streamUI`)

**Rationale:**
- **streamUI Requirement**: Vercel AI SDK's `streamUI` feature (core to our vision) requires Next.js App Router with React Server Components
- **AI-First Interaction**: Dynamic component generation from AI chat is a core feature
- **Progressive Enhancement**: Start simple, use advanced features only when beneficial
- **Good DX**: Fast refresh, TypeScript support, modern tooling

**Minimal Usage Strategy:**
- 90% client components (`'use client'`)
- ONE server action file for AI streaming only
- Treat as "React + AI streaming" rather than full Next.js
- Skip SSR/SSG/ISR initially (SPA-style app is fine)
- Use advanced features (parallel routes, intercepting routes) only if they provide clear value

**Why Not Vite + React?**
- Can't use Vercel AI SDK's `streamUI` (requires Next.js RSC)
- Would need to build custom streaming UI solution
- AI SDK's `useChat` hook doesn't support dynamic component generation
- More manual work for AI-UI integration

**Tradeoffs:**
- Next.js adds complexity (App Router, RSC concepts)
- Heavier than Vite for a SPA
- Vendor lock-in to Vercel ecosystem for AI features
- Steeper learning curve for beginners

**Mitigation:**
- Minimal usage pattern reduces complexity
- Excellent documentation and community
- Benefits outweigh complexity for AI-first vision

#### AI Integration: **Vercel AI SDK v3.x**

**Decision:** Use Vercel AI SDK with `streamUI` feature

**Rationale:**
- **Dynamic Component Generation**: `streamUI` allows AI to generate and stream React components
- **CopilotKit-style State Sync**: Built-in patterns for AI-UI state synchronization
- **Streaming Support**: Smooth UX with progressive response rendering
- **Tool Calling**: Built-in support for AI function calling
- **Model Agnostic**: Works with OpenAI, Anthropic, and other providers

**Alternative Considered:**
- Direct OpenAI/Anthropic SDK: Would require custom streaming UI implementation

#### State Management: **tRPC's Built-in React Query**

**Decision:** Use tRPC's React Query integration (simple usage)

**Rationale:**
- **Not an Extra Dependency**: tRPC uses React Query internally (`@trpc/react-query`)
- **Type-Safe Hooks**: Automatic type inference from backend procedures
- **Free Benefits**: Caching, optimistic updates, background refetching
- **Good DX**: Less boilerplate than plain React useState/useEffect
- **Aligned with Minimal Approach**: Use basic hooks only, skip advanced features

**Why Not Plain React (useState/useEffect)?**
- More boilerplate for data fetching
- No caching (wasteful refetches)
- No optimistic updates
- Manual error handling for every request

**Why Not Next.js Native (Server Components + Server Actions)?**
- Conflicts with "minimal Next.js" approach
- Requires Server Components everywhere
- Loses tRPC type safety
- More complex mental model

**Simple Usage Pattern:**
```typescript
// Basic data fetching
const { data } = trpc.object.list.useQuery()

// Mutations
const createObject = trpc.object.create.useMutation()

// That's it! No need for advanced React Query features
```

#### UI Components: **shadcn/ui + Tailwind CSS**

**Decision:** Use shadcn/ui component library

**Rationale:**
- Copy-paste components (you own the code, not a package dependency)
- Built with Radix UI (accessible primitives)
- Tailwind CSS styling (utility-first, fast development)
- Customizable and flexible
- TypeScript-first
- Already familiar to the team

---

## Development Practices

### Testing: **Test-Driven Development (TDD)**

**Decision:** TDD is non-negotiable

**Rationale:**
- Forces clear thinking about behavior before implementation
- Higher code quality and fewer bugs
- Living documentation through tests
- Confidence in refactoring
- 100% coverage of business logic

**Testing Tools:**
- **Backend**: Vitest (fast, works with Bun)
- **Frontend**: Vitest + Testing Library
- **E2E**: Playwright (for critical user flows)

**Red-Green-Refactor Cycle:**
1. Write failing test (Red)
2. Write minimal code to pass (Green)
3. Refactor while keeping tests green
4. Repeat

### Code Style: **Functional Programming Principles**

**Decision:** Functional programming patterns throughout

**Rationale:**
- Pure functions (no side effects)
- Immutable data structures
- Easier to test and reason about
- Better composability
- TypeScript strict mode always

**Patterns:**
- No mutations (use spread operators, immutable updates)
- Small, focused functions
- Composition over inheritance
- Schema-first development with Zod

---

## Deployment Strategy

### Backend Deployment

**Options:**
- **Railway** (recommended for MVP)
- **Render**
- **Fly.io**

**Why Not Vercel?**
- Vercel is optimized for serverless/edge
- We need long-running processes for AI agents
- Better pricing for persistent backends on Railway/Render

### Frontend Deployment

**Platform:** Vercel (recommended)

**Rationale:**
- Optimized for Next.js
- Automatic deployments from Git
- Edge network for fast global access
- Generous free tier

### Database Hosting

**Options:**
- **Neon** (serverless PostgreSQL)
- **Supabase** (PostgreSQL with extras)
- **Railway** (PostgreSQL add-on)

**Recommended:** Neon for free tier + excellent DX

---

## Monorepo Strategy

### Tool: **Turborepo**

**Decision:** Use Turborepo for monorepo management

**Rationale:**
- Efficient task caching (fast builds and tests)
- Manages dependencies between packages
- Works great with TDD workflow (cached test runs)
- Simple configuration
- Excellent DX with parallel task execution

**Structure:**
```
nazaritor/
├── apps/
│   ├── api/           # Backend (Hono + tRPC)
│   └── web/           # Next.js frontend
├── packages/
│   ├── schemas/       # Shared Zod schemas
│   ├── types/         # Shared TypeScript types
│   ├── ui/            # Shared React components
│   └── database/      # Drizzle schemas & migrations
```

**Benefits:**
- Shared code between apps (types, schemas, components)
- Single source of truth for data models
- Type safety across entire stack
- Easy to add new apps (mobile, desktop, CLI)

---

## Future Considerations

### Scalability

If we outgrow the monolithic backend:

1. **Extract AI Agent Service**: Dedicated service for multi-agent orchestration
2. **Separate Search Service**: Elasticsearch/Typesense for advanced search
3. **Background Job Queue**: Bull/BullMQ for async tasks
4. **Event-Driven Architecture**: Event bus for loose coupling

### Performance Optimization

Future optimizations if needed:

1. **Caching Layer**: Redis for frequently accessed data
2. **CDN**: Cloudflare for static assets
3. **Database Optimization**: Read replicas, connection pooling
4. **Edge Functions**: Move some logic to edge for lower latency

---

## Summary

Our architecture balances pragmatism with future-proofing:

- **Separate backend**: Ready for multi-platform from day 1
- **Minimal Next.js**: Leverage `streamUI` without over-complexity
- **Type-safe stack**: tRPC + Zod + TypeScript strict mode
- **Modern tooling**: Bun, Hono, Drizzle for excellent DX
- **TDD-first**: Quality over speed, tests as documentation
- **Functional patterns**: Pure functions, immutable data, composability

This architecture supports rapid iteration while maintaining high code quality and setting us up for future growth.
