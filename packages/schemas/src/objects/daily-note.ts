import { z } from 'zod'
import { BaseObjectSchema } from './base-object'

export const MoodEnum = z.enum(['great', 'good', 'neutral', 'bad', 'terrible'])

export const DailyNotePropertiesSchema = z.object({
  date: z.coerce.date(),
  mood: MoodEnum.optional(),
  weather: z.string().optional(),
  highlights: z.array(z.string()).optional(),
  gratitude: z.array(z.string()).optional(),
  learnings: z.array(z.string()).optional(),
  todos: z.array(z.string().uuid()).optional(),
  wordCount: z.number().optional(),
})

export const DailyNoteSchema = BaseObjectSchema.extend({
  type: z.literal('daily-note'),
  properties: DailyNotePropertiesSchema,
})

export type DailyNote = z.infer<typeof DailyNoteSchema>
export type Mood = z.infer<typeof MoodEnum>
