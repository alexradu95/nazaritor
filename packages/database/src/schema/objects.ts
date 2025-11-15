import { pgTable, uuid, text, jsonb, timestamp, boolean, index } from 'drizzle-orm/pg-core'

export const objects = pgTable(
  'objects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: text('type').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    properties: jsonb('properties').notNull().default({}),
    metadata: jsonb('metadata').notNull().default({
      tags: [],
      archived: false,
      favorited: false,
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    archived: boolean('archived').notNull().default(false),
  },
  (table) => {
    return {
      typeIdx: index('type_idx').on(table.type),
      createdAtIdx: index('created_at_idx').on(table.createdAt),
      updatedAtIdx: index('updated_at_idx').on(table.updatedAt),
      archivedIdx: index('archived_idx').on(table.archived),
    }
  }
)

export type Object = typeof objects.$inferSelect
export type NewObject = typeof objects.$inferInsert
