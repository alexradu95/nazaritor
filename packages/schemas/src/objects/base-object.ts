import { z } from 'zod'
import { PropertyValueSchema } from '../properties'
import { RelationSchema } from '../relations'

export const ObjectTypeEnum = z.enum([
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
  'custom',
])

export const MetadataSchema = z.object({
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  createdBy: z.string().uuid().optional(),
  tags: z.array(z.string()),
  archived: z.boolean().default(false),
  favorited: z.boolean().default(false),
})

export const BaseObjectSchema = z.object({
  id: z.string().uuid(),
  type: ObjectTypeEnum,
  title: z.string().min(1).max(500),
  content: z.string().optional(),
  properties: z.record(z.string(), PropertyValueSchema),
  relations: z.array(RelationSchema),
  metadata: MetadataSchema,
})

export type BaseObject = z.infer<typeof BaseObjectSchema>
export type ObjectType = z.infer<typeof ObjectTypeEnum>
export type Metadata = z.infer<typeof MetadataSchema>
