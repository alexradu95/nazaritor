import { z } from 'zod'
import { BaseObjectSchema } from './base-object'

export const ConfidenceEnum = z.enum(['low', 'medium', 'high'])

export const KnowledgeBitPropertiesSchema = z.object({
  category: z.string().optional(),
  source: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  dateAdded: z.coerce.date(),
  confidence: ConfidenceEnum.optional(),
  relatedBits: z.array(z.string().uuid()).optional(),
  references: z.array(z.string().uuid()).optional(),
})

export const KnowledgeBitSchema = BaseObjectSchema.extend({
  type: z.literal('knowledge-bit'),
  properties: KnowledgeBitPropertiesSchema,
})

export type KnowledgeBit = z.infer<typeof KnowledgeBitSchema>
export type Confidence = z.infer<typeof ConfidenceEnum>
