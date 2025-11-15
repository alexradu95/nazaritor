// Re-export all types from schemas (inferred from Zod)
export type {
  BaseObject,
  ObjectType,
  Metadata,
  PropertyType,
  PropertyConfig,
  PropertyValue,
  RelationType,
  Relation,
  Project,
  ProjectStatus,
  Priority,
  Task,
  TaskStatus,
  Recurrence,
  DailyNote,
  Mood,
  KnowledgeBit,
  Confidence,
  PersonalBit,
  PersonalBitCategory,
  Privacy,
  EmotionalTone,
  Weblink,
  ReadStatus,
  Person,
  MeetingFrequency,
  Relationship,
  SocialLinks,
  Page,
  PageStatus,
  TableOfContentsItem,
  FinancialEntry,
  FinancialEntryType,
  TransactionType,
  BudgetPeriod,
  CalendarEntry,
  EventType,
  EventStatus,
  Reminder,
  CalendarRecurrence,
  Habit,
  HabitFrequency,
  TimeOfDay,
  Difficulty,
  CheckIn,
} from '@repo/schemas'

// Additional utility types
export type ID = string
export type Timestamp = Date

// API types
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface ErrorResponse {
  code: string
  message: string
  details?: unknown
}

// AI types
export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AIContext {
  messages: AIMessage[]
  activeObjects: ID[]
  currentView: string | null
}
