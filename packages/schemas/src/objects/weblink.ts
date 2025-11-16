import { z } from 'zod'
import { BaseObjectSchema } from './base-object'

// Enums for common weblink property values
export const ReadStatusEnum = z.enum(['unread', 'reading', 'read'])

// Weblink uses the flexible property system from BaseObject
// Common properties for weblinks (documentation/reference):
// - url: url property (required - the actual link)
// - domain: text property (auto-extracted from URL)
// - faviconUrl: url property
// - thumbnailUrl: url property
// - description: long-text property
// - category: select or text property
// - dateAdded: date property
// - lastVisited: date property
// - readStatus: select property with ReadStatusEnum options
// - rating: rating property (1-5 stars)
//
// Relations (use relations table, not properties):
// - referencedBy: relations from Resource objects that cite this link
// - relatedTo: relations to other Weblink objects

export const WeblinkSchema = BaseObjectSchema.extend({
  type: z.literal('weblink'),
  // Inherits flexible properties from BaseObject
})

export type Weblink = z.infer<typeof WeblinkSchema>
export type ReadStatus = z.infer<typeof ReadStatusEnum>
