import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const objects = sqliteTable(
  'objects',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    type: text('type').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    properties: text('properties', { mode: 'json' }).notNull().default('{}'),
    metadata: text('metadata', { mode: 'json' }).notNull().default('{"tags":[],"archived":false,"favorited":false}'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
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
