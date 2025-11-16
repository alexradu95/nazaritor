import { router, publicProcedure } from '../init'
import { protectedProcedure } from '../middleware/errorHandler'
import { z } from 'zod'
import { BaseObjectSchema } from '@repo/schemas'
import { objects, relations } from '@repo/database'
import { eq, desc, and, sql } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { getOrCreateDailyNote, getTodayDateString } from '../../services/daily-note-helpers'
import { dbToBaseObject } from '../../utils/db-helpers'

export const objectRouter = router({
  // Health check for object router
  ping: publicProcedure.query(() => {
    return { message: 'pong from object router' }
  }),

  // Create a new object
  create: protectedProcedure
    .input(BaseObjectSchema.omit({ id: true, metadata: true }))
    .output(BaseObjectSchema)
    .mutation(async ({ input, ctx }) => {
      const now = new Date()

      const result = await ctx.db
        .insert(objects)
        .values({
          type: input.type,
          title: input.title,
          content: input.content || '',
          properties: input.properties || {},
          metadata: {
            tags: [],
            favorited: false,
          },
          archived: false,
          createdAt: now,
          updatedAt: now,
        })
        .returning()

      if (result.length === 0) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create object',
        })
      }

      const newObject = result[0]

      // AUTO-LINKING: Link object to today's daily note (timeline feature)
      // Skip auto-linking for daily-note objects themselves to avoid circular references
      if (input.type !== 'daily-note') {
        try {
          const todayDate = getTodayDateString()
          const dailyNote = await getOrCreateDailyNote(todayDate, ctx.db)

          // Create 'created_on' relation
          await ctx.db.insert(relations).values({
            fromObjectId: newObject!.id,
            toObjectId: dailyNote!.id,
            relationType: 'created_on',
            metadata: {
              auto: true, // Mark as auto-created
            },
          })
        } catch (error) {
          // Log error but don't fail object creation if daily note linking fails
          console.error('Failed to auto-link to daily note:', error)
        }
      }

      return dbToBaseObject(newObject!)
    }),

  // Get object by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(BaseObjectSchema.nullable())
    .query(async ({ input, ctx }) => {
      const result = await ctx.db
        .select()
        .from(objects)
        .where(eq(objects.id, input.id))
        .limit(1)

      if (result.length === 0) return null

      return dbToBaseObject(result[0]!)
    }),

  // List objects with filters
  list: protectedProcedure
    .input(
      z.object({
        type: z.string().optional(),
        archived: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const conditions = []

      if (input.type) {
        conditions.push(eq(objects.type, input.type))
      }

      if (input.archived !== undefined) {
        conditions.push(eq(objects.archived, input.archived))
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      const results = await ctx.db
        .select()
        .from(objects)
        .where(whereClause)
        .orderBy(desc(objects.updatedAt))
        .limit(input.limit)
        .offset(input.offset)

      const mapped = results.map(dbToBaseObject)

      return {
        objects: mapped,
        total: results.length,
        hasMore: results.length === input.limit,
      }
    }),

  // Update object
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        updates: BaseObjectSchema.partial().omit({ id: true, metadata: true }),
      })
    )
    .output(BaseObjectSchema)
    .mutation(async ({ input, ctx }) => {
      // First check if object exists
      const existing = await ctx.db
        .select()
        .from(objects)
        .where(eq(objects.id, input.id))
        .limit(1)

      if (existing.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Object with ID ${input.id} not found`,
        })
      }

      // Build update values
      type UpdateValues = {
        updatedAt: Date
        title?: string
        content?: string
        properties?: Record<string, unknown>
      }

      const updateValues: UpdateValues = {
        updatedAt: new Date(),
      }

      if (input.updates.title !== undefined) {
        updateValues.title = input.updates.title
      }

      if (input.updates.content !== undefined) {
        updateValues.content = input.updates.content
      }

      if (input.updates.properties !== undefined) {
        updateValues.properties = input.updates.properties
      }

      // Perform update
      const result = await ctx.db
        .update(objects)
        .set(updateValues)
        .where(eq(objects.id, input.id))
        .returning()

      if (result.length === 0) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update object',
        })
      }

      return dbToBaseObject(result[0]!)
    }),

  // Delete object
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      // Check if object exists
      const existing = await ctx.db
        .select()
        .from(objects)
        .where(eq(objects.id, input.id))
        .limit(1)

      if (existing.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Object with ID ${input.id} not found`,
        })
      }

      await ctx.db.delete(objects).where(eq(objects.id, input.id))

      return { success: true }
    }),

  // Archive/unarchive object
  archive: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        archived: z.boolean(),
      })
    )
    .output(BaseObjectSchema)
    .mutation(async ({ input, ctx }) => {
      // Check if object exists
      const existing = await ctx.db
        .select()
        .from(objects)
        .where(eq(objects.id, input.id))
        .limit(1)

      if (existing.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Object with ID ${input.id} not found`,
        })
      }

      const result = await ctx.db
        .update(objects)
        .set({
          archived: input.archived,
          updatedAt: new Date(),
        })
        .where(eq(objects.id, input.id))
        .returning()

      return dbToBaseObject(result[0]!)
    }),

  // TIMELINE QUERIES: Query objects by creation/modification date

  // Get objects created on a specific date
  objectsCreatedOnDate: protectedProcedure
    .input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })) // YYYY-MM-DD format
    .query(async ({ input, ctx }) => {
      // Use virtual column created_date for efficient querying
      const result = await ctx.db
        .select()
        .from(objects)
        .where(sql`created_date = ${input.date}`)
        .orderBy(desc(objects.createdAt))

      return result.map(dbToBaseObject)
    }),

  // Get objects modified on a specific date
  objectsModifiedOnDate: protectedProcedure
    .input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
    .query(async ({ input, ctx }) => {
      // Use virtual column updated_date for efficient querying
      const result = await ctx.db
        .select()
        .from(objects)
        .where(sql`updated_date = ${input.date}`)
        .orderBy(desc(objects.updatedAt))

      return result.map(dbToBaseObject)
    }),

  // Get timeline for a daily note (all objects created that day)
  dailyNoteTimeline: protectedProcedure
    .input(z.object({ dailyNoteId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      // Find all objects with 'created_on' relation to this daily note
      const timeline = await ctx.db
        .select({ object: objects })
        .from(relations)
        .innerJoin(objects, eq(relations.fromObjectId, objects.id))
        .where(
          and(
            eq(relations.toObjectId, input.dailyNoteId),
            eq(relations.relationType, 'created_on')
          )
        )
        .orderBy(desc(objects.createdAt))

      return timeline.map((row) => dbToBaseObject(row.object))
    }),
})
