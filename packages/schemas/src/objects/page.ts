import { z } from 'zod'
import { BaseObjectSchema } from './base-object'

// Enums for common page property values
export const PageStatusEnum = z.enum(['draft', 'in-review', 'published', 'archived'])

// Page uses the flexible property system from BaseObject
// Common properties for pages (documentation/reference):
// - category: text property
// - template: text property (template name to use)
// - wordCount: number property (auto-calculated)
// - readTime: number property (in minutes, auto-calculated)
// - version: number property (version control)
// - lastReviewed: date property
// - status: select property with PageStatusEnum options
// - tableOfContents: file property or long-text (structured JSON)
//
// Relations (use relations table, not properties):
// - subpages: relations to child Page objects (parent_of)
// - parentPage: relation to parent Page object
// - containsResources: relations to Resource objects embedded in the page
// - referencesProjects: relations to Project objects mentioned

export const PageSchema = BaseObjectSchema.extend({
  type: z.literal('page'),
  // Inherits flexible properties from BaseObject
})

export type Page = z.infer<typeof PageSchema>
export type PageStatus = z.infer<typeof PageStatusEnum>
