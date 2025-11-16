import { z } from 'zod'
import { BaseObjectSchema } from './base-object'

// Enums for common daily note property values
export const MoodEnum = z.enum(['great', 'good', 'neutral', 'bad', 'terrible'])

// DailyNote uses the flexible property system from BaseObject
// Common properties for daily notes (documentation/reference):
// - date: date property (the day this note is for)
// - mood: select property with MoodEnum options
// - weather: text property
// - highlights: multi-select or long-text property
// - gratitude: multi-select or long-text property
// - learnings: multi-select or long-text property
// - wordCount: number property (auto-calculated from content)
//
// Relations (use relations table, not properties):
// - todos: relations to Task objects referenced in this note
// - references: relations to other objects mentioned

export const DailyNoteSchema = BaseObjectSchema.extend({
  type: z.literal('daily-note'),
  // Inherits flexible properties from BaseObject
})

export type DailyNote = z.infer<typeof DailyNoteSchema>
export type Mood = z.infer<typeof MoodEnum>
