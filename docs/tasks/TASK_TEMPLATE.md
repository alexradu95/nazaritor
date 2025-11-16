# [TASK-XXX] - [Task Title]

> **Status:** Not Started | In Progress | Completed
> **Complexity:** Low | Medium | High
> **Estimated Time:** [X hours]
> **Assigned To:** [AI Agent Name / Developer]

---

## Overview

Brief 1-2 sentence description of what needs to be built.

---

## User Story

**As a** [type of user]
**I want** [goal/desire]
**So that** [benefit/value]

### Example

As a knowledge worker, I want to search across all my notes by keyword, so that I can quickly find relevant information without manually browsing.

---

## Acceptance Criteria

What must be true for this task to be considered complete:

- [ ] Criterion 1 - Specific, testable requirement
- [ ] Criterion 2 - Specific, testable requirement
- [ ] Criterion 3 - Specific, testable requirement
- [ ] All tests pass
- [ ] Documentation updated
- [ ] No TypeScript errors
- [ ] Code follows project conventions (see CLAUDE.md)

---

## Technical Specification

### API Changes

If this task involves API changes, specify:

```typescript
// New tRPC procedure
export const searchRouter = router({
  searchObjects: publicProcedure
    .input(z.object({
      query: z.string().min(1),
      types: z.array(z.string()).optional(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      // Implementation details
    }),
})
```

### Database Changes

If this task requires schema changes:

```sql
-- New table or columns
ALTER TABLE objects ADD COLUMN search_vector TEXT;
CREATE INDEX idx_search_vector ON objects(search_vector);
```

### Frontend Changes

If this task involves UI:

- Component structure
- User interactions
- State management
- Styling approach

### Dependencies

Libraries or tools needed:

- Package name and version
- Why it's needed
- Alternatives considered

---

## Implementation Plan

Step-by-step approach to implementing this task:

1. **Setup**
   - Install dependencies
   - Create necessary files

2. **Write Tests (TDD)**
   - Write failing test for first behavior
   - Implement minimum to pass
   - Refactor

3. **Core Implementation**
   - Key functions/components to build
   - Order of implementation

4. **Integration**
   - Connect to existing systems
   - Update related components

5. **Documentation**
   - Update API docs
   - Update current_status docs
   - Add code comments where needed

---

## Test Requirements

### Unit Tests

What needs unit test coverage:

```typescript
describe('searchObjects', () => {
  it('should find objects matching query', async () => {
    // Test implementation
  })

  it('should filter by object types', async () => {
    // Test implementation
  })

  it('should handle empty results', async () => {
    // Test implementation
  })
})
```

### Integration Tests

What needs integration testing:

- End-to-end user flows
- API integration
- Database queries

### Test Coverage Target

Minimum test coverage: **100% of business logic**

---

## Dependencies

### Prerequisite Tasks

Tasks that must be completed before this one:

- [TASK-XXX] - Task name (why it's needed)
- [TASK-YYY] - Task name (why it's needed)

### Blocking Tasks

Tasks that are blocked by this one:

- [TASK-ZZZ] - Task name (how it depends on this)

### Related Code

Existing code this task builds upon:

- `apps/api/src/trpc/routers/object.ts` - Object CRUD operations
- `packages/schemas/src/objects/base.ts` - Base object schema

---

## Edge Cases & Considerations

Known edge cases to handle:

1. **Edge case 1** - How to handle
2. **Edge case 2** - How to handle
3. **Edge case 3** - How to handle

Performance considerations:

- Indexing strategy
- Query optimization
- Caching approach

Security considerations:

- Input validation
- Authorization checks
- Rate limiting

---

## Success Metrics

How to measure if this task is successful:

- **Functional:** All acceptance criteria met
- **Quality:** 100% test coverage, no TypeScript errors
- **Performance:** [Specific metric, e.g., "Search returns in <100ms"]
- **User Experience:** [How user benefits, e.g., "Can find any note in 2 clicks"]

---

## Documentation Updates Required

What documentation needs to be updated:

- [ ] `docs/current_status/api-design.md` - Add new endpoint
- [ ] `docs/current_status/STATUS.md` - Add to "What Works" section
- [ ] `docs/current_status/development.md` - Add any new commands
- [ ] Code comments in implementation files

---

## Related Documentation

Links to relevant docs:

- [Current API Design](../current_status/api-design.md)
- [Object System Spec](../future/object-system.md)
- [Development Guide](../current_status/development.md)
- [Project Conventions](../../CLAUDE.md)

---

## Notes

Any additional context, decisions, or considerations:

- Why this approach was chosen over alternatives
- Known limitations
- Future improvements to consider
- Links to relevant discussions or issues

---

## Completion Checklist

Before marking this task as complete:

- [ ] All acceptance criteria met
- [ ] All tests written and passing
- [ ] Test coverage target achieved
- [ ] No TypeScript errors or warnings
- [ ] Code follows TDD and functional programming principles
- [ ] Documentation updated
- [ ] Edge cases handled
- [ ] Code reviewed (if applicable)
- [ ] Committed with conventional commit message
- [ ] Task moved to `completed/` directory

---

**Created:** [YYYY-MM-DD]
**Last Updated:** [YYYY-MM-DD]
**Completed:** [YYYY-MM-DD] (when done)
