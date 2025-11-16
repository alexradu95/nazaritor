# Object System Specification

## Overview

The object system is the core of the knowledge management platform. Everything in the system is an object - projects, notes, tasks, people, habits, and more. Objects are flexible, extensible, and interconnected through relations.

### Design Philosophy

- **Everything is an object**: Unified mental model for all entities
- **Flexible schema**: Objects support custom properties via JSON columns
- **Strongly typed**: Zod schemas ensure type safety
- **AI-first**: Objects designed to be understood and manipulated by AI agents
- **Relational**: Objects can link to other objects (graph-based)

---

## Base Object Schema

All objects inherit from a base schema:

```typescript
import { z } from 'zod'

// Base Object Schema
export const BaseObjectSchema = z.object({
  id: z.string().uuid(),
  type: z.enum([
    'project',
    'daily-note',
    'knowledge-bit',
    'personal-bit',
    'weblink',
    'person',
    'page',
    'financial-entry',
    'task',
    'calendar-entry',
    'habit',
    'custom', // User-defined custom objects
  ]),
  title: z.string().min(1).max(500),
  content: z.string().optional(), // Rich text content (Lexical JSON)
  properties: z.record(z.string(), PropertyValueSchema), // Dynamic properties
  relations: z.array(RelationSchema),
  metadata: z.object({
    createdAt: z.date(),
    updatedAt: z.date(),
    createdBy: z.string().uuid().optional(), // User ID (future)
    tags: z.array(z.string()),
    archived: z.boolean().default(false),
    favorited: z.boolean().default(false),
  }),
})

export type BaseObject = z.infer<typeof BaseObjectSchema>
```

---

## Property System

Properties are flexible key-value pairs that can be added to any object.

### Property Types

```typescript
export const PropertyTypeEnum = z.enum([
  'text',           // Short text input
  'long-text',      // Multi-line text area
  'number',         // Numeric value
  'date',           // Date picker
  'datetime',       // Date + time picker
  'select',         // Single select dropdown
  'multi-select',   // Multiple select dropdown
  'checkbox',       // Boolean checkbox
  'url',            // URL input with validation
  'email',          // Email input with validation
  'relation',       // Link to another object
  'file',           // File upload
  'ai-generated',   // AI-generated content
  'currency',       // Money amount
  'rating',         // Star rating (1-5)
])

export const PropertyValueSchema = z.object({
  type: PropertyTypeEnum,
  value: z.any(), // Value depends on type
  config: z.object({
    // Configuration for select types
    options: z.array(z.string()).optional(),
    // For relation type
    allowedTypes: z.array(z.string()).optional(),
    // For number/currency type
    min: z.number().optional(),
    max: z.number().optional(),
    // For text type
    maxLength: z.number().optional(),
    // For AI-generated type
    prompt: z.string().optional(),
  }).optional(),
})
```

---

## Default Object Types

### 1. Project

Projects represent large initiatives or goals with tasks, timelines, and objectives.

```typescript
export const ProjectSchema = BaseObjectSchema.extend({
  type: z.literal('project'),
  properties: z.object({
    status: z.enum(['planning', 'active', 'on-hold', 'completed', 'cancelled']),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    startDate: z.date().optional(),
    dueDate: z.date().optional(),
    completedDate: z.date().optional(),
    progress: z.number().min(0).max(100).default(0), // Percentage
    objectives: z.array(z.string()).optional(),
    budget: z.number().optional(), // For financial tracking
    members: z.array(z.string().uuid()).optional(), // Person object IDs
    relatedTasks: z.array(z.string().uuid()).optional(), // Task object IDs
  }).passthrough(), // Allow additional properties
})

export type Project = z.infer<typeof ProjectSchema>
```

**AI Enhancements:**
- Generate project roadmap from description
- Break down into tasks automatically
- Suggest milestones and deadlines
- Risk analysis and progress tracking
- Generate status updates

### 2. Daily Note

Daily notes are journal entries for a specific day, capturing thoughts, events, and reflections.

```typescript
export const DailyNoteSchema = BaseObjectSchema.extend({
  type: z.literal('daily-note'),
  properties: z.object({
    date: z.date(), // The day this note represents
    mood: z.enum(['great', 'good', 'neutral', 'bad', 'terrible']).optional(),
    weather: z.string().optional(),
    highlights: z.array(z.string()).optional(), // Key events of the day
    gratitude: z.array(z.string()).optional(), // Things to be grateful for
    learnings: z.array(z.string()).optional(), // What you learned
    todos: z.array(z.string().uuid()).optional(), // Task object IDs
    wordCount: z.number().optional(), // Auto-calculated
  }).passthrough(),
})

export type DailyNote = z.infer<typeof DailyNoteSchema>
```

**AI Enhancements:**
- Generate daily summary from calendar events and tasks
- Extract highlights and key events automatically
- Suggest gratitude prompts
- Identify patterns across multiple days
- Generate weekly/monthly summaries

### 3. Knowledge Bit

Small, atomic pieces of knowledge or information (like Zettelkasten notes).

```typescript
export const KnowledgeBitSchema = BaseObjectSchema.extend({
  type: z.literal('knowledge-bit'),
  properties: z.object({
    category: z.string().optional(), // e.g., "Programming", "Philosophy"
    source: z.string().optional(), // Where this knowledge came from
    sourceUrl: z.string().url().optional(),
    dateAdded: z.date(),
    confidence: z.enum(['low', 'medium', 'high']).optional(), // How certain you are
    relatedBits: z.array(z.string().uuid()).optional(), // Other knowledge bits
    references: z.array(z.string().uuid()).optional(), // Weblink or page IDs
  }).passthrough(),
})

export type KnowledgeBit = z.infer<typeof KnowledgeBitSchema>
```

**AI Enhancements:**
- Extract entities and concepts from content
- Suggest related knowledge bits
- Automatically categorize based on content
- Generate connections to other bits
- Summarize complex knowledge
- Generate quiz questions for spaced repetition

### 4. Personal Bit

Private, personal information, thoughts, or reflections.

```typescript
export const PersonalBitSchema = BaseObjectSchema.extend({
  type: z.literal('personal-bit'),
  properties: z.object({
    category: z.enum([
      'thought',
      'reflection',
      'dream',
      'goal',
      'memory',
      'idea',
      'feeling',
      'other',
    ]).optional(),
    privacy: z.enum(['private', 'shared']).default('private'),
    emotionalTone: z.enum(['positive', 'neutral', 'negative']).optional(),
    dateRecorded: z.date(),
    relatedPeople: z.array(z.string().uuid()).optional(), // Person object IDs
  }).passthrough(),
})

export type PersonalBit = z.infer<typeof PersonalBitSchema>
```

**AI Enhancements:**
- Sentiment analysis (emotional tone detection)
- Pattern recognition across personal bits
- Privacy-aware suggestions
- Generate personal insights and trends

### 5. Weblink

Saved URLs and bookmarks with metadata.

```typescript
export const WeblinkSchema = BaseObjectSchema.extend({
  type: z.literal('weblink'),
  properties: z.object({
    url: z.string().url(),
    domain: z.string().optional(), // Auto-extracted from URL
    favicon: z.string().url().optional(), // Favicon URL
    thumbnail: z.string().url().optional(), // Preview image
    description: z.string().optional(), // Meta description or custom
    category: z.string().optional(),
    dateAdded: z.date(),
    lastVisited: z.date().optional(),
    readStatus: z.enum(['unread', 'reading', 'read']).default('unread'),
    rating: z.number().min(1).max(5).optional(),
  }).passthrough(),
})

export type Weblink = z.infer<typeof WeblinkSchema>
```

**AI Enhancements:**
- Auto-fetch title, description, and thumbnail
- Extract main content and summarize
- Categorize based on content
- Suggest related weblinks or knowledge bits
- Generate notes from article content

### 6. Person

People in your network - contacts, collaborators, friends, etc.

```typescript
export const PersonSchema = BaseObjectSchema.extend({
  type: z.literal('person'),
  properties: z.object({
    fullName: z.string(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    company: z.string().optional(),
    role: z.string().optional(), // Job title or relationship
    location: z.string().optional(),
    bio: z.string().optional(),
    socialLinks: z.object({
      linkedin: z.string().url().optional(),
      twitter: z.string().url().optional(),
      github: z.string().url().optional(),
      website: z.string().url().optional(),
    }).optional(),
    lastContacted: z.date().optional(),
    meetingFrequency: z.enum(['daily', 'weekly', 'monthly', 'yearly', 'rarely']).optional(),
    relationship: z.enum(['family', 'friend', 'colleague', 'mentor', 'client', 'other']).optional(),
    tags: z.array(z.string()).optional(), // e.g., "expert in AI", "project partner"
  }).passthrough(),
})

export type Person = z.infer<typeof PersonSchema>
```

**AI Enhancements:**
- Extract information from email signatures or LinkedIn
- Suggest when to reach out (relationship maintenance)
- Map connections and mutual connections
- Generate conversation starters based on shared interests
- Track interaction history

### 7. Page

Long-form documents or wiki-style pages.

```typescript
export const PageSchema = BaseObjectSchema.extend({
  type: z.literal('page'),
  properties: z.object({
    category: z.string().optional(),
    template: z.string().optional(), // Template used to create page
    wordCount: z.number().optional(), // Auto-calculated
    readTime: z.number().optional(), // Estimated read time in minutes
    version: z.number().default(1), // Version control
    lastReviewed: z.date().optional(), // When content was last reviewed
    status: z.enum(['draft', 'in-review', 'published', 'archived']).default('draft'),
    tableOfContents: z.array(z.object({
      level: z.number(),
      title: z.string(),
      id: z.string(),
    })).optional(), // Auto-generated from headings
    subpages: z.array(z.string().uuid()).optional(), // Nested page structure
  }).passthrough(),
})

export type Page = z.infer<typeof PageSchema>
```

**AI Enhancements:**
- Generate table of contents from headings
- Summarize long documents
- Suggest structure improvements
- Auto-generate subpages for large topics
- Check for broken links
- Generate citations and references

### 8. Financial Entry

Track personal finances - current wealth, transactions, budgets.

```typescript
export const FinancialEntrySchema = BaseObjectSchema.extend({
  type: z.literal('financial-entry'),
  properties: z.object({
    entryType: z.enum(['snapshot', 'transaction', 'budget', 'goal']),

    // For snapshots (current wealth status)
    totalAssets: z.number().optional(),
    totalLiabilities: z.number().optional(),
    netWorth: z.number().optional(), // Auto-calculated: assets - liabilities

    // For transactions
    amount: z.number().optional(),
    currency: z.string().default('USD'),
    category: z.string().optional(), // e.g., "Food", "Rent", "Income"
    transactionType: z.enum(['income', 'expense', 'transfer']).optional(),
    transactionDate: z.date().optional(),
    account: z.string().optional(), // Bank account name

    // For budgets
    budgetPeriod: z.enum(['weekly', 'monthly', 'yearly']).optional(),
    budgetAmount: z.number().optional(),
    spent: z.number().optional(),
    remaining: z.number().optional(), // Auto-calculated

    // For goals
    targetAmount: z.number().optional(),
    currentAmount: z.number().optional(),
    targetDate: z.date().optional(),

    // Common fields
    date: z.date(), // Date of entry
    notes: z.string().optional(),
    attachments: z.array(z.string()).optional(), // Receipt images, etc.
  }).passthrough(),
})

export type FinancialEntry = z.infer<typeof FinancialEntrySchema>
```

**AI Enhancements:**
- Categorize transactions automatically
- Identify spending patterns and trends
- Suggest budget optimizations
- Forecast future wealth based on trends
- Alert on unusual spending
- Generate financial reports

### 9. Task

Actionable items with deadlines, priorities, and statuses.

```typescript
export const TaskSchema = BaseObjectSchema.extend({
  type: z.literal('task'),
  properties: z.object({
    status: z.enum(['todo', 'in-progress', 'waiting', 'done', 'cancelled']).default('todo'),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    dueDate: z.date().optional(),
    scheduledDate: z.date().optional(), // When you plan to work on it
    completedDate: z.date().optional(),
    estimatedTime: z.number().optional(), // In minutes
    actualTime: z.number().optional(), // In minutes
    project: z.string().uuid().optional(), // Parent project
    parentTask: z.string().uuid().optional(), // For subtasks
    subtasks: z.array(z.string().uuid()).optional(),
    assignee: z.string().uuid().optional(), // Person object ID
    blockedBy: z.array(z.string().uuid()).optional(), // Other task IDs
    recurrence: z.object({
      frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
      interval: z.number().default(1), // Every N days/weeks/months
      endDate: z.date().optional(),
    }).optional(),
  }).passthrough(),
})

export type Task = z.infer<typeof TaskSchema>
```

**AI Enhancements:**
- Break down complex tasks into subtasks
- Estimate time required
- Suggest optimal scheduling based on deadlines
- Identify blockers and dependencies
- Auto-prioritize based on deadlines and importance
- Generate task descriptions from brief input

### 10. Calendar Entry

Events, meetings, and scheduled time blocks.

```typescript
export const CalendarEntrySchema = BaseObjectSchema.extend({
  type: z.literal('calendar-entry'),
  properties: z.object({
    startTime: z.date(),
    endTime: z.date(),
    allDay: z.boolean().default(false),
    location: z.string().optional(),
    locationUrl: z.string().url().optional(), // Google Maps, Zoom link, etc.
    attendees: z.array(z.string().uuid()).optional(), // Person object IDs
    eventType: z.enum(['meeting', 'appointment', 'focus-time', 'break', 'social', 'other']),
    status: z.enum(['confirmed', 'tentative', 'cancelled']).default('confirmed'),
    reminder: z.object({
      enabled: z.boolean().default(false),
      minutesBefore: z.number().default(15),
    }).optional(),
    recurrence: z.object({
      frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
      interval: z.number().default(1),
      endDate: z.date().optional(),
      daysOfWeek: z.array(z.number().min(0).max(6)).optional(), // 0 = Sunday
    }).optional(),
    relatedTasks: z.array(z.string().uuid()).optional(),
    relatedProject: z.string().uuid().optional(),
  }).passthrough(),
})

export type CalendarEntry = z.infer<typeof CalendarEntrySchema>
```

**AI Enhancements:**
- Extract event details from natural language
- Suggest optimal meeting times
- Identify scheduling conflicts
- Auto-add location based on event type
- Generate meeting agendas
- Create tasks from meeting notes

### 11. Habit

Repeating behaviors to track and build.

```typescript
export const HabitSchema = BaseObjectSchema.extend({
  type: z.literal('habit'),
  properties: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly']),
    targetCount: z.number().default(1), // How many times per frequency period
    currentStreak: z.number().default(0), // Days/weeks in a row
    longestStreak: z.number().default(0),
    totalCompletions: z.number().default(0),
    startDate: z.date(),
    endDate: z.date().optional(), // If habit has an end goal
    timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'anytime']).optional(),
    reminderTime: z.string().optional(), // HH:MM format
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    category: z.string().optional(), // e.g., "Health", "Productivity"
    checkIns: z.array(z.object({
      date: z.date(),
      completed: z.boolean(),
      note: z.string().optional(),
    })).optional(),
    archived: z.boolean().default(false),
  }).passthrough(),
})

export type Habit = z.infer<typeof HabitSchema>
```

**AI Enhancements:**
- Suggest habit stacking (pair with existing habits)
- Analyze completion patterns
- Identify optimal times for habit execution
- Generate motivation and tips
- Predict likelihood of success
- Suggest habit modifications for better adherence

---

## Object Relations

Objects can be connected through relations, creating a knowledge graph.

```typescript
export const RelationSchema = z.object({
  id: z.string().uuid(),
  fromObjectId: z.string().uuid(),
  toObjectId: z.string().uuid(),
  relationType: z.enum([
    'contains',        // Project contains tasks
    'references',      // Note references another note
    'related-to',      // Generic relation
    'depends-on',      // Task depends on another task
    'parent-of',       // Parent-child relation
    'tagged-with',     // Object tagged with another object
    'assigned-to',     // Task assigned to person
    'attended-by',     // Event attended by person
    'created-by',      // Created by person
  ]),
  metadata: z.object({
    createdAt: z.date(),
    strength: z.number().min(0).max(1).optional(), // Relation strength (for AI)
    bidirectional: z.boolean().default(false),
  }),
})

export type Relation = z.infer<typeof RelationSchema>
```

### Relation Examples

- **Project → Task**: `contains` relation (project contains multiple tasks)
- **Task → Person**: `assigned-to` relation
- **Knowledge Bit → Knowledge Bit**: `references` relation
- **Daily Note → Task**: `references` relation (mentioned in daily note)
- **Weblink → Knowledge Bit**: `related-to` relation (source of knowledge)
- **Habit → Calendar Entry**: `related-to` relation (habit check-in scheduled)

---

## Custom Objects (Future)

Users can create custom object types with their own schemas.

```typescript
export const CustomObjectTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string(), // e.g., "Recipe", "Book", "Workout"
  icon: z.string().optional(),
  color: z.string().optional(),
  properties: z.array(z.object({
    key: z.string(),
    label: z.string(),
    type: PropertyTypeEnum,
    required: z.boolean().default(false),
    config: z.any().optional(),
  })),
  defaultRelations: z.array(z.string()).optional(), // Default relation types
  template: z.string().optional(), // Template for new objects
})
```

**Examples of Custom Objects:**
- **Recipe**: Ingredients, instructions, cooking time
- **Book**: Author, pages, reading status, notes
- **Workout**: Exercises, duration, calories burned
- **Course**: Lessons, progress, certificates

---

## Database Schema (Drizzle)

```typescript
// packages/database/src/schema/objects.ts
import { pgTable, uuid, text, jsonb, timestamp, boolean } from 'drizzle-orm/pg-core'

export const objects = pgTable('objects', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: text('type').notNull(), // 'project', 'task', etc.
  title: text('title').notNull(),
  content: text('content'), // Rich text JSON (Lexical)
  properties: jsonb('properties').notNull().default({}), // Flexible properties
  metadata: jsonb('metadata').notNull().default({
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [],
    archived: false,
    favorited: false,
  }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  archived: boolean('archived').notNull().default(false),
})

export const relations = pgTable('relations', {
  id: uuid('id').primaryKey().defaultRandom(),
  fromObjectId: uuid('from_object_id').notNull().references(() => objects.id, { onDelete: 'cascade' }),
  toObjectId: uuid('to_object_id').notNull().references(() => objects.id, { onDelete: 'cascade' }),
  relationType: text('relation_type').notNull(),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
```

---

## AI-First Design

### AI-Friendly Object Design

1. **Structured data**: Clear schemas make it easy for AI to understand
2. **Semantic properties**: Property names are descriptive
3. **Flexible content**: AI can generate content that fits the schema
4. **Relations**: AI can suggest and create connections
5. **Metadata**: AI can use tags and metadata for categorization

### AI Operations on Objects

- **Create**: Generate new objects from natural language input
- **Update**: Modify properties based on conversation
- **Relate**: Suggest and create relations between objects
- **Categorize**: Auto-tag and categorize objects
- **Enhance**: Add AI-generated properties (summaries, etc.)
- **Query**: Find objects based on semantic search

---

## Summary

The object system provides:

- **11 default object types** covering knowledge, tasks, people, and personal management
- **Flexible property system** for custom fields
- **Relational graph** for interconnected knowledge
- **AI-first design** for natural language interaction
- **Type-safe schemas** with Zod validation
- **Extensible** for future custom object types

This foundation enables a powerful, AI-driven knowledge management system that adapts to the user's needs.
