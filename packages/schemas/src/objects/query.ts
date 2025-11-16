import { z } from 'zod'
import { BaseObjectSchema } from './base-object'

/**
 * Query Object Schema
 *
 * Queries are saved filters that dynamically return objects matching criteria.
 * They auto-update as objects are created/modified/deleted.
 *
 * Examples:
 * - "Active Projects" - filters for status=active, type=project
 * - "My Tasks This Week" - filters for tasks with due date in current week
 * - "Important Resources" - filters for resources tagged with #important
 *
 * Phase 1: Basic object-type queries only
 * Future: Search queries, tag queries, variable queries (context-aware)
 */
export const QuerySchema = BaseObjectSchema.extend({
  type: z.literal('query'),
  properties: z.object({
    // Query type (Phase 1: only 'object-type')
    queryType: z.enum(['object-type']), // Future: 'search', 'tag', 'variable', 'relation'

    // Filters to apply
    filters: z.object({
      // Filter by object type
      objectType: z.string().optional(), // e.g., 'project', 'task'

      // Filter by property values
      properties: z.record(z.any()).optional(), // e.g., { status: 'active', priority: 'high' }

      // Filter by tags (tag names, not tag object IDs)
      tags: z.array(z.string()).optional(), // e.g., ['important', 'work']

      // Filter by date range
      dateRange: z.object({
        start: z.coerce.date().optional(),
        end: z.coerce.date().optional(),
      }).optional(),

      // Filter by archived status
      archived: z.boolean().optional(),

    }).optional(),

    // Sort order
    sort: z.object({
      field: z.string(),                    // e.g., 'createdAt', 'updatedAt', 'title'
      order: z.enum(['asc', 'desc']),
    }).optional(),

    // Limit results
    limit: z.number().positive().optional(), // Max number of results

    // Group results
    groupBy: z.string().optional(), // e.g., 'properties.status'

  }).passthrough(), // Allow additional custom properties
})

export type Query = z.infer<typeof QuerySchema>
