import { z } from 'zod'
import { BaseObjectSchema } from './base-object'

export const PersonalBitCategoryEnum = z.enum([
  'thought',
  'reflection',
  'dream',
  'goal',
  'memory',
  'idea',
  'feeling',
  'other',
])

export const PrivacyEnum = z.enum(['private', 'shared'])
export const EmotionalToneEnum = z.enum(['positive', 'neutral', 'negative'])

export const PersonalBitPropertiesSchema = z.object({
  category: PersonalBitCategoryEnum.optional(),
  privacy: PrivacyEnum.default('private'),
  emotionalTone: EmotionalToneEnum.optional(),
  dateRecorded: z.coerce.date(),
  relatedPeople: z.array(z.string().uuid()).optional(),
})

export const PersonalBitSchema = BaseObjectSchema.extend({
  type: z.literal('personal-bit'),
  properties: PersonalBitPropertiesSchema,
})

export type PersonalBit = z.infer<typeof PersonalBitSchema>
export type PersonalBitCategory = z.infer<typeof PersonalBitCategoryEnum>
export type Privacy = z.infer<typeof PrivacyEnum>
export type EmotionalTone = z.infer<typeof EmotionalToneEnum>
