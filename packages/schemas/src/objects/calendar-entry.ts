import { z } from 'zod'
import { BaseObjectSchema } from './base-object'

// Enums for common calendar entry property values
export const EventTypeEnum = z.enum([
  'meeting',
  'appointment',
  'focus-time',
  'break',
  'social',
  'other',
])

export const EventStatusEnum = z.enum(['confirmed', 'tentative', 'cancelled'])

// CalendarEntry uses the flexible property system from BaseObject
// Common properties for calendar entries (documentation/reference):
// - eventType: select property with EventTypeEnum options
// - status: select property with EventStatusEnum options
// - startTime: datetime property
// - endTime: datetime property
// - location: text or url property
// - isAllDay: checkbox property
// - reminderEnabled: checkbox property
// - reminderMinutes: number property
// - recurrenceFrequency: select property (daily, weekly, monthly, yearly)
// - recurrenceInterval: number property
// - recurrenceEndDate: date property
// - meetingUrl: url property (for virtual meetings)
//
// Relations (use relations table, not properties):
// - attendees: relations to Person objects
// - relatedProject: relation to Project object
// - relatedTasks: relations to Task objects

export const CalendarEntrySchema = BaseObjectSchema.extend({
  type: z.literal('calendar-entry'),
  // Inherits flexible properties from BaseObject
})

export type CalendarEntry = z.infer<typeof CalendarEntrySchema>
export type EventType = z.infer<typeof EventTypeEnum>
export type EventStatus = z.infer<typeof EventStatusEnum>
