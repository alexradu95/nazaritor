import { z } from 'zod'
import { BaseObjectSchema } from './base-object'

// Enums for common project property values
export const ProjectStatusEnum = z.enum([
  'planning',
  'active',
  'on-hold',
  'completed',
  'cancelled',
])

export const PriorityEnum = z.enum(['low', 'medium', 'high', 'urgent'])

// Project uses the flexible property system from BaseObject
// Common properties for projects (documentation/reference):
// - status: select property with ProjectStatusEnum options
// - priority: select property with PriorityEnum options
// - startDate: date property
// - dueDate: date property
// - completedDate: date property
// - progress: number property (0-100)
// - objectives: multi-select or long-text
// - budget: currency property

export const ProjectSchema = BaseObjectSchema.extend({
  type: z.literal('project'),
  // Inherits flexible properties from BaseObject
})

export type Project = z.infer<typeof ProjectSchema>
export type ProjectStatus = z.infer<typeof ProjectStatusEnum>
export type Priority = z.infer<typeof PriorityEnum>
