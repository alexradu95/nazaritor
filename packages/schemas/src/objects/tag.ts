import { z } from 'zod'
import { BaseObjectSchema } from './base-object'

/**
 * Tag Object Schema
 *
 * Tags are used for categorization across different object types.
 * Unlike collections (which group within a type), tags group across types.
 *
 * Examples:
 * - #important tag on tasks, projects, resources
 * - #work tag across multiple object types
 * - #programming tag for resources, projects, people
 *
 * Tags are objects themselves, allowing rich metadata like color, icon, description.
 * Objects link to tags via 'tagged_with' relations.
 */
export const TagSchema = BaseObjectSchema.extend({
  type: z.literal('tag'),
  properties: z.object({
    // Visual customization
    color: z.string().optional(), // Hex color for UI (e.g., "#FF5733")
    icon: z.string().optional(),  // Icon name or emoji (e.g., "⭐", "star")

    // Tag metadata
    description: z.string().optional(), // What this tag represents
    category: z.string().optional(),    // Group tags by category (e.g., "Status", "Priority")

  }).passthrough(), // Allow additional custom properties
})

export type Tag = z.infer<typeof TagSchema>
