// Re-export all types from schemas (inferred from Zod)
export type {
  // Base types
  BaseObject,
  ObjectType,
  Metadata,
  PropertyType,
  PropertyValue,

  // Relation types
  RelationType,
  Relation,
  RelationMetadata,

  // Object types
  Project,
  ProjectStatus,
  Priority,
  Task,
  TaskStatus,
  DailyNote,
  Mood,
  Resource,
  ResourceType,
  Confidence,
  Privacy,
  Weblink,
  ReadStatus,
  Person,
  MeetingFrequency,
  Relationship,
  Page,
  PageStatus,
  CalendarEntry,
  EventType,
  EventStatus,
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
