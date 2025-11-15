import { z } from 'zod'
import { BaseObjectSchema } from './base-object'

export const ReadStatusEnum = z.enum(['unread', 'reading', 'read'])

export const WeblinkPropertiesSchema = z.object({
  url: z.string().url(),
  domain: z.string().optional(),
  favicon: z.string().url().optional(),
  thumbnail: z.string().url().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  dateAdded: z.coerce.date(),
  lastVisited: z.coerce.date().optional(),
  readStatus: ReadStatusEnum.default('unread'),
  rating: z.number().min(1).max(5).optional(),
})

export const WeblinkSchema = BaseObjectSchema.extend({
  type: z.literal('weblink'),
  properties: WeblinkPropertiesSchema,
})

export type Weblink = z.infer<typeof WeblinkSchema>
export type ReadStatus = z.infer<typeof ReadStatusEnum>
