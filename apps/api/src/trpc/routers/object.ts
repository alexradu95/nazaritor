import { router, publicProcedure } from '../init'
import { z } from 'zod'
import { BaseObjectSchema } from '@repo/schemas'
import { objects } from '@repo/database'
import { eq, desc, and } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'

// Helper function to convert DB object to BaseObject schema
function dbToBaseObject(obj: any) {
  return {
    id: obj.id,
    type: obj.type,
    title: obj.title,
    content: obj.content || '',
    properties: obj.properties || {},
    relations: [],
    metadata: {
      ...(obj.metadata || {}),
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
      tags: obj.metadata?.tags || [],
      archived: obj.archived,
      favorited: obj.metadata?.favorited || false,
    },
  }
}

export const objectRouter = router({
  // Health check for object router
  ping: publicProcedure.query(() => {
    return { message: 'pong from object router' }
  }),

  // Create a new object
  create: publicProcedure
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
            archived: false,
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

      return dbToBaseObject(result[0])
    }),

  // Get object by ID
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(BaseObjectSchema.nullable())
    .query(async ({ input, ctx }) => {
      const result = await ctx.db
        .select()
        .from(objects)
        .where(eq(objects.id, input.id))
        .limit(1)

      if (result.length === 0) return null

      return dbToBaseObject(result[0])
    }),

  // List objects with filters
  list: publicProcedure
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
  update: publicProcedure
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
      const updateValues: any = {
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

      return dbToBaseObject(result[0])
    }),

  // Delete object
  delete: publicProcedure
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
  archive: publicProcedure
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
          metadata: {
            ...(existing[0].metadata as any),
            archived: input.archived,
          },
          updatedAt: new Date(),
        })
        .where(eq(objects.id, input.id))
        .returning()

      return dbToBaseObject(result[0])
    }),
})
