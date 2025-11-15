import { z } from 'zod'
import { BaseObjectSchema } from './base-object'

export const MeetingFrequencyEnum = z.enum(['daily', 'weekly', 'monthly', 'yearly', 'rarely'])

export const RelationshipEnum = z.enum([
  'family',
  'friend',
  'colleague',
  'mentor',
  'client',
  'other',
])

export const SocialLinksSchema = z.object({
  linkedin: z.string().url().optional(),
  twitter: z.string().url().optional(),
  github: z.string().url().optional(),
  website: z.string().url().optional(),
})

export const PersonPropertiesSchema = z.object({
  fullName: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  role: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
  socialLinks: SocialLinksSchema.optional(),
  lastContacted: z.coerce.date().optional(),
  meetingFrequency: MeetingFrequencyEnum.optional(),
  relationship: RelationshipEnum.optional(),
  tags: z.array(z.string()).optional(),
})

export const PersonSchema = BaseObjectSchema.extend({
  type: z.literal('person'),
  properties: PersonPropertiesSchema,
})

export type Person = z.infer<typeof PersonSchema>
export type MeetingFrequency = z.infer<typeof MeetingFrequencyEnum>
export type Relationship = z.infer<typeof RelationshipEnum>
export type SocialLinks = z.infer<typeof SocialLinksSchema>
