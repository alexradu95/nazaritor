# Future Plans & Specifications

This directory contains long-term plans, roadmaps, and detailed specifications for features not yet implemented.

## 📄 Files

### Strategic Planning

- **[roadmap.md](./roadmap.md)** - 6-month implementation timeline with phases and milestones
- **[object-system.md](./object-system.md)** - Complete specification of all 11 object types and the property system

### AI System Design

- **[ai-agents.md](./ai-agents.md)** - Multi-agent system architecture
  - Curator Agent (organizes knowledge)
  - Researcher Agent (finds information)
  - Builder Agent (generates UI)
  - Agent orchestration and collaboration

### Frontend Vision

- **[frontend-guide.md](./frontend-guide.md)** - Minimal Next.js approach with AI SDK
  - Dynamic UI generation with streamUI
  - Chat-first interface design
  - View components (table, kanban, calendar, graph)

---

## Purpose of Future Docs

These documents serve several purposes:

1. **Vision Alignment** - Ensure everyone understands where we're going
2. **Architecture Planning** - Design systems before implementing them
3. **Task Generation** - Break down into discrete tasks in `../tasks/`
4. **Decision Making** - Reference when making implementation choices

---

## How to Use These Docs

### When Planning

- Read roadmap.md to understand timeline and phases
- Review relevant specs to understand full system design
- Break large features into tasks for `../tasks/`

### When Implementing

- Reference specs for detailed requirements
- Check if current work aligns with long-term vision
- Update `../current_status/` docs when features are completed
- Move completed portions out of future/ to current_status/

### When Designing

- Use these as the source of truth for intended behavior
- Propose changes via discussion/PR if design needs adjustment
- Ensure new features fit within the overall architecture

---

## Roadmap Overview

### Phase 1: Foundation (Months 1-3) ✅

**Status:** Week 6 Complete

- [x] Monorepo setup with Bun
- [x] Core object system (CRUD)
- [x] SQLite database with Drizzle
- [x] tRPC API
- [x] Basic testing infrastructure
- [x] Next.js frontend foundation

### Phase 2: AI-First Features (Months 3-5) 🚧

**Status:** Not Started

- [ ] Multi-agent AI system
- [ ] Chat interface
- [ ] Dynamic UI generation (streamUI)
- [ ] All view types (table, kanban, calendar, graph)
- [ ] Relations system
- [ ] Search (full-text + semantic)

### Phase 3: Advanced Features (Months 5-6) 📅

**Status:** Planned

- [ ] Custom object types
- [ ] Real-time collaboration
- [ ] Mobile app foundation
- [ ] Public API
- [ ] Performance optimization

See [roadmap.md](./roadmap.md) for detailed breakdown.

---

## AI Agent System Preview

The AI-first approach is the core differentiator of this project:

```
User Input (Natural Language)
       ↓
Conversation Router (analyzes intent)
       ↓
    ┌──────────────┬──────────────┬──────────────┐
    ↓              ↓              ↓              ↓
Curator Agent  Researcher    Builder Agent   More...
(Organize)     (Search)      (Generate UI)
    ↓              ↓              ↓
       Object System (tRPC API)
```

See [ai-agents.md](./ai-agents.md) for full specification.

---

## Object System Preview

11 default object types, fully extensible:

1. **Projects** - Large initiatives with tasks and timelines
2. **Daily Notes** - Journal entries for specific days
3. **Knowledge Bits** - Atomic knowledge (Zettelkasten)
4. **Personal Bits** - Private thoughts
5. **Weblinks** - Saved URLs with metadata
6. **People** - Contacts and relationships
7. **Pages** - Long-form documents
8. **Financial Entries** - Wealth tracking
9. **Tasks** - Actionable items
10. **Calendar Entries** - Events and scheduled time
11. **Habits** - Repeating behaviors

Plus: Custom object types users can create!

See [object-system.md](./object-system.md) for full details.

---

## Frontend Approach Preview

**Minimal Next.js + AI SDK:**

- Next.js 15 used primarily for Vercel AI SDK integration
- Chat-first interface (most interaction via conversation)
- Dynamic UI generation using `streamUI` from AI SDK
- Traditional views only when AI determines they're needed
- Minimal routing - mostly single-page chat experience

See [frontend-guide.md](./frontend-guide.md) for philosophy and patterns.

---

## Updating Future Docs

**When to update:**

1. **Architecture changes** - Update specs when we decide to do things differently
2. **Scope changes** - Update roadmap if timeline or priorities shift
3. **New features** - Add specs for new major features
4. **Completed work** - Move relevant sections to `../current_status/`

**Process:**

1. Discuss proposed changes (don't make major changes unilaterally)
2. Update the spec documents
3. Ensure changes don't conflict with current implementation
4. Update roadmap if timeline is affected
5. Break down new work into tasks in `../tasks/`

---

## Questions About the Future?

- Check if answer is in roadmap.md
- Read relevant spec documents
- If still unclear, create a discussion/issue
- Update docs with the answer for next person

---

**Last Updated:** 2025-11-16
**Current Phase:** Phase 1 Complete, Phase 2 Planning
**Next Milestone:** Multi-agent AI system implementation
