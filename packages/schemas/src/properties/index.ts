import { z } from 'zod'

// Property type enum (kept for reference)
// Note: 'relation' is NOT a property type - use the relations table instead
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
  'file',
  'ai-generated',
  'currency',
  'rating',
])

export type PropertyType = z.infer<typeof PropertyTypeEnum>

// Type-safe property schemas with discriminated unions

export const TextPropertySchema = z.object({
  type: z.literal('text'),
  value: z.string(),
  config: z
    .object({
      maxLength: z.number().positive().optional(),
      placeholder: z.string().optional(),
    })
    .optional(),
})

export const LongTextPropertySchema = z.object({
  type: z.literal('long-text'),
  value: z.string(),
  config: z
    .object({
      maxLength: z.number().positive().optional(),
      placeholder: z.string().optional(),
    })
    .optional(),
})

export const NumberPropertySchema = z.object({
  type: z.literal('number'),
  value: z.number(),
  config: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      step: z.number().positive().optional(),
      unit: z.string().optional(),
    })
    .optional(),
})

export const DatePropertySchema = z.object({
  type: z.literal('date'),
  value: z.coerce.date(),
  config: z
    .object({
      minDate: z.coerce.date().optional(),
      maxDate: z.coerce.date().optional(),
    })
    .optional(),
})

export const DateTimePropertySchema = z.object({
  type: z.literal('datetime'),
  value: z.coerce.date(),
  config: z
    .object({
      minDate: z.coerce.date().optional(),
      maxDate: z.coerce.date().optional(),
      timezone: z.string().optional(),
    })
    .optional(),
})

export const SelectPropertySchema = z.object({
  type: z.literal('select'),
  value: z.string(),
  config: z.object({
    options: z.array(z.string()).min(1), // Required for select
  }),
})

export const MultiSelectPropertySchema = z.object({
  type: z.literal('multi-select'),
  value: z.array(z.string()),
  config: z.object({
    options: z.array(z.string()).min(1), // Required for multi-select
  }),
})

export const CheckboxPropertySchema = z.object({
  type: z.literal('checkbox'),
  value: z.boolean(),
  config: z
    .object({
      label: z.string().optional(),
    })
    .optional(),
})

export const UrlPropertySchema = z.object({
  type: z.literal('url'),
  value: z.string().url(),
  config: z
    .object({
      openInNewTab: z.boolean().optional(),
    })
    .optional(),
})

export const EmailPropertySchema = z.object({
  type: z.literal('email'),
  value: z.string().email(),
  config: z.object({}).optional(),
})


export const FilePropertySchema = z.object({
  type: z.literal('file'),
  value: z.object({
    url: z.string().url(),
    name: z.string(),
    size: z.number().positive(),
    mimeType: z.string(),
  }),
  config: z
    .object({
      maxSize: z.number().positive().optional(), // in bytes
      allowedTypes: z.array(z.string()).optional(), // MIME types
    })
    .optional(),
})

export const AiGeneratedPropertySchema = z.object({
  type: z.literal('ai-generated'),
  value: z.string(),
  config: z
    .object({
      prompt: z.string(),
      model: z.string().optional(),
      generatedAt: z.coerce.date().optional(),
    })
    .optional(),
})

export const CurrencyPropertySchema = z.object({
  type: z.literal('currency'),
  value: z.number(),
  config: z
    .object({
      currency: z.string().default('USD'), // ISO 4217 currency code
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
})

export const RatingPropertySchema = z.object({
  type: z.literal('rating'),
  value: z.number().int().min(0),
  config: z
    .object({
      maxRating: z.number().int().positive().default(5),
      allowHalf: z.boolean().default(false),
    })
    .optional(),
})

// Discriminated union of all property types
// Note: Relations are NOT included - use the relations table
export const PropertyValueSchema = z.discriminatedUnion('type', [
  TextPropertySchema,
  LongTextPropertySchema,
  NumberPropertySchema,
  DatePropertySchema,
  DateTimePropertySchema,
  SelectPropertySchema,
  MultiSelectPropertySchema,
  CheckboxPropertySchema,
  UrlPropertySchema,
  EmailPropertySchema,
  FilePropertySchema,
  AiGeneratedPropertySchema,
  CurrencyPropertySchema,
  RatingPropertySchema,
])

// Type exports
export type PropertyValue = z.infer<typeof PropertyValueSchema>
export type TextProperty = z.infer<typeof TextPropertySchema>
export type LongTextProperty = z.infer<typeof LongTextPropertySchema>
export type NumberProperty = z.infer<typeof NumberPropertySchema>
export type DateProperty = z.infer<typeof DatePropertySchema>
export type DateTimeProperty = z.infer<typeof DateTimePropertySchema>
export type SelectProperty = z.infer<typeof SelectPropertySchema>
export type MultiSelectProperty = z.infer<typeof MultiSelectPropertySchema>
export type CheckboxProperty = z.infer<typeof CheckboxPropertySchema>
export type UrlProperty = z.infer<typeof UrlPropertySchema>
export type EmailProperty = z.infer<typeof EmailPropertySchema>
export type FileProperty = z.infer<typeof FilePropertySchema>
export type AiGeneratedProperty = z.infer<typeof AiGeneratedPropertySchema>
export type CurrencyProperty = z.infer<typeof CurrencyPropertySchema>
export type RatingProperty = z.infer<typeof RatingPropertySchema>
