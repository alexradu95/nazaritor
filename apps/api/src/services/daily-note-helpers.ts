/**
 * Daily Note Helper Functions
 *
 * Utilities for working with daily notes, especially for auto-linking timeline feature.
 * Every object created gets automatically linked to its creation day's daily note.
 */

import { eq, and, sql } from 'drizzle-orm'
import { objects } from '@repo/database'
import type { Context } from '../trpc/context'

/**
 * Get or create a daily note for a specific date
 *
 * @param date - Date string in YYYY-MM-DD format
 * @param db - Database instance
 * @returns The daily note object
 */
export async function getOrCreateDailyNote(date: string, db: Context['db']) {
  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`Invalid date format: ${date}. Expected YYYY-MM-DD`)
  }

  // Validate that the date is actually valid (not 2025-13-01 or 2025-02-29 in non-leap year)
  const parsedDate = new Date(date + 'T00:00:00Z')
  if (isNaN(parsedDate.getTime())) {
    throw new Error(`Invalid date format: ${date}. Date does not exist in calendar`)
  }
  const formattedBack = parsedDate.toISOString().split('T')[0]
  if (formattedBack !== date) {
    throw new Error(`Invalid date format: ${date}. Date does not exist in calendar`)
  }

  // Try to find existing daily note for this date
  const existing = await db
    .select()
    .from(objects)
    .where(
      and(
        eq(objects.type, 'daily-note'),
        sql`json_extract(${objects.properties}, '$.date.value') = ${date}`
      )
    )
    .limit(1)

  if (existing.length > 0) {
    return existing[0]
  }

  // Create new daily note
  const [newDailyNote] = await db
    .insert(objects)
    .values({
      type: 'daily-note',
      title: `Daily Note - ${date}`,
      content: '',
      properties: {
        date: {
          type: 'date',
          value: date,
        },
      },
      metadata: {
        tags: [],
        favorited: false,
      },
      archived: false,
    })
    .returning()

  return newDailyNote
}

/**
 * Format today's date as YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const now = new Date()
  const parts = now.toISOString().split('T')
  return parts[0]!
}

/**
 * Parse Date object to YYYY-MM-DD string
 */
export function formatDateString(date: Date): string {
  const parts = date.toISOString().split('T')
  return parts[0]!
}
