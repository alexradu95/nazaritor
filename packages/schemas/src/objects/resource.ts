import { z } from 'zod'
import { BaseObjectSchema } from './base-object'

// Enums for common resource property values
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

export const ConfidenceEnum = z.enum(['low', 'medium', 'high'])
export const PrivacyEnum = z.enum(['private', 'shared'])

// Resource uses the flexible property system from BaseObject
// Common properties for resources (documentation/reference):
// - resourceType: select property with ResourceTypeEnum options
// - category: text property
// - source: text property
// - sourceUrl: url property
// - confidence: select property with ConfidenceEnum options
// - privacy: select property with PrivacyEnum options (default: 'shared')
// - dateAdded: date property
// - keywords: multi-select or text array
//
// Relations (use relations table, not properties):
// - relatedResources: relations to other Resource objects
// - relatedPeople: relations to Person objects
// - references: relations to Weblink objects

export const ResourceSchema = BaseObjectSchema.extend({
  type: z.literal('resource'),
  // Inherits flexible properties from BaseObject
})

export type Resource = z.infer<typeof ResourceSchema>
export type ResourceType = z.infer<typeof ResourceTypeEnum>
export type Confidence = z.infer<typeof ConfidenceEnum>
export type Privacy = z.infer<typeof PrivacyEnum>
