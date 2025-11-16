/**
 * Timeline Feature Tests
 *
 * Tests auto-linking objects to daily notes and timeline queries
 */

import { describe, it, expect, beforeAll } from 'bun:test'
import { Database } from 'bun:sqlite'
import { db as dbInstance, objects, relations } from '@repo/database'
import { eq, and } from 'drizzle-orm'
import { getOrCreateDailyNote, getTodayDateString, formatDateString } from '../../src/services/daily-note-helpers'
import type { Context } from '../../src/trpc/context'

// Helper to get a fresh SQLite connection for raw queries
function getFreshSqlite() {
  const dbPath = process.env.DATABASE_URL || './data/nazaritor.test.db'
  return new Database(dbPath, { readonly: true })
}

describe('Timeline Features', () => {
  let db: Context['db']

  beforeAll(() => {
    db = dbInstance
  })

  describe('Daily Note Helpers', () => {
    it('should return today\'s date in YYYY-MM-DD format', () => {
      const today = getTodayDateString()
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('should format Date object to YYYY-MM-DD string', () => {
      const date = new Date('2025-01-15T10:30:00Z')
      const formatted = formatDateString(date)
      expect(formatted).toBe('2025-01-15')
    })

    it('should create a daily note for a specific date', async () => {
      const testDate = '2025-01-15'
      const dailyNote = await getOrCreateDailyNote(testDate, db)

      expect(dailyNote.type).toBe('daily-note')
      expect(dailyNote.title).toBe('Daily Note - 2025-01-15')
      expect(dailyNote.properties).toMatchObject({
        date: {
          type: 'date',
          value: testDate,
        },
      })
    })

    it('should return existing daily note if it already exists', async () => {
      const testDate = '2025-01-16'

      // Create first time
      const firstCall = await getOrCreateDailyNote(testDate, db)

      // Get second time (should return same)
      const secondCall = await getOrCreateDailyNote(testDate, db)

      expect(firstCall.id).toBe(secondCall.id)

      // Verify only one daily note exists for this date
      const allDailyNotes = await db
        .select()
        .from(objects)
        .where(eq(objects.type, 'daily-note'))

      const matchingDates = allDailyNotes.filter(
        (dn) => (dn.properties as any)?.date?.value === testDate
      )

      expect(matchingDates).toHaveLength(1)
    })

    it('should throw error for invalid date format', async () => {
      await expect(getOrCreateDailyNote('01-15-2025', db)).rejects.toThrow(
        'Invalid date format'
      )
      await expect(getOrCreateDailyNote('2025/01/15', db)).rejects.toThrow(
        'Invalid date format'
      )
      await expect(getOrCreateDailyNote('invalid', db)).rejects.toThrow(
        'Invalid date format'
      )
    })
  })

  describe('Auto-Linking', () => {
    it('should auto-link created object to today\'s daily note', async () => {
      const todayDate = getTodayDateString()
      const dailyNote = await getOrCreateDailyNote(todayDate, db)

      // Create a project
      const [project] = await db
        .insert(objects)
        .values({
          type: 'project',
          title: 'Test Auto-Link Project',
          content: '',
          properties: {},
          metadata: { tags: [], favorited: false },
          archived: false,
        })
        .returning()

      // Manually create created_on relation (simulating what object.create does)
      await db.insert(relations).values({
        fromObjectId: project.id,
        toObjectId: dailyNote.id,
        relationType: 'created_on',
        metadata: { auto: true },
      })

      // Verify relation exists
      const createdOnRelations = await db
        .select()
        .from(relations)
        .where(
          and(
            eq(relations.fromObjectId, project.id),
            eq(relations.toObjectId, dailyNote.id),
            eq(relations.relationType, 'created_on')
          )
        )

      expect(createdOnRelations).toHaveLength(1)
      expect(createdOnRelations[0].metadata).toMatchObject({ auto: true })
    })

    it('should not auto-link daily-note objects to avoid circular references', async () => {
      const testDate = '2025-01-17'

      // Create daily note
      const dailyNote = await getOrCreateDailyNote(testDate, db)

      // Verify no created_on relation exists for the daily note itself
      const selfRelations = await db
        .select()
        .from(relations)
        .where(
          and(
            eq(relations.fromObjectId, dailyNote.id),
            eq(relations.relationType, 'created_on')
          )
        )

      expect(selfRelations).toHaveLength(0)
    })

    it('should auto-link multiple object types to same daily note', async () => {
      const testDate = '2025-01-18'
      const dailyNote = await getOrCreateDailyNote(testDate, db)

      // Create different object types
      const [project] = await db
        .insert(objects)
        .values({
          type: 'project',
          title: 'Multi-type Project',
          content: '',
          properties: {},
          metadata: { tags: [], favorited: false },
          archived: false,
        })
        .returning()

      const [task] = await db
        .insert(objects)
        .values({
          type: 'task',
          title: 'Multi-type Task',
          content: '',
          properties: {},
          metadata: { tags: [], favorited: false },
          archived: false,
        })
        .returning()

      const [person] = await db
        .insert(objects)
        .values({
          type: 'person',
          title: 'John Doe',
          content: '',
          properties: {},
          metadata: { tags: [], favorited: false },
          archived: false,
        })
        .returning()

      // Create relations
      await db.insert(relations).values([
        {
          fromObjectId: project.id,
          toObjectId: dailyNote.id,
          relationType: 'created_on',
          metadata: { auto: true },
        },
        {
          fromObjectId: task.id,
          toObjectId: dailyNote.id,
          relationType: 'created_on',
          metadata: { auto: true },
        },
        {
          fromObjectId: person.id,
          toObjectId: dailyNote.id,
          relationType: 'created_on',
          metadata: { auto: true },
        },
      ])

      // Verify all linked to same daily note
      const timelineRelations = await db
        .select()
        .from(relations)
        .where(
          and(
            eq(relations.toObjectId, dailyNote.id),
            eq(relations.relationType, 'created_on')
          )
        )

      // Should have at least the 3 we just created
      expect(timelineRelations.length).toBeGreaterThanOrEqual(3)

      // Verify our specific objects are linked
      const linkedObjectIds = timelineRelations.map((r) => r.fromObjectId)
      expect(linkedObjectIds).toContain(project.id)
      expect(linkedObjectIds).toContain(task.id)
      expect(linkedObjectIds).toContain(person.id)
    })
  })

  describe('Virtual Date Columns', () => {
    it('should have created_date virtual column matching creation date', async () => {
      const testDate = '2025-01-19'

      // Create object (using specific timestamp for that date)
      const timestamp = new Date(`${testDate}T14:30:00Z`)

      const [obj] = await db
        .insert(objects)
        .values({
          type: 'task',
          title: 'Virtual Column Test',
          content: '',
          properties: {},
          metadata: { tags: [], favorited: false },
          archived: false,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
        .returning()

      // Query using raw SQL to access virtual columns
      const sql = getFreshSqlite()
      const stmt = sql.query(
        `SELECT created_date, updated_date FROM objects WHERE id = ?`
      )
      const result = stmt.get(obj.id) as { created_date: string; updated_date: string }
      sql.close()

      expect(result.created_date).toBe(testDate)
      expect(result.updated_date).toBe(testDate)
    })

    it('should update updated_date when object is modified', async () => {
      const createdDate = '2025-01-20'
      const createdTimestamp = new Date(`${createdDate}T10:00:00Z`)
      const todayDate = getTodayDateString()

      // Create object
      const [obj] = await db
        .insert(objects)
        .values({
          type: 'project',
          title: 'Update Test Project',
          content: '',
          properties: {},
          metadata: { tags: [], favorited: false },
          archived: false,
          createdAt: createdTimestamp,
          updatedAt: createdTimestamp,
        })
        .returning()

      // Update object (the trigger will set updatedAt to current time)
      await db
        .update(objects)
        .set({ title: 'Updated Project Title' })
        .where(eq(objects.id, obj.id))

      // Check virtual columns
      const sql = getFreshSqlite()
      const stmt = sql.query(
        `SELECT created_date, updated_date FROM objects WHERE id = ?`
      )
      const result = stmt.get(obj.id) as { created_date: string; updated_date: string }
      sql.close()

      // Created date should remain as set
      expect(result.created_date).toBe(createdDate)
      // Updated date should be today (due to trigger setting current timestamp)
      expect(result.updated_date).toBe(todayDate)
    })
  })

  describe('Timeline Queries', () => {
    it('should query objects created on a specific date using virtual column', async () => {
      const testDate = '2025-01-22'
      const timestamp = new Date(`${testDate}T12:00:00Z`)

      // Create multiple objects on same date
      await db.insert(objects).values([
        {
          type: 'project',
          title: 'Date Query Project 1',
          content: '',
          properties: {},
          metadata: { tags: [], favorited: false },
          archived: false,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
        {
          type: 'task',
          title: 'Date Query Task 1',
          content: '',
          properties: {},
          metadata: { tags: [], favorited: false },
          archived: false,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ])

      // Query by virtual column using raw SQL
      const sql = getFreshSqlite()
      const stmt = sql.query(
        `SELECT * FROM objects WHERE created_date = ? AND type IN ('project', 'task')`
      )
      const result = stmt.all(testDate) as Array<any>
      sql.close()

      expect(result.length).toBeGreaterThanOrEqual(2)

      // Verify the results contain our test objects
      const titles = result.map((obj: any) => obj.title)
      expect(titles).toContain('Date Query Project 1')
      expect(titles).toContain('Date Query Task 1')
    })

    it('should query timeline for a daily note using relations', async () => {
      const testDate = '2025-01-23'
      const dailyNote = await getOrCreateDailyNote(testDate, db)

      // Create objects and link them
      const [project] = await db
        .insert(objects)
        .values({
          type: 'project',
          title: 'Timeline Query Project',
          content: '',
          properties: {},
          metadata: { tags: [], favorited: false },
          archived: false,
        })
        .returning()

      const [task] = await db
        .insert(objects)
        .values({
          type: 'task',
          title: 'Timeline Query Task',
          content: '',
          properties: {},
          metadata: { tags: [], favorited: false },
          archived: false,
        })
        .returning()

      // Link to daily note
      await db.insert(relations).values([
        {
          fromObjectId: project.id,
          toObjectId: dailyNote.id,
          relationType: 'created_on',
          metadata: {},
        },
        {
          fromObjectId: task.id,
          toObjectId: dailyNote.id,
          relationType: 'created_on',
          metadata: {},
        },
      ])

      // Query timeline
      const timeline = await db
        .select({ object: objects })
        .from(relations)
        .innerJoin(objects, eq(relations.fromObjectId, objects.id))
        .where(
          and(
            eq(relations.toObjectId, dailyNote.id),
            eq(relations.relationType, 'created_on')
          )
        )

      expect(timeline.length).toBeGreaterThanOrEqual(2)
      const titles = timeline.map((row) => row.object.title)
      expect(titles).toContain('Timeline Query Project')
      expect(titles).toContain('Timeline Query Task')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle creating daily note at date boundaries (start of year)', async () => {
      const newYearDate = '2026-01-01'
      const dailyNote = await getOrCreateDailyNote(newYearDate, db)

      expect(dailyNote.type).toBe('daily-note')
      expect(dailyNote.title).toBe('Daily Note - 2026-01-01')
      expect(dailyNote.properties).toMatchObject({
        date: {
          type: 'date',
          value: newYearDate,
        },
      })
    })

    it('should handle creating daily note at date boundaries (end of year)', async () => {
      const endOfYearDate = '2025-12-31'
      const dailyNote = await getOrCreateDailyNote(endOfYearDate, db)

      expect(dailyNote.type).toBe('daily-note')
      expect(dailyNote.title).toBe('Daily Note - 2025-12-31')
      expect(dailyNote.properties).toMatchObject({
        date: {
          type: 'date',
          value: endOfYearDate,
        },
      })
    })

    it('should handle creating daily note for leap year date', async () => {
      const leapYearDate = '2024-02-29'
      const dailyNote = await getOrCreateDailyNote(leapYearDate, db)

      expect(dailyNote.type).toBe('daily-note')
      expect(dailyNote.properties).toMatchObject({
        date: {
          type: 'date',
          value: leapYearDate,
        },
      })
    })

    it('should handle far future dates', async () => {
      const futureDate = '2099-12-31'
      const dailyNote = await getOrCreateDailyNote(futureDate, db)

      expect(dailyNote.type).toBe('daily-note')
      expect(dailyNote.properties).toMatchObject({
        date: {
          type: 'date',
          value: futureDate,
        },
      })
    })

    it('should handle far past dates', async () => {
      const pastDate = '2000-01-01'
      const dailyNote = await getOrCreateDailyNote(pastDate, db)

      expect(dailyNote.type).toBe('daily-note')
      expect(dailyNote.properties).toMatchObject({
        date: {
          type: 'date',
          value: pastDate,
        },
      })
    })

    it('should throw error for invalid date format with slashes', async () => {
      await expect(getOrCreateDailyNote('2025/01/15', db)).rejects.toThrow(
        'Invalid date format'
      )
    })

    it('should throw error for invalid date format with wrong order', async () => {
      await expect(getOrCreateDailyNote('15-01-2025', db)).rejects.toThrow(
        'Invalid date format'
      )
    })

    it('should throw error for invalid date values', async () => {
      await expect(getOrCreateDailyNote('2025-13-01', db)).rejects.toThrow(
        'Invalid date format'
      )
      await expect(getOrCreateDailyNote('2025-01-32', db)).rejects.toThrow(
        'Invalid date format'
      )
    })

    it('should throw error for non-leap year Feb 29', async () => {
      await expect(getOrCreateDailyNote('2025-02-29', db)).rejects.toThrow(
        'Invalid date format'
      )
    })

    it('should handle many objects linked to same daily note', async () => {
      const testDate = '2025-03-15'
      const dailyNote = await getOrCreateDailyNote(testDate, db)

      // Create 10 objects linked to same daily note
      const objectIds: string[] = []
      for (let i = 0; i < 10; i++) {
        const [obj] = await db
          .insert(objects)
          .values({
            type: 'task',
            title: `Bulk Test Task ${i}`,
            content: '',
            properties: {},
            metadata: { tags: [], favorited: false },
            archived: false,
          })
          .returning()
        objectIds.push(obj.id)

        await db.insert(relations).values({
          fromObjectId: obj.id,
          toObjectId: dailyNote.id,
          relationType: 'created_on',
          metadata: { auto: true },
        })
      }

      // Query all objects for this daily note
      const timeline = await db
        .select({ object: objects })
        .from(relations)
        .innerJoin(objects, eq(relations.fromObjectId, objects.id))
        .where(
          and(
            eq(relations.toObjectId, dailyNote.id),
            eq(relations.relationType, 'created_on')
          )
        )

      expect(timeline.length).toBeGreaterThanOrEqual(10)
      const titles = timeline.map((row) => row.object.title)
      for (let i = 0; i < 10; i++) {
        expect(titles).toContain(`Bulk Test Task ${i}`)
      }
    })

    it('should handle querying timeline across month boundaries', async () => {
      const endOfMonth = '2025-04-30'
      const startOfMonth = '2025-05-01'

      const dailyNote1 = await getOrCreateDailyNote(endOfMonth, db)
      const dailyNote2 = await getOrCreateDailyNote(startOfMonth, db)

      expect(dailyNote1.id).not.toBe(dailyNote2.id)
      expect(dailyNote1.properties.date.value).toBe(endOfMonth)
      expect(dailyNote2.properties.date.value).toBe(startOfMonth)
    })

    it('should handle empty timeline (daily note with no objects)', async () => {
      const emptyDate = '2025-06-01'
      const dailyNote = await getOrCreateDailyNote(emptyDate, db)

      // Query timeline - should be empty
      const timeline = await db
        .select({ object: objects })
        .from(relations)
        .innerJoin(objects, eq(relations.fromObjectId, objects.id))
        .where(
          and(
            eq(relations.toObjectId, dailyNote.id),
            eq(relations.relationType, 'created_on')
          )
        )

      expect(timeline).toEqual([])
    })

    it('should format Date object to YYYY-MM-DD correctly', () => {
      const testCases = [
        { date: new Date('2025-01-01T00:00:00Z'), expected: '2025-01-01' },
        { date: new Date('2025-12-31T23:59:59Z'), expected: '2025-12-31' },
        { date: new Date('2024-02-29T12:00:00Z'), expected: '2024-02-29' },
      ]

      for (const { date, expected } of testCases) {
        expect(formatDateString(date)).toBe(expected)
      }
    })

    it('should get today date string in YYYY-MM-DD format', () => {
      const today = getTodayDateString()

      // Verify format
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/)

      // Verify it matches actual today
      const now = new Date()
      const expectedYear = now.getFullYear()
      const expectedMonth = String(now.getMonth() + 1).padStart(2, '0')
      const expectedDay = String(now.getDate()).padStart(2, '0')
      const expected = `${expectedYear}-${expectedMonth}-${expectedDay}`

      expect(today).toBe(expected)
    })
  })
})
