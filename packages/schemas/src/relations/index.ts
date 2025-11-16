import { z } from 'zod'

// Relation types - MUST match database constraint in 0000_initial_schema.sql
// Using snake_case to align with database convention
export const RelationTypeEnum = z.enum([
  'parent_of',
  'child_of',
  'blocks',
  'blocked_by',
  'relates_to',
  'assigned_to',
  'member_of',   // Used for collections - object is member of collection
  'references',
  'contains',
  'attends',
  'knows',
  'created_on',  // Object was created on this day (links to daily-note)
  'tagged_with', // Object is tagged with a tag object
])

// Common metadata schemas for relations (optional, validation at app level)
export const RelationMetadataSchema = z.object({
  strength: z.number().min(0).max(1).optional(),
  bidirectional: z.boolean().optional(),
  notes: z.string().optional(),
}).passthrough() // Allow additional fields

export const RelationSchema = z.object({
  id: z.string().uuid(),
  fromObjectId: z.string().uuid(),
  toObjectId: z.string().uuid(),
  relationType: RelationTypeEnum,
  metadata: z.record(z.unknown()).default({}), // Match database - any valid JSON
  createdAt: z.coerce.date(),
})

export type RelationType = z.infer<typeof RelationTypeEnum>
export type Relation = z.infer<typeof RelationSchema>
export type RelationMetadata = z.infer<typeof RelationMetadataSchema>
