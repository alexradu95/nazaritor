/**
 * Query Router
 *
 * Handles query object CRUD and execution operations.
 * Queries are saved filters that can be executed to return dynamic result sets.
 * Phase 1: Basic object-type queries only (filter by type, properties, tags, dates)
 */

import { router } from '../init'
import { protectedProcedure } from '../middleware/errorHandler'
import { z } from 'zod'
import { QuerySchema } from '@repo/schemas'
import { objects } from '@repo/database'
import { eq, desc, and } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { executeQuery, testQuery } from '../../services/query-executor'
import { dbToBaseObject } from '../../utils/db-helpers'

export const queryRouter = router({
  // Create a new query
  create: protectedProcedure
    .meta({
      description: 'Create a new saved query with filters, sorting, and limits for dynamic object searches',
    })
    .input(QuerySchema.omit({ id: true, metadata: true, type: true }))
    .output(QuerySchema)
    .mutation(async ({ input, ctx }) => {
      const now = new Date()

      const result = await ctx.db
        .insert(objects)
        .values({
          type: 'query',
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
          message: 'Failed to create query',
        })
      }

      return dbToBaseObject(result[0]!) as z.infer<typeof QuerySchema>
    }),

  // List all queries
  list: protectedProcedure
    .meta({ description: 'List all non-archived saved queries, ordered by creation date' })
    .query(async ({ ctx }) => {
    const result = await ctx.db
      .select()
      .from(objects)
      .where(and(eq(objects.type, 'query'), eq(objects.archived, false)))
      .orderBy(desc(objects.createdAt))

    return result.map((obj) => dbToBaseObject(obj) as z.infer<typeof QuerySchema>)
  }),

  // Get query by ID
  getById: protectedProcedure
    .meta({ description: 'Retrieve a specific saved query by its UUID' })
    .input(z.object({ id: z.string().uuid() }))
    .output(QuerySchema.nullable())
    .query(async ({ input, ctx }) => {
      const result = await ctx.db
        .select()
        .from(objects)
        .where(and(eq(objects.id, input.id), eq(objects.type, 'query')))
        .limit(1)

      if (result.length === 0) return null

      return dbToBaseObject(result[0]!) as z.infer<typeof QuerySchema>
    }),

  // Update query
  update: protectedProcedure
    .meta({
      description: 'Update an existing saved query\'s title, content, or filter properties',
    })
    .input(
      z.object({
        id: z.string().uuid(),
        updates: QuerySchema.partial().omit({ id: true, metadata: true, type: true }),
      })
    )
    .output(QuerySchema)
    .mutation(async ({ input, ctx }) => {
      // Check if query exists
      const existing = await ctx.db
        .select()
        .from(objects)
        .where(and(eq(objects.id, input.id), eq(objects.type, 'query')))
        .limit(1)

      if (existing.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Query with ID ${input.id} not found`,
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
          message: 'Failed to update query',
        })
      }

      return dbToBaseObject(result[0]!) as z.infer<typeof QuerySchema>
    }),

  // Delete query
  delete: protectedProcedure
    .meta({ description: 'Permanently delete a saved query by its UUID' })
    .input(z.object({ id: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      // Check if query exists
      const existing = await ctx.db
        .select()
        .from(objects)
        .where(and(eq(objects.id, input.id), eq(objects.type, 'query')))
        .limit(1)

      if (existing.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Query with ID ${input.id} not found`,
        })
      }

      await ctx.db.delete(objects).where(eq(objects.id, input.id))

      return { success: true }
    }),

  // Execute a saved query
  execute: protectedProcedure
    .meta({
      description: 'Execute a saved query and return the matching objects based on its filters, sort, and limit settings',
    })
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      // Fetch query object
      const result = await ctx.db
        .select()
        .from(objects)
        .where(and(eq(objects.id, input.id), eq(objects.type, 'query')))
        .limit(1)

      if (result.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Query with ID ${input.id} not found`,
        })
      }

      const query = dbToBaseObject(result[0]!) as z.infer<typeof QuerySchema>

      // Execute the query using query-executor service
      return executeQuery(query, ctx.db)
    }),

  // Test a query without saving it
  test: protectedProcedure
    .meta({
      description: 'Test a query configuration without saving it - useful for previewing results before creating a saved query',
    })
    .input(
      z.object({
        filters: QuerySchema.shape.properties.shape.filters.optional(),
        sort: QuerySchema.shape.properties.shape.sort.optional(),
        limit: QuerySchema.shape.properties.shape.limit.optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Use testQuery service to execute without saving
      return testQuery(input, ctx.db)
    }),
})
