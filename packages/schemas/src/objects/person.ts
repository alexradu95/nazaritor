import { z } from 'zod'
import { BaseObjectSchema } from './base-object'

// Enums for common person property values
export const MeetingFrequencyEnum = z.enum(['daily', 'weekly', 'monthly', 'yearly', 'rarely'])

export const RelationshipEnum = z.enum([
  'family',
  'friend',
  'colleague',
  'mentor',
  'client',
  'other',
])

// Person uses the flexible property system from BaseObject
// Common properties for persons (documentation/reference):
// - fullName: text property
// - email: email property
// - phone: text property
// - company: text property
// - role: text property (job title, role in life, etc.)
// - location: text property
// - bio: long-text property
// - linkedinUrl: url property
// - twitterUrl: url property
// - githubUrl: url property
// - websiteUrl: url property
// - lastContacted: date property
// - meetingFrequency: select property with MeetingFrequencyEnum options
// - relationship: select property with RelationshipEnum options
//
// Relations (use relations table, not properties):
// - memberOf: relations to Project objects
// - assignedTasks: relations to Task objects
// - attendsEvents: relations to CalendarEntry objects
// - knows: relations to other Person objects

export const PersonSchema = BaseObjectSchema.extend({
  type: z.literal('person'),
  // Inherits flexible properties from BaseObject
})

export type Person = z.infer<typeof PersonSchema>
export type MeetingFrequency = z.infer<typeof MeetingFrequencyEnum>
export type Relationship = z.infer<typeof RelationshipEnum>
