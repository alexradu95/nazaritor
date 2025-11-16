# Capacities Feature Comparison

**Analysis Date:** January 2025
**Purpose:** Identify gaps between Nazaritor and Capacities to inform Phase 2 development

---

## Summary: What We Have vs. What Capacities Has

### ✅ **We Have (Core Architecture)**
- Object-based system (9 implemented types)
- Flexible properties per object type
- Relations between objects (11 relation types)
- Daily notes object type
- Calendar entries object type
- Bidirectional relations support
- Time-based metadata (createdAt, updatedAt)

### ⚠️ **Missing from Capacities (Mostly Frontend/UX)**
- **Timeline functionality** - chronological view of activities
- **Daily note as central hub** - auto-linking everything to today's note
- **Date-based navigation** - browsing by creation date
- **"Created on this day"** - retrospective views
- **Calendar integration bridge** - quick-add from calendar events

---

## Detailed Feature Comparison

### 1. Central Calendar & Time-Based Organization

#### **What Capacities Does:**

**Daily Notes as Central Hub:**
- Daily note acts as a "scratchpad" for each day
- **Timeline view**: Automatically shows all objects created/modified that day
- **Date references**: Auto-gathers notes, meetings, objects for a specific day
- **"Created on this day"**: Shows all notes created on a particular date
- All integrations flow into daily notes

**Calendar Integration:**
- Calendar events visible in sidebar
- Objects with Date properties link to daily notes
- Quick add button: Create object from calendar event
- Quick add button: Create calendar event from object
- Bridge between calendar and notes (but NOT a full calendar app)

**Philosophy:**
> "Time runs through Capacities" - every object is linked to time via the daily note

#### **What We Have:**

✅ Daily note object type with:
- `date` property (the day it represents)
- `mood`, `weather`, `highlights`, `gratitude`, `learnings`
- `todos` (array of task IDs - manual linking)

✅ Calendar entry object type with:
- Start/end times
- Location, attendees
- Event type, recurrence
- Relations to tasks/projects

✅ Time metadata on all objects:
- `createdAt`, `updatedAt` (indexed)
- Composite index: `(type, updated_at)` for sorting

#### **What We're Missing:**

❌ **Timeline Functionality:**
- No automatic "what happened today" view
- Daily notes don't auto-populate with created objects
- Can't browse "all objects created on Jan 15, 2025"

❌ **Auto-Linking to Daily Notes:**
- When you create a task today, it doesn't automatically show in today's daily note
- No timeline showing your day's activities
- Manual linking required (vs. automatic in Capacities)

❌ **Date-Based Navigation:**
- Can't easily browse: "What did I work on this week?"
- No "created on this day in history" feature
- No chronological browsing interface

❌ **Calendar Integration:**
- Calendar entries exist but don't "flow into" daily notes
- No quick-add from calendar event to object
- No visual integration between calendar and notes

---

### 2. Everything is Connected (Graph/Network)

#### **What Capacities Does:**

**Connection Philosophy:**
- Notes don't live in folders
- Loose, free connections (like your brain)
- Link notes to form associations
- Navigate through connections (e.g., book → person who recommended it)
- Two-way links: See all notes connected to an object

**Object Type Benefits:**
- Objects can exist in multiple "contexts" simultaneously
- No folder rigidity: "Where does this archived project go?"
- Search and connections > folder organization

#### **What We Have:**

✅ **Relation System:**
- 11 relation types: `contains`, `references`, `depends-on`, `assigned-to`, etc.
- Separate relations table (not embedded)
- Bidirectional querying: "What references this?" and "What does this reference?"
- Cascade deletes: Relations auto-delete when objects deleted

✅ **No Folder Structure:**
- Objects stored in single table
- Filtering by type: `WHERE type = 'project'`
- Multiple ways to access same object (by relations, tags, search)

✅ **Relation Helpers:**
```typescript
createRelation(fromId, toId, type)
findRelations(objectId, relationType?)
getRelatedObjectIds(objectId)
```

#### **What We're Missing:**

❌ **Easy Traversal UI:**
- Backend supports it, but need frontend to navigate connections
- No visual graph view (yet)
- Can't click through: Book → Person → Other books they recommended

❌ **Automatic Relation Suggestions:**
- Capacities likely suggests connections based on content
- We don't have AI suggesting: "This task might relate to Project X"

✅ **Note:** We have the architecture, just need the UI/UX layer

---

### 3. Everything is an Object

#### **What Capacities Does:**

**Object Philosophy:**
- Every note is an object (not a standalone document)
- Objects map to real-world things: books, films, people, places
- Each object type has tailored properties
- Objects freely link to each other
- Interconnected web of knowledge

**Example:**
> Person object (Julie) → linked to → Book object (recommendation) → your notes on the book

**User Testimonials (from their community):**
- "Objects! I migrated everything from Logseq manually, can't live without quick organization using types"
- "The connectedness of my objects through my daily note"
- "Tailored objects with tailored properties that can be linked"
- "Object-type approach brought intuitiveness to note-taking"

#### **What We Have:**

✅ **9 Object Types Implemented:**
1. **Project** - Status, priority, dates, objectives
2. **Task** - Status, priority, due dates, dependencies
3. **Daily Note** - Date, mood, highlights, gratitude
4. **Resource** - Articles, notes, snippets, quotes, ideas
5. **Weblink** - Bookmarks with metadata
6. **Person** - Contacts with relationship tracking
7. **Page** - Long-form wiki pages
8. **Calendar Entry** - Events, meetings
9. **Custom** - User-defined types

✅ **Flexible Properties:**
- Each type has tailored properties in `properties` JSON field
- 14 property types: text, number, date, select, email, URL, currency, rating, etc.
- Discriminated union validation (type-safe)

✅ **Interconnected:**
- Relations table links objects
- Can link: Person → Book → Notes → Project → Tasks

#### **What We're Missing:**

❌ **User-Created Object Types:**
- We have "Custom" type, but it's not fully fleshed out
- Capacities lets users define new object types with custom properties
- Need UI to create/manage custom object schemas

❌ **Object Templates:**
- No templates for creating new objects of a type
- Capacities likely has: "Create Book object" → pre-filled properties

✅ **Note:** Architecture supports this, just need implementation

---

## What This Means for Nazaritor

### Architecture Assessment: ✅ **We're Good**

Our architecture already supports everything Capacities does:
- ✅ Object-based system
- ✅ Flexible properties per type
- ✅ Relations table with 11 types
- ✅ Daily notes and calendar entries
- ✅ Time metadata (createdAt, updatedAt)
- ✅ Composite indexes for date queries

### Implementation Gaps: **Mostly Frontend/UX**

What we need to build (Phase 2 priorities):

#### **High Priority: Timeline & Daily Note Hub**

1. **Auto-Link Objects to Daily Notes**
   ```typescript
   // When creating an object, auto-create relation to today's daily note
   const todayNote = await getOrCreateDailyNote(new Date())
   await createRelation(newObject.id, todayNote.id, 'created-on')
   ```

2. **Timeline View in Daily Notes**
   ```typescript
   // Query: All objects created on this day
   const timeline = await db.objects
     .where('DATE(created_at) = ?', targetDate)
     .orderBy('created_at', 'desc')
   ```

3. **"Created on This Day" Feature**
   ```typescript
   // Query: All objects created on this day in previous years
   const memories = await db.objects
     .where('strftime("%m-%d", created_at) = ?', '01-15')
     .orderBy('created_at', 'desc')
   ```

#### **Medium Priority: Calendar Integration**

4. **Calendar-Daily Note Bridge**
   - Show calendar events in daily note sidebar
   - Quick-add: Calendar event → Object
   - Quick-add: Object with date → Calendar event

5. **Date-Based Navigation**
   - Browse objects by creation date
   - Week/month/year views
   - Filter by date range

#### **Low Priority (Backend Already Supports)**

6. **Graph Visualization**
   - Visual representation of relations
   - Click through connections
   - Force-directed layout

7. **Custom Object Types UI**
   - Create new object types
   - Define custom properties
   - Save as templates

---

## Specific Features to Implement

### Feature 1: Timeline in Daily Notes

**Backend (Already Have):**
```typescript
// Query objects created on a specific day
const objects = await ctx.db
  .select()
  .from(objects)
  .where(
    sql`DATE(${objects.createdAt}) = ${targetDate}`
  )
  .orderBy(desc(objects.createdAt))
```

**Frontend (Need to Build):**
```tsx
<DailyNote date={today}>
  <Timeline>
    <Section title="Created Today">
      {objectsCreatedToday.map(obj => <ObjectCard {...obj} />)}
    </Section>

    <Section title="Calendar Events">
      {calendarEvents.map(event => <EventCard {...event} />)}
    </Section>

    <Section title="Tasks Due">
      {tasksDueToday.map(task => <TaskCard {...task} />)}
    </Section>
  </Timeline>
</DailyNote>
```

### Feature 2: Auto-Linking to Daily Notes

**Backend (Need to Add):**
```typescript
// In object creation mutation
async function createObject(input) {
  // 1. Create object
  const newObject = await db.insert(objects).values(input)

  // 2. Get or create today's daily note
  const today = new Date().toISOString().split('T')[0]
  const dailyNote = await getOrCreateDailyNote(today)

  // 3. Auto-create relation
  await createRelation({
    fromObjectId: newObject.id,
    toObjectId: dailyNote.id,
    relationType: 'created-on',
    metadata: { auto: true }
  })

  return newObject
}
```

**Frontend (Need to Build):**
- Daily note shows "Created Today" section automatically
- Click object in timeline to navigate
- Filter by object type

### Feature 3: "Created on This Day" (Memories)

**Backend (Need to Add Query):**
```typescript
// New tRPC procedure
createdOnThisDay: protectedProcedure
  .input(z.object({
    monthDay: z.string().regex(/^\d{2}-\d{2}$/) // "01-15"
  }))
  .query(async ({ input, ctx }) => {
    // SQLite query for "this day in history"
    const objects = await ctx.db
      .select()
      .from(objects)
      .where(
        sql`strftime('%m-%d', ${objects.createdAt}) = ${input.monthDay}`
      )
      .orderBy(desc(objects.createdAt))

    // Group by year
    return groupByYear(objects)
  })
```

**Frontend (Need to Build):**
```tsx
<MemoriesSection>
  <h2>On This Day in History</h2>
  {years.map(year => (
    <YearGroup year={year}>
      {objectsFromYear.map(obj => (
        <MemoryCard object={obj} yearsAgo={currentYear - year} />
      ))}
    </YearGroup>
  ))}
</MemoriesSection>
```

---

## Recommended Implementation Order

### Phase 2A: Timeline Foundation (Weeks 1-2)
1. ✅ Backend query: Objects created on date
2. ✅ Backend query: Objects modified on date
3. ✅ Auto-link objects to daily notes on creation
4. ✅ Timeline view in daily note detail page
5. ✅ "Created today" section

### Phase 2B: Calendar Integration (Weeks 3-4)
6. ✅ Calendar events in daily note sidebar
7. ✅ Quick-add: Event → Object
8. ✅ Quick-add: Object → Event
9. ✅ Date-based navigation UI

### Phase 2C: Advanced Features (Weeks 5-6)
10. ✅ "Created on this day" memories
11. ✅ Week/month/year views
12. ✅ Chronological browsing
13. ✅ Graph visualization (basic)

---

## SQL Queries We'll Need

### 1. Objects Created on Date
```sql
SELECT * FROM objects
WHERE DATE(created_at) = '2025-01-15'
ORDER BY created_at DESC;
```

### 2. Objects Modified on Date
```sql
SELECT * FROM objects
WHERE DATE(updated_at) = '2025-01-15'
ORDER BY updated_at DESC;
```

### 3. Objects Created This Month/Day Across Years
```sql
SELECT * FROM objects
WHERE strftime('%m-%d', created_at) = '01-15'
ORDER BY created_at DESC;
```

### 4. Objects in Date Range
```sql
SELECT * FROM objects
WHERE created_at BETWEEN '2025-01-01' AND '2025-01-31'
ORDER BY created_at DESC;
```

### 5. Daily Note Timeline (Objects + Relations)
```sql
-- Get daily note
SELECT * FROM objects
WHERE type = 'daily-note'
  AND json_extract(properties, '$.date') = '2025-01-15';

-- Get all objects created that day
SELECT o.* FROM objects o
WHERE DATE(o.created_at) = '2025-01-15'
ORDER BY o.created_at DESC;

-- Get all calendar events that day
SELECT o.* FROM objects o
WHERE o.type = 'calendar-entry'
  AND DATE(json_extract(o.properties, '$.startTime')) = '2025-01-15'
ORDER BY json_extract(o.properties, '$.startTime') ASC;
```

---

## Database Schema Enhancements Needed

### Option 1: Virtual Column (SQLite 3.31+)
```sql
ALTER TABLE objects
ADD COLUMN created_date TEXT
GENERATED ALWAYS AS (DATE(created_at)) VIRTUAL;

CREATE INDEX idx_objects_created_date ON objects(created_date);
```

**Benefits:**
- Fast date queries (indexed)
- No storage overhead (virtual)
- Automatic updates

### Option 2: Add Date Columns
```sql
ALTER TABLE objects ADD COLUMN created_date TEXT;
ALTER TABLE objects ADD COLUMN updated_date TEXT;

-- Populate
UPDATE objects SET created_date = DATE(created_at);
UPDATE objects SET updated_date = DATE(updated_at);

-- Index
CREATE INDEX idx_objects_created_date ON objects(created_date);
CREATE INDEX idx_objects_updated_date ON objects(updated_date);

-- Trigger to auto-update
CREATE TRIGGER update_date_columns
AFTER UPDATE ON objects
BEGIN
  UPDATE objects
  SET updated_date = DATE(NEW.updated_at)
  WHERE id = NEW.id;
END;
```

**Recommendation:** Use virtual columns (cleaner, no triggers needed)

---

## Key Insights

### What Capacities Got Right

1. **Daily Note as Hub**: Everything flows through time
2. **Automatic Linking**: Less manual work, more discovery
3. **Chronological Navigation**: Browse by "when" not just "what"
4. **Object Types > Folders**: Flexibility without rigidity
5. **Time as First-Class Citizen**: Not an afterthought

### What We Already Nail

1. **Architecture**: Our object-relation system is solid
2. **Flexibility**: 14 property types, custom properties
3. **Type Safety**: Zod schemas + TypeScript
4. **Performance**: Composite indexes for common queries
5. **Extensibility**: Easy to add new features

### What We Need to Build

1. **Timeline UX**: The "daily note as hub" experience
2. **Auto-Linking**: Objects → Daily notes automatically
3. **Date Navigation**: Browse by creation/modification date
4. **Calendar Bridge**: Visual integration with calendar events
5. **Memories**: "On this day" retrospective views

---

## Conclusion

**We're not missing any fundamental architecture.**

Our object-relation system already supports everything Capacities does. What we need is:

1. **Frontend implementation** of timeline views
2. **Auto-linking logic** on object creation
3. **Date-based queries** (which our indexes support)
4. **UX polish** around time-based navigation

**Estimate:** 2-3 weeks to implement core timeline features and match Capacities' time-based functionality.

**Next Steps:**
1. Create migration for virtual date columns
2. Add auto-linking to daily notes on object creation
3. Build timeline component for daily note view
4. Add "created on this day" query
5. Design calendar integration UI

**Status:** Ready to implement in Phase 2 🚀
