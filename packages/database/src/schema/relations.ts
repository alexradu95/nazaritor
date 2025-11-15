import { pgTable, uuid, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core'
import { objects } from './objects'

export const relations = pgTable(
  'relations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fromObjectId: uuid('from_object_id')
      .notNull()
      .references(() => objects.id, { onDelete: 'cascade' }),
    toObjectId: uuid('to_object_id')
      .notNull()
      .references(() => objects.id, { onDelete: 'cascade' }),
    relationType: text('relation_type').notNull(),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
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
