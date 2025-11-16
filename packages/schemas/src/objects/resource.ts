import { z } from 'zod'
import { BaseObjectSchema } from './base-object'

export const ResourceTypeEnum = z.enum([
  'article',
  'note',
  'snippet',
  'quote',
  'reference',
  'thought',
  'idea',
  'other',
])

export const ResourcePropertiesSchema = z.object({
  // From Knowledge Bit
  category: z.string().optional(),
  source: z.string().optional(),
  sourceUrl: z.string().url().optional(),

  // From Personal Bit
  resourceType: ResourceTypeEnum.optional(),

  // Common
  dateAdded: z.coerce.date(),
  relatedResources: z.array(z.string().uuid()).optional(),
  relatedPeople: z.array(z.string().uuid()).optional(),
  keywords: z.array(z.string()).optional(),
})

export const ResourceSchema = BaseObjectSchema.extend({
  type: z.literal('resource'),
  properties: ResourcePropertiesSchema,
})

export type Resource = z.infer<typeof ResourceSchema>
export type ResourceType = z.infer<typeof ResourceTypeEnum>
