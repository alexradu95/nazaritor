import { z } from 'zod'
import { PropertyValueSchema } from '../properties'
import { RelationSchema } from '../relations'

export const ObjectTypeEnum = z.enum([
  'project',
  'daily-note',
  'resource',
  'weblink',
  'person',
  'page',
  'task',
  'calendar-entry',
  'custom',
  'tag',        // Tags for categorization across object types
  'collection', // Collections for grouping within object types
  'query',      // Saved queries for dynamic filtering
])

export const MetadataSchema = z.object({
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  createdBy: z.string().uuid().optional(),
  tags: z.array(z.string()),
  favorited: z.boolean().default(false),
})

export const BaseObjectSchema = z.object({
  id: z.string().uuid(),
  type: ObjectTypeEnum,
  title: z.string().min(1).max(500),
  content: z.string().optional(),
  properties: z.record(z.string(), PropertyValueSchema),
  metadata: MetadataSchema,
  archived: z.boolean().default(false), // Top-level for convenience and indexing
})

// Extended schema for when relations are loaded
export const ObjectWithRelationsSchema = BaseObjectSchema.extend({
  relations: z.array(RelationSchema),
})

export type BaseObject = z.infer<typeof BaseObjectSchema>
export type ObjectWithRelations = z.infer<typeof ObjectWithRelationsSchema>
export type ObjectType = z.infer<typeof ObjectTypeEnum>
export type Metadata = z.infer<typeof MetadataSchema>
