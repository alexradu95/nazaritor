import { z } from 'zod'

export const PropertyTypeEnum = z.enum([
  'text',
  'long-text',
  'number',
  'date',
  'datetime',
  'select',
  'multi-select',
  'checkbox',
  'url',
  'email',
  'relation',
  'file',
  'ai-generated',
  'currency',
  'rating',
])

export const PropertyConfigSchema = z.object({
  options: z.array(z.string()).optional(),
  allowedTypes: z.array(z.string()).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  maxLength: z.number().optional(),
  prompt: z.string().optional(),
})

export const PropertyValueSchema = z.object({
  type: PropertyTypeEnum,
  value: z.any(),
  config: PropertyConfigSchema.optional(),
})

export type PropertyType = z.infer<typeof PropertyTypeEnum>
export type PropertyConfig = z.infer<typeof PropertyConfigSchema>
export type PropertyValue = z.infer<typeof PropertyValueSchema>
