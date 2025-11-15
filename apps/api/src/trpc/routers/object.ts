import { router, publicProcedure } from '../init'
import { z } from 'zod'
import { BaseObjectSchema } from '@repo/schemas'
import { objects } from '@repo/database'
import { eq, desc, and } from 'drizzle-orm'

export const objectRouter = router({
  // Health check for object router
  ping: publicProcedure.query(() => {
    return { message: 'pong from object router' }
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

      const obj = result[0]
      return {
        id: obj.id,
        type: obj.type as any,
        title: obj.title,
        content: obj.content || '',
        properties: obj.properties as any,
        relations: [],
        metadata: {
          ...(obj.metadata as any),
          createdAt: obj.createdAt,
          updatedAt: obj.updatedAt,
        },
      }
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

      const mapped = results.map((obj) => ({
        id: obj.id,
        type: obj.type as any,
        title: obj.title,
        content: obj.content || '',
        properties: obj.properties as any,
        relations: [],
        metadata: {
          ...(obj.metadata as any),
          createdAt: obj.createdAt,
          updatedAt: obj.updatedAt,
        },
      }))

      return {
        objects: mapped,
        total: results.length,
        hasMore: results.length === input.limit,
      }
    }),
})
