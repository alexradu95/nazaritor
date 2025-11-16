import { z } from 'zod'
import { BaseObjectSchema } from './base-object'
import { PriorityEnum } from './project'

// Enums for common task property values
export const TaskStatusEnum = z.enum(['todo', 'in-progress', 'waiting', 'done', 'cancelled'])

// Task uses the flexible property system from BaseObject
// Common properties for tasks (documentation/reference):
// - status: select property with TaskStatusEnum options
// - priority: select property with PriorityEnum options
// - dueDate: date property
// - scheduledDate: date property
// - completedDate: date property
// - estimatedTime: number property (in hours/minutes)
// - actualTime: number property (in hours/minutes)
// - recurrenceFrequency: select property (daily, weekly, monthly, yearly)
// - recurrenceInterval: number property
// - recurrenceEndDate: date property
//
// Relations (use relations table, not properties):
// - project: relation to Project object
// - parentTask: relation to parent Task
// - subtasks: relations to child Tasks
// - assignee: relation to Person object
// - blockedBy: relations to blocking Tasks

export const TaskSchema = BaseObjectSchema.extend({
  type: z.literal('task'),
  // Inherits flexible properties from BaseObject
})

export type Task = z.infer<typeof TaskSchema>
export type TaskStatus = z.infer<typeof TaskStatusEnum>
export type Priority = z.infer<typeof PriorityEnum>
