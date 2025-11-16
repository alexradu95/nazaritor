# Documentation

This directory contains all documentation for the Nazaritor project, organized into three main categories:

## 📁 Directory Structure

### [`current_status/`](./current_status/)
Current state of the project - what's built, how it works, and how to use it.

**What you'll find:**
- Project status and metrics
- Current architecture and tech stack
- API documentation
- Development guides
- Setup instructions

**When to read:** When you want to understand what's currently implemented and how to work with the existing codebase.

---

### [`tasks/`](./tasks/)
Discrete, parallelizable user stories ready for AI agents to implement.

**What you'll find:**
- Individual feature specifications
- User story documents
- Implementation tasks with clear scope
- Task templates

**When to read:** When you want to pick up a specific feature to implement, or when you want to break down larger features into manageable tasks.

---

### [`future/`](./future/)
Future plans, roadmaps, and specifications for features not yet implemented.

**What you'll find:**
- 6-month implementation roadmap
- Full system specifications
- Planned features and architecture
- AI agent system design
- Future frontend approach

**When to read:** When you want to understand the long-term vision, plan new features, or see what's coming next.

---

## Quick Navigation

### I want to...

- **Get started developing** → [`current_status/QUICKSTART.md`](./current_status/QUICKSTART.md)
- **Set up my environment** → [`current_status/SETUP.md`](./current_status/SETUP.md)
- **See what's been built** → [`current_status/STATUS.md`](./current_status/STATUS.md)
- **Understand the architecture** → [`current_status/architecture.md`](./current_status/architecture.md)
- **Work on the API** → [`current_status/api-design.md`](./current_status/api-design.md)
- **Pick up a task** → [`tasks/`](./tasks/)
- **See the roadmap** → [`future/roadmap.md`](./future/roadmap.md)
- **Learn about AI agents** → [`future/ai-agents.md`](./future/ai-agents.md)

---

## Documentation Philosophy

### current_status/
- **Purpose:** Definitive reference for current implementation
- **Audience:** Developers working on the project right now
- **Maintenance:** Updated whenever features are completed
- **Truth:** What IS, not what WILL BE

### tasks/
- **Purpose:** Actionable work items for parallel development
- **Audience:** AI agents and developers picking up specific features
- **Structure:** Each task is self-contained and parallelizable
- **Scope:** Narrow, focused, completable in one session

### future/
- **Purpose:** Vision and long-term planning
- **Audience:** Stakeholders, planners, architects
- **Nature:** Aspirational, may change as project evolves
- **Scope:** Broad, interconnected, strategic

---

## Contributing to Documentation

When you **complete a feature:**
1. Update relevant docs in `current_status/`
2. Move related task from `tasks/` to completed
3. Update `current_status/STATUS.md` with new capabilities

When you **plan a new feature:**
1. Create detailed spec in `future/` (if it's a large feature)
2. Break it down into discrete tasks in `tasks/`
3. Update `future/roadmap.md` if it affects the timeline

When you **start working on a task:**
1. Read the task document in `tasks/`
2. Reference relevant `current_status/` docs for existing patterns
3. Check `future/` docs for overall vision and context

---

**Last Updated:** 2025-11-16
**Project Status:** Phase 1 Foundation Complete ✅
