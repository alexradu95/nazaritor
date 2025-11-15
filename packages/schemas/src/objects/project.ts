import { z } from 'zod'
import { BaseObjectSchema } from './base-object'

export const ProjectStatusEnum = z.enum([
  'planning',
  'active',
  'on-hold',
  'completed',
  'cancelled',
])

export const PriorityEnum = z.enum(['low', 'medium', 'high', 'urgent'])

export const ProjectPropertiesSchema = z.object({
  status: ProjectStatusEnum,
  priority: PriorityEnum.optional(),
  startDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  completedDate: z.coerce.date().optional(),
  progress: z.number().min(0).max(100).default(0),
  objectives: z.array(z.string()).optional(),
  budget: z.number().optional(),
  members: z.array(z.string().uuid()).optional(),
  relatedTasks: z.array(z.string().uuid()).optional(),
})

export const ProjectSchema = BaseObjectSchema.extend({
  type: z.literal('project'),
  properties: ProjectPropertiesSchema,
})

export type Project = z.infer<typeof ProjectSchema>
export type ProjectStatus = z.infer<typeof ProjectStatusEnum>
export type Priority = z.infer<typeof PriorityEnum>
