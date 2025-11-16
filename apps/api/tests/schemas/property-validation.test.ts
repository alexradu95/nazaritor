import { describe, test, expect } from 'bun:test'
import {
  PropertyValueSchema,
  TextPropertySchema,
  NumberPropertySchema,
  SelectPropertySchema,
  MultiSelectPropertySchema,
  DatePropertySchema,
  CurrencyPropertySchema,
  RatingPropertySchema,
  EmailPropertySchema,
  UrlPropertySchema,
  CheckboxPropertySchema,
} from '@repo/schemas'

describe('Property Validation - Edge Cases', () => {
  describe('TextProperty', () => {
    test('should accept valid text property', () => {
      const result = TextPropertySchema.safeParse({
        type: 'text',
        value: 'Hello World',
      })
      expect(result.success).toBe(true)
    })

    test('should accept empty string', () => {
      const result = TextPropertySchema.safeParse({
        type: 'text',
        value: '',
      })
      expect(result.success).toBe(true)
    })

    test('should accept unicode characters', () => {
      const result = TextPropertySchema.safeParse({
        type: 'text',
        value: '你好世界 🌍 émojis',
      })
      expect(result.success).toBe(true)
    })

    test('should reject number as value', () => {
      const result = TextPropertySchema.safeParse({
        type: 'text',
        value: 123,
      })
      expect(result.success).toBe(false)
    })

    test('should accept maxLength config', () => {
      const result = TextPropertySchema.safeParse({
        type: 'text',
        value: 'short',
        config: { maxLength: 100 },
      })
      expect(result.success).toBe(true)
    })

    test('should reject negative maxLength', () => {
      const result = TextPropertySchema.safeParse({
        type: 'text',
        value: 'test',
        config: { maxLength: -1 },
      })
      expect(result.success).toBe(false)
    })
  })

  describe('NumberProperty', () => {
    test('should accept integers', () => {
      const result = NumberPropertySchema.safeParse({
        type: 'number',
        value: 42,
      })
      expect(result.success).toBe(true)
    })

    test('should accept floats', () => {
      const result = NumberPropertySchema.safeParse({
        type: 'number',
        value: 3.14159,
      })
      expect(result.success).toBe(true)
    })

    test('should accept negative numbers', () => {
      const result = NumberPropertySchema.safeParse({
        type: 'number',
        value: -100,
      })
      expect(result.success).toBe(true)
    })

    test('should accept zero', () => {
      const result = NumberPropertySchema.safeParse({
        type: 'number',
        value: 0,
      })
      expect(result.success).toBe(true)
    })

    test('should reject string as value', () => {
      const result = NumberPropertySchema.safeParse({
        type: 'number',
        value: '42',
      })
      expect(result.success).toBe(false)
    })

    test('should accept min/max config', () => {
      const result = NumberPropertySchema.safeParse({
        type: 'number',
        value: 50,
        config: { min: 0, max: 100 },
      })
      expect(result.success).toBe(true)
    })

    test('should accept unit config', () => {
      const result = NumberPropertySchema.safeParse({
        type: 'number',
        value: 100,
        config: { unit: 'kg' },
      })
      expect(result.success).toBe(true)
    })

    test('should reject negative step', () => {
      const result = NumberPropertySchema.safeParse({
        type: 'number',
        value: 10,
        config: { step: -1 },
      })
      expect(result.success).toBe(false)
    })
  })

  describe('SelectProperty', () => {
    test('should accept valid selection', () => {
      const result = SelectPropertySchema.safeParse({
        type: 'select',
        value: 'option1',
        config: { options: ['option1', 'option2', 'option3'] },
      })
      expect(result.success).toBe(true)
    })

    test('should reject when options array is empty', () => {
      const result = SelectPropertySchema.safeParse({
        type: 'select',
        value: 'option1',
        config: { options: [] },
      })
      expect(result.success).toBe(false)
    })

    test('should reject when config is missing', () => {
      const result = SelectPropertySchema.safeParse({
        type: 'select',
        value: 'option1',
      })
      expect(result.success).toBe(false)
    })

    test('should accept single option', () => {
      const result = SelectPropertySchema.safeParse({
        type: 'select',
        value: 'only',
        config: { options: ['only'] },
      })
      expect(result.success).toBe(true)
    })
  })

  describe('MultiSelectProperty', () => {
    test('should accept multiple selections', () => {
      const result = MultiSelectPropertySchema.safeParse({
        type: 'multi-select',
        value: ['option1', 'option2'],
        config: { options: ['option1', 'option2', 'option3'] },
      })
      expect(result.success).toBe(true)
    })

    test('should accept empty array', () => {
      const result = MultiSelectPropertySchema.safeParse({
        type: 'multi-select',
        value: [],
        config: { options: ['option1', 'option2'] },
      })
      expect(result.success).toBe(true)
    })

    test('should accept all options selected', () => {
      const result = MultiSelectPropertySchema.safeParse({
        type: 'multi-select',
        value: ['a', 'b', 'c'],
        config: { options: ['a', 'b', 'c'] },
      })
      expect(result.success).toBe(true)
    })

    test('should reject when value is not array', () => {
      const result = MultiSelectPropertySchema.safeParse({
        type: 'multi-select',
        value: 'option1',
        config: { options: ['option1', 'option2'] },
      })
      expect(result.success).toBe(false)
    })

    test('should reject when options is empty', () => {
      const result = MultiSelectPropertySchema.safeParse({
        type: 'multi-select',
        value: [],
        config: { options: [] },
      })
      expect(result.success).toBe(false)
    })
  })

  describe('DateProperty', () => {
    test('should accept valid date', () => {
      const result = DatePropertySchema.safeParse({
        type: 'date',
        value: new Date('2024-01-01'),
      })
      expect(result.success).toBe(true)
    })

    test('should coerce string to date', () => {
      const result = DatePropertySchema.safeParse({
        type: 'date',
        value: '2024-01-01',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.value).toBeInstanceOf(Date)
      }
    })

    test('should coerce timestamp to date', () => {
      const result = DatePropertySchema.safeParse({
        type: 'date',
        value: 1704067200000, // 2024-01-01
      })
      expect(result.success).toBe(true)
    })

    test('should reject invalid date string', () => {
      const result = DatePropertySchema.safeParse({
        type: 'date',
        value: 'not-a-date',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('CurrencyProperty', () => {
    test('should accept valid currency amount', () => {
      const result = CurrencyPropertySchema.safeParse({
        type: 'currency',
        value: 99.99,
      })
      expect(result.success).toBe(true)
    })

    test('should accept zero', () => {
      const result = CurrencyPropertySchema.safeParse({
        type: 'currency',
        value: 0,
      })
      expect(result.success).toBe(true)
    })

    test('should accept negative amounts', () => {
      const result = CurrencyPropertySchema.safeParse({
        type: 'currency',
        value: -50.00,
      })
      expect(result.success).toBe(true)
    })

    test('should accept currency config', () => {
      const result = CurrencyPropertySchema.safeParse({
        type: 'currency',
        value: 100,
        config: { currency: 'EUR', min: 0, max: 1000 },
      })
      expect(result.success).toBe(true)
    })

    test('should reject string value', () => {
      const result = CurrencyPropertySchema.safeParse({
        type: 'currency',
        value: '99.99',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('RatingProperty', () => {
    test('should accept valid integer rating', () => {
      const result = RatingPropertySchema.safeParse({
        type: 'rating',
        value: 4,
      })
      expect(result.success).toBe(true)
    })

    test('should accept zero rating', () => {
      const result = RatingPropertySchema.safeParse({
        type: 'rating',
        value: 0,
      })
      expect(result.success).toBe(true)
    })

    test('should reject negative ratings', () => {
      const result = RatingPropertySchema.safeParse({
        type: 'rating',
        value: -1,
      })
      expect(result.success).toBe(false)
    })

    test('should reject float values', () => {
      const result = RatingPropertySchema.safeParse({
        type: 'rating',
        value: 3.5,
      })
      expect(result.success).toBe(false)
    })

    test('should accept maxRating config', () => {
      const result = RatingPropertySchema.safeParse({
        type: 'rating',
        value: 8,
        config: { maxRating: 10 },
      })
      expect(result.success).toBe(true)
    })

    test('should reject zero maxRating', () => {
      const result = RatingPropertySchema.safeParse({
        type: 'rating',
        value: 3,
        config: { maxRating: 0 },
      })
      expect(result.success).toBe(false)
    })
  })

  describe('EmailProperty', () => {
    test('should accept valid email', () => {
      const result = EmailPropertySchema.safeParse({
        type: 'email',
        value: 'test@example.com',
      })
      expect(result.success).toBe(true)
    })

    test('should accept email with subdomain', () => {
      const result = EmailPropertySchema.safeParse({
        type: 'email',
        value: 'user@mail.example.com',
      })
      expect(result.success).toBe(true)
    })

    test('should accept email with plus', () => {
      const result = EmailPropertySchema.safeParse({
        type: 'email',
        value: 'user+tag@example.com',
      })
      expect(result.success).toBe(true)
    })

    test('should reject invalid email', () => {
      const result = EmailPropertySchema.safeParse({
        type: 'email',
        value: 'not-an-email',
      })
      expect(result.success).toBe(false)
    })

    test('should reject email without domain', () => {
      const result = EmailPropertySchema.safeParse({
        type: 'email',
        value: 'user@',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('UrlProperty', () => {
    test('should accept http URL', () => {
      const result = UrlPropertySchema.safeParse({
        type: 'url',
        value: 'http://example.com',
      })
      expect(result.success).toBe(true)
    })

    test('should accept https URL', () => {
      const result = UrlPropertySchema.safeParse({
        type: 'url',
        value: 'https://example.com',
      })
      expect(result.success).toBe(true)
    })

    test('should accept URL with path', () => {
      const result = UrlPropertySchema.safeParse({
        type: 'url',
        value: 'https://example.com/path/to/page',
      })
      expect(result.success).toBe(true)
    })

    test('should accept URL with query params', () => {
      const result = UrlPropertySchema.safeParse({
        type: 'url',
        value: 'https://example.com?foo=bar&baz=qux',
      })
      expect(result.success).toBe(true)
    })

    test('should reject invalid URL', () => {
      const result = UrlPropertySchema.safeParse({
        type: 'url',
        value: 'not a url',
      })
      expect(result.success).toBe(false)
    })

    test('should reject URL without protocol', () => {
      const result = UrlPropertySchema.safeParse({
        type: 'url',
        value: 'example.com',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('CheckboxProperty', () => {
    test('should accept true', () => {
      const result = CheckboxPropertySchema.safeParse({
        type: 'checkbox',
        value: true,
      })
      expect(result.success).toBe(true)
    })

    test('should accept false', () => {
      const result = CheckboxPropertySchema.safeParse({
        type: 'checkbox',
        value: false,
      })
      expect(result.success).toBe(true)
    })

    test('should reject string "true"', () => {
      const result = CheckboxPropertySchema.safeParse({
        type: 'checkbox',
        value: 'true',
      })
      expect(result.success).toBe(false)
    })

    test('should reject number 1', () => {
      const result = CheckboxPropertySchema.safeParse({
        type: 'checkbox',
        value: 1,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('PropertyValueSchema - Discriminated Union', () => {
    test('should validate text property through union', () => {
      const result = PropertyValueSchema.safeParse({
        type: 'text',
        value: 'test',
      })
      expect(result.success).toBe(true)
    })

    test('should validate number property through union', () => {
      const result = PropertyValueSchema.safeParse({
        type: 'number',
        value: 42,
      })
      expect(result.success).toBe(true)
    })

    test('should reject unknown type', () => {
      const result = PropertyValueSchema.safeParse({
        type: 'unknown-type',
        value: 'test',
      })
      expect(result.success).toBe(false)
    })

    test('should reject mismatched type and value', () => {
      const result = PropertyValueSchema.safeParse({
        type: 'number',
        value: 'not a number',
      })
      expect(result.success).toBe(false)
    })

    test('should reject relation type (removed)', () => {
      const result = PropertyValueSchema.safeParse({
        type: 'relation',
        value: '123e4567-e89b-12d3-a456-426614174000',
      })
      expect(result.success).toBe(false)
    })
  })
})
