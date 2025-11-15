import { z } from 'zod'
import { BaseObjectSchema } from './base-object'
import { RecurrenceSchema } from './task'

export const EventTypeEnum = z.enum([
  'meeting',
  'appointment',
  'focus-time',
  'break',
  'social',
  'other',
])

export const EventStatusEnum = z.enum(['confirmed', 'tentative', 'cancelled'])

export const ReminderSchema = z.object({
  enabled: z.boolean().default(false),
  minutesBefore: z.number().default(15),
})

export const CalendarRecurrenceSchema = RecurrenceSchema.extend({
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
})

export const CalendarEntryPropertiesSchema = z.object({
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  allDay: z.boolean().default(false),
  location: z.string().optional(),
  locationUrl: z.string().url().optional(),
  attendees: z.array(z.string().uuid()).optional(),
  eventType: EventTypeEnum,
  status: EventStatusEnum.default('confirmed'),
  reminder: ReminderSchema.optional(),
  recurrence: CalendarRecurrenceSchema.optional(),
  relatedTasks: z.array(z.string().uuid()).optional(),
  relatedProject: z.string().uuid().optional(),
})

export const CalendarEntrySchema = BaseObjectSchema.extend({
  type: z.literal('calendar-entry'),
  properties: CalendarEntryPropertiesSchema,
})

export type CalendarEntry = z.infer<typeof CalendarEntrySchema>
export type EventType = z.infer<typeof EventTypeEnum>
export type EventStatus = z.infer<typeof EventStatusEnum>
export type Reminder = z.infer<typeof ReminderSchema>
export type CalendarRecurrence = z.infer<typeof CalendarRecurrenceSchema>
