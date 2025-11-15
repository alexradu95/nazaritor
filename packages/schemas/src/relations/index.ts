import { z } from 'zod'

export const RelationTypeEnum = z.enum([
  'contains',
  'references',
  'related-to',
  'depends-on',
  'parent-of',
  'tagged-with',
  'assigned-to',
  'attended-by',
  'created-by',
])

export const RelationSchema = z.object({
  id: z.string().uuid(),
  fromObjectId: z.string().uuid(),
  toObjectId: z.string().uuid(),
  relationType: RelationTypeEnum,
  metadata: z.object({
    createdAt: z.coerce.date(),
    strength: z.number().min(0).max(1).optional(),
    bidirectional: z.boolean().default(false),
  }),
})

export type RelationType = z.infer<typeof RelationTypeEnum>
export type Relation = z.infer<typeof RelationSchema>
