import { z } from 'zod'
import { BaseObjectSchema } from './base-object'
import { PriorityEnum } from './project'

export const TaskStatusEnum = z.enum(['todo', 'in-progress', 'waiting', 'done', 'cancelled'])

export const RecurrenceSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  interval: z.number().default(1),
  endDate: z.coerce.date().optional(),
})

export const TaskPropertiesSchema = z.object({
  status: TaskStatusEnum.default('todo'),
  priority: PriorityEnum.default('medium'),
  dueDate: z.coerce.date().optional(),
  scheduledDate: z.coerce.date().optional(),
  completedDate: z.coerce.date().optional(),
  estimatedTime: z.number().optional(),
  actualTime: z.number().optional(),
  project: z.string().uuid().optional(),
  parentTask: z.string().uuid().optional(),
  subtasks: z.array(z.string().uuid()).optional(),
  assignee: z.string().uuid().optional(),
  blockedBy: z.array(z.string().uuid()).optional(),
  recurrence: RecurrenceSchema.optional(),
})

export const TaskSchema = BaseObjectSchema.extend({
  type: z.literal('task'),
  properties: TaskPropertiesSchema,
})

export type Task = z.infer<typeof TaskSchema>
export type TaskStatus = z.infer<typeof TaskStatusEnum>
export type Recurrence = z.infer<typeof RecurrenceSchema>
