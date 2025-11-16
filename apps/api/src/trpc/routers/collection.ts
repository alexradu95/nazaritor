/**
 * Collection Router
 *
 * Handles collection object CRUD and membership operations.
 * Collections group objects within the same type (e.g., "Work Projects" groups project objects).
 * Objects join collections via 'member_of' relations (can belong to multiple collections).
 */

import { router } from '../init'
import { protectedProcedure } from '../middleware/errorHandler'
import { z } from 'zod'
import { CollectionSchema, BaseObjectSchema } from '@repo/schemas'
import { objects, relations } from '@repo/database'
import type { Object as DbObject } from '@repo/database'
import { eq, and, desc } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'

// Helper to convert DB object to BaseObject
function dbToBaseObject(obj: DbObject) {
  return {
    id: obj.id,
    type: obj.type,
    title: obj.title,
    content: obj.content || '',
    properties: obj.properties || {},
    archived: obj.archived,
    metadata: {
      ...(obj.metadata || {}),
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
      tags: obj.metadata?.tags || [],
      favorited: obj.metadata?.favorited || false,
    },
  }
}

export const collectionRouter = router({
  // Create a new collection
  create: protectedProcedure
    .input(CollectionSchema.omit({ id: true, metadata: true, type: true }))
    .output(CollectionSchema)
    .mutation(async ({ input, ctx }) => {
      const now = new Date()

      const result = await ctx.db
        .insert(objects)
        .values({
          type: 'collection',
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
          message: 'Failed to create collection',
        })
      }

      return dbToBaseObject(result[0]) as z.infer<typeof CollectionSchema>
    }),

  // List all collections (optionally filter by object type)
  list: protectedProcedure
    .input(
      z
        .object({
          objectType: z.string().optional(), // Filter by which object type this collection is for
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const conditions = [eq(objects.type, 'collection'), eq(objects.archived, false)]

      // If objectType filter provided, check properties.objectType
      // Note: This is not efficient without an index on JSON field
      // Consider denormalizing if performance becomes an issue

      const result = await ctx.db
        .select()
        .from(objects)
        .where(and(...conditions))
        .orderBy(desc(objects.createdAt))

      // Filter by objectType in JS if provided (since SQL JSON filtering is complex)
      let collections = result.map((obj) => dbToBaseObject(obj) as z.infer<typeof CollectionSchema>)

      if (input?.objectType) {
        collections = collections.filter(
          (c) => c.properties.objectType === input.objectType
        )
      }

      return collections
    }),

  // Get collection by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .output(CollectionSchema.nullable())
    .query(async ({ input, ctx }) => {
      const result = await ctx.db
        .select()
        .from(objects)
        .where(and(eq(objects.id, input.id), eq(objects.type, 'collection')))
        .limit(1)

      if (result.length === 0) return null

      return dbToBaseObject(result[0]) as z.infer<typeof CollectionSchema>
    }),

  // Add object to collection (create 'member_of' relation)
  addObject: protectedProcedure
    .input(
      z.object({
        objectId: z.string().uuid(),
        collectionId: z.string().uuid(),
      })
    )
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      // Verify both objects exist
      const [targetObject, collectionObject] = await Promise.all([
        ctx.db
          .select()
          .from(objects)
          .where(eq(objects.id, input.objectId))
          .limit(1),
        ctx.db
          .select()
          .from(objects)
          .where(and(eq(objects.id, input.collectionId), eq(objects.type, 'collection')))
          .limit(1),
      ])

      if (targetObject.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Object with ID ${input.objectId} not found`,
        })
      }

      if (collectionObject.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Collection with ID ${input.collectionId} not found`,
        })
      }

      // Validate object type matches collection's objectType
      const collection = dbToBaseObject(collectionObject[0]) as z.infer<typeof CollectionSchema>
      const targetObj = dbToBaseObject(targetObject[0])

      if (collection.properties.objectType !== targetObj.type) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Object type ${targetObj.type} does not match collection's objectType ${collection.properties.objectType}`,
        })
      }

      // Check if relation already exists
      const existing = await ctx.db
        .select()
        .from(relations)
        .where(
          and(
            eq(relations.fromObjectId, input.objectId),
            eq(relations.toObjectId, input.collectionId),
            eq(relations.relationType, 'member_of')
          )
        )
        .limit(1)

      if (existing.length > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Object is already in this collection',
        })
      }

      // Create 'member_of' relation
      await ctx.db.insert(relations).values({
        fromObjectId: input.objectId,
        toObjectId: input.collectionId,
        relationType: 'member_of',
        metadata: {},
      })

      return { success: true }
    }),

  // Remove object from collection
  removeObject: protectedProcedure
    .input(
      z.object({
        objectId: z.string().uuid(),
        collectionId: z.string().uuid(),
      })
    )
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db
        .delete(relations)
        .where(
          and(
            eq(relations.fromObjectId, input.objectId),
            eq(relations.toObjectId, input.collectionId),
            eq(relations.relationType, 'member_of')
          )
        )

      return { success: true }
    }),

  // Get all objects in a collection
  objectsInCollection: protectedProcedure
    .input(z.object({ collectionId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      // Find all objects via 'member_of' relation
      const result = await ctx.db
        .select({ object: objects })
        .from(relations)
        .innerJoin(objects, eq(relations.fromObjectId, objects.id))
        .where(
          and(
            eq(relations.toObjectId, input.collectionId),
            eq(relations.relationType, 'member_of'),
            eq(objects.archived, false) // Don't include archived objects
          )
        )
        .orderBy(desc(objects.createdAt))

      return result.map((row) => dbToBaseObject(row.object))
    }),

  // Get all collections for a specific object
  collectionsForObject: protectedProcedure
    .input(z.object({ objectId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      // Find all collections via 'member_of' relation
      const result = await ctx.db
        .select({ collection: objects })
        .from(relations)
        .innerJoin(objects, eq(relations.toObjectId, objects.id))
        .where(
          and(
            eq(relations.fromObjectId, input.objectId),
            eq(relations.relationType, 'member_of'),
            eq(objects.type, 'collection')
          )
        )
        .orderBy(desc(objects.createdAt))

      return result.map((row) => dbToBaseObject(row.collection) as z.infer<typeof CollectionSchema>)
    }),
})
