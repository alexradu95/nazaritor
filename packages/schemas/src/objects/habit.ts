import { z } from 'zod'
import { BaseObjectSchema } from './base-object'

export const HabitFrequencyEnum = z.enum(['daily', 'weekly', 'monthly'])

export const TimeOfDayEnum = z.enum(['morning', 'afternoon', 'evening', 'anytime'])

export const DifficultyEnum = z.enum(['easy', 'medium', 'hard'])

export const CheckInSchema = z.object({
  date: z.coerce.date(),
  completed: z.boolean(),
  note: z.string().optional(),
})

export const HabitPropertiesSchema = z.object({
  frequency: HabitFrequencyEnum,
  targetCount: z.number().default(1),
  currentStreak: z.number().default(0),
  longestStreak: z.number().default(0),
  totalCompletions: z.number().default(0),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  timeOfDay: TimeOfDayEnum.optional(),
  reminderTime: z.string().optional(),
  difficulty: DifficultyEnum.optional(),
  category: z.string().optional(),
  checkIns: z.array(CheckInSchema).optional(),
  archived: z.boolean().default(false),
})

export const HabitSchema = BaseObjectSchema.extend({
  type: z.literal('habit'),
  properties: HabitPropertiesSchema,
})

export type Habit = z.infer<typeof HabitSchema>
export type HabitFrequency = z.infer<typeof HabitFrequencyEnum>
export type TimeOfDay = z.infer<typeof TimeOfDayEnum>
export type Difficulty = z.infer<typeof DifficultyEnum>
export type CheckIn = z.infer<typeof CheckInSchema>
