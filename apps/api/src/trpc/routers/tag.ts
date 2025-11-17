/**
 * Tag Router
 *
 * Handles tag object CRUD and tagging operations.
 * Tags are first-class objects that can be linked to any other object via 'tagged_with' relations.
 */

import { router } from '../init'
import { protectedProcedure } from '../middleware/errorHandler'
import { z } from 'zod'
import { TagSchema } from '@repo/schemas'
import { objects, relations } from '@repo/database'
import { eq, and, desc } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { dbToBaseObject } from '../../utils/db-helpers'

export const tagRouter = router({
  // Create a new tag
  create: protectedProcedure
    .meta({ description: 'Create a new tag object that can be used to categorize and organize other objects' })
    .input(
      TagSchema.omit({ id: true, metadata: true, type: true }).extend({
        properties: TagSchema.shape.properties.optional(),
      })
    )
    .output(TagSchema)
    .mutation(async ({ input, ctx }) => {
      const now = new Date()

      const result = await ctx.db
        .insert(objects)
        .values({
          type: 'tag',
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
          message: 'Failed to create tag',
        })
      }

      return dbToBaseObject(result[0]!) as z.infer<typeof TagSchema>
    }),

  // List all tags
  list: protectedProcedure
    .meta({ description: 'List all non-archived tags, ordered by creation date' })
    .query(async ({ ctx }) => {
    const result = await ctx.db
      .select()
      .from(objects)
      .where(and(eq(objects.type, 'tag'), eq(objects.archived, false)))
      .orderBy(desc(objects.createdAt))

    return result.map((obj) => dbToBaseObject(obj) as z.infer<typeof TagSchema>)
  }),

  // Get tag by ID
  getById: protectedProcedure
    .meta({ description: 'Retrieve a specific tag by its UUID' })
    .input(z.object({ id: z.string().uuid() }))
    .output(TagSchema.nullable())
    .query(async ({ input, ctx }) => {
      const result = await ctx.db
        .select()
        .from(objects)
        .where(and(eq(objects.id, input.id), eq(objects.type, 'tag')))
        .limit(1)

      if (result.length === 0) return null

      return dbToBaseObject(result[0]!) as z.infer<typeof TagSchema>
    }),

  // Tag an object (create 'tagged_with' relation)
  tagObject: protectedProcedure
    .meta({
      description: 'Add a tag to an object by creating a "tagged_with" relation between them',
    })
    .input(
      z.object({
        objectId: z.string().uuid(),
        tagId: z.string().uuid(),
      })
    )
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      // Verify both objects exist
      const [targetObject, tagObject] = await Promise.all([
        ctx.db
          .select()
          .from(objects)
          .where(eq(objects.id, input.objectId))
          .limit(1),
        ctx.db
          .select()
          .from(objects)
          .where(and(eq(objects.id, input.tagId), eq(objects.type, 'tag')))
          .limit(1),
      ])

      if (targetObject.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Object with ID ${input.objectId} not found`,
        })
      }

      if (tagObject.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Tag with ID ${input.tagId} not found`,
        })
      }

      // Check if relation already exists
      const existing = await ctx.db
        .select()
        .from(relations)
        .where(
          and(
            eq(relations.fromObjectId, input.objectId),
            eq(relations.toObjectId, input.tagId),
            eq(relations.relationType, 'tagged_with')
          )
        )
        .limit(1)

      if (existing.length > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Object is already tagged with this tag',
        })
      }

      // Create 'tagged_with' relation
      await ctx.db.insert(relations).values({
        fromObjectId: input.objectId,
        toObjectId: input.tagId,
        relationType: 'tagged_with',
        metadata: {},
      })

      return { success: true }
    }),

  // Untag an object (remove 'tagged_with' relation)
  untagObject: protectedProcedure
    .meta({
      description: 'Remove a tag from an object by deleting the "tagged_with" relation',
    })
    .input(
      z.object({
        objectId: z.string().uuid(),
        tagId: z.string().uuid(),
      })
    )
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db
        .delete(relations)
        .where(
          and(
            eq(relations.fromObjectId, input.objectId),
            eq(relations.toObjectId, input.tagId),
            eq(relations.relationType, 'tagged_with')
          )
        )

      return { success: true }
    }),

  // Get all objects with a specific tag
  objectsByTag: protectedProcedure
    .meta({
      description: 'Retrieve all non-archived objects that have been tagged with a specific tag',
    })
    .input(z.object({ tagId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      // Find all objects via 'tagged_with' relation
      const result = await ctx.db
        .select({ object: objects })
        .from(relations)
        .innerJoin(objects, eq(relations.fromObjectId, objects.id))
        .where(
          and(
            eq(relations.toObjectId, input.tagId),
            eq(relations.relationType, 'tagged_with'),
            eq(objects.archived, false) // Don't include archived objects
          )
        )
        .orderBy(desc(objects.createdAt))

      return result.map((row) => dbToBaseObject(row.object))
    }),

  // Get all tags for a specific object
  tagsForObject: protectedProcedure
    .meta({ description: 'Retrieve all tags that have been applied to a specific object' })
    .input(z.object({ objectId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      // Find all tags via 'tagged_with' relation
      const result = await ctx.db
        .select({ tag: objects })
        .from(relations)
        .innerJoin(objects, eq(relations.toObjectId, objects.id))
        .where(
          and(
            eq(relations.fromObjectId, input.objectId),
            eq(relations.relationType, 'tagged_with'),
            eq(objects.type, 'tag')
          )
        )
        .orderBy(desc(objects.createdAt))

      return result.map((row) => dbToBaseObject(row.tag) as z.infer<typeof TagSchema>)
    }),
})
