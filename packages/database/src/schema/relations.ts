import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { objects } from './objects'

export const relations = sqliteTable(
  'relations',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    fromObjectId: text('from_object_id')
      .notNull()
      .references(() => objects.id, { onDelete: 'cascade' }),
    toObjectId: text('to_object_id')
      .notNull()
      .references(() => objects.id, { onDelete: 'cascade' }),
    relationType: text('relation_type').notNull(),
    metadata: text('metadata', { mode: 'json' }).notNull().default('{}'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  },
  (table) => {
    return {
      fromObjectIdIdx: index('from_object_id_idx').on(table.fromObjectId),
      toObjectIdIdx: index('to_object_id_idx').on(table.toObjectId),
      relationTypeIdx: index('relation_type_idx').on(table.relationType),
    }
  }
)

export type Relation = typeof relations.$inferSelect
export type NewRelation = typeof relations.$inferInsert
