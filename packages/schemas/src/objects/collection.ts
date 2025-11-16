import { z } from 'zod'
import { BaseObjectSchema } from './base-object'

/**
 * Collection Object Schema
 *
 * Collections are sub-groups within a single object type.
 * Unlike tags (which group across types), collections group within a type.
 *
 * Examples:
 * - "Work Projects" collection (groups project objects)
 * - "Daily Meetings" collection (groups calendar-entry objects)
 * - "Reading List" collection (groups weblink objects)
 *
 * Collections can have default filters and views.
 * Objects join collections via 'member_of' relations (supports multiple collections).
 */
export const CollectionSchema = BaseObjectSchema.extend({
  type: z.literal('collection'),
  properties: z.object({
    // Which object type this collection groups
    objectType: z.string(), // e.g., 'project', 'task', 'weblink'

    // Visual customization
    icon: z.string().optional(),
    color: z.string().optional(),

    // Collection metadata
    description: z.string().optional(),

    // Default filters for this collection (optional)
    defaultFilters: z.object({
      properties: z.record(z.any()).optional(), // Filter by property values
      tags: z.array(z.string()).optional(),      // Filter by tags
    }).optional(),

    // Default sort for collection view
    defaultSort: z.object({
      field: z.string(),
      order: z.enum(['asc', 'desc']),
    }).optional(),

  }).passthrough(), // Allow additional custom properties
})

export type Collection = z.infer<typeof CollectionSchema>
