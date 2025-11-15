import { z } from 'zod'
import { BaseObjectSchema } from './base-object'

export const PageStatusEnum = z.enum(['draft', 'in-review', 'published', 'archived'])

export const TableOfContentsItemSchema = z.object({
  level: z.number(),
  title: z.string(),
  id: z.string(),
})

export const PagePropertiesSchema = z.object({
  category: z.string().optional(),
  template: z.string().optional(),
  wordCount: z.number().optional(),
  readTime: z.number().optional(),
  version: z.number().default(1),
  lastReviewed: z.coerce.date().optional(),
  status: PageStatusEnum.default('draft'),
  tableOfContents: z.array(TableOfContentsItemSchema).optional(),
  subpages: z.array(z.string().uuid()).optional(),
})

export const PageSchema = BaseObjectSchema.extend({
  type: z.literal('page'),
  properties: PagePropertiesSchema,
})

export type Page = z.infer<typeof PageSchema>
export type PageStatus = z.infer<typeof PageStatusEnum>
export type TableOfContentsItem = z.infer<typeof TableOfContentsItemSchema>
