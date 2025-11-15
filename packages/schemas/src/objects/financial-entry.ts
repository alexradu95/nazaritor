import { z } from 'zod'
import { BaseObjectSchema } from './base-object'

export const FinancialEntryTypeEnum = z.enum(['snapshot', 'transaction', 'budget', 'goal'])

export const TransactionTypeEnum = z.enum(['income', 'expense', 'transfer'])

export const BudgetPeriodEnum = z.enum(['weekly', 'monthly', 'yearly'])

export const FinancialEntryPropertiesSchema = z.object({
  entryType: FinancialEntryTypeEnum,

  // For snapshots
  totalAssets: z.number().optional(),
  totalLiabilities: z.number().optional(),
  netWorth: z.number().optional(),

  // For transactions
  amount: z.number().optional(),
  currency: z.string().default('USD'),
  category: z.string().optional(),
  transactionType: TransactionTypeEnum.optional(),
  transactionDate: z.coerce.date().optional(),
  account: z.string().optional(),

  // For budgets
  budgetPeriod: BudgetPeriodEnum.optional(),
  budgetAmount: z.number().optional(),
  spent: z.number().optional(),
  remaining: z.number().optional(),

  // For goals
  targetAmount: z.number().optional(),
  currentAmount: z.number().optional(),
  targetDate: z.coerce.date().optional(),

  // Common fields
  date: z.coerce.date(),
  notes: z.string().optional(),
  attachments: z.array(z.string()).optional(),
})

export const FinancialEntrySchema = BaseObjectSchema.extend({
  type: z.literal('financial-entry'),
  properties: FinancialEntryPropertiesSchema,
})

export type FinancialEntry = z.infer<typeof FinancialEntrySchema>
export type FinancialEntryType = z.infer<typeof FinancialEntryTypeEnum>
export type TransactionType = z.infer<typeof TransactionTypeEnum>
export type BudgetPeriod = z.infer<typeof BudgetPeriodEnum>
