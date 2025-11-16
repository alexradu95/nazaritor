/**
 * Query Executor Service
 *
 * Executes saved query objects to return filtered/sorted objects.
 * Phase 1: Basic object-type queries only (filter by type, properties, tags, dates)
 * Future: Search queries, tag queries, variable queries (context-aware)
 */

import { eq, and, desc, asc, gte, lte } from 'drizzle-orm'
import { objects, relations } from '@repo/database'
import type { Object as DbObject } from '@repo/database'
import type { Query } from '@repo/schemas'
import type { Context } from '../trpc/context'

// Helper to convert DB object to BaseObject
function dbToBaseObject(obj: DbObject) {
  const metadata = obj.metadata as Record<string, unknown> | undefined
  return {
    id: obj.id,
    type: obj.type,
    title: obj.title,
    content: obj.content || '',
    properties: obj.properties || {},
    archived: obj.archived,
    metadata: {
      ...(metadata || {}),
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
      tags: (metadata?.tags as unknown[]) || [],
      favorited: (metadata?.favorited as boolean) || false,
    },
  }
}

/**
 * Execute a query object and return matching results
 *
 * @param query - The query object to execute
 * @param db - Database instance
 * @returns Array of matching objects
 */
export async function executeQuery(
  query: Query,
  db: Context['db']
) {
  const { filters, sort, limit } = query.properties

  // Build WHERE conditions
  const conditions: any[] = []

  // Filter by object type
  if (filters?.objectType) {
    conditions.push(eq(objects.type, filters.objectType))
  }

  // Filter by archived status
  if (filters?.archived !== undefined) {
    conditions.push(eq(objects.archived, filters.archived))
  } else {
    // By default, exclude archived objects
    conditions.push(eq(objects.archived, false))
  }

  // Filter by date range (using virtual columns for efficiency)
  if (filters?.dateRange?.start) {
    const startDate = filters.dateRange.start instanceof Date
      ? filters.dateRange.start
      : new Date(filters.dateRange.start)
    conditions.push(gte(objects.createdAt, startDate))
  }
  if (filters?.dateRange?.end) {
    const endDate = filters.dateRange.end instanceof Date
      ? filters.dateRange.end
      : new Date(filters.dateRange.end)
    conditions.push(lte(objects.createdAt, endDate))
  }

  // Build base query
  let queryBuilder = db
    .select()
    .from(objects)
    .where(and(...conditions))

  // Apply sorting
  if (sort) {
    const sortField = objects[sort.field as keyof typeof objects]
    if (sortField) {
      queryBuilder = queryBuilder.orderBy(
        sort.order === 'asc' ? asc(sortField) : desc(sortField)
      ) as any
    }
  } else {
    // Default sort: newest first
    queryBuilder = queryBuilder.orderBy(desc(objects.createdAt)) as any
  }

  // Apply limit
  if (limit && limit > 0) {
    queryBuilder = queryBuilder.limit(limit) as any
  }

  // Execute query
  let results = await queryBuilder

  // Post-process filters (complex filters done in JS for simplicity)
  // In production, these should be moved to SQL for performance

  // Filter by property values
  if (filters?.properties) {
    results = results.filter((obj) => {
      for (const [key, value] of Object.entries(filters.properties!)) {
        const objProp = (obj.properties as any)?.[key]
        if (objProp === undefined) {
          return false
        }
        // Properties are stored as PropertyValueSchema: { type, value, config? }
        // Filter values are simple values, so compare against the .value field
        const objValue = objProp.value !== undefined ? objProp.value : objProp
        if (objValue !== value) {
          return false
        }
      }
      return true
    })
  }

  // Filter by tags (if object has relation to tag with matching name)
  if (filters?.tags && filters.tags.length > 0) {
    // For each object, check if it has the required tags
    // Note: This requires joining with relations table, which we'll do separately
    // For now, this is a simplified implementation - in production, use SQL JOIN
    const taggedObjectIds = new Set<string>()

    for (const tagName of filters.tags) {
      // Find tag object by name
      const tagObjects = await db
        .select()
        .from(objects)
        .where(and(eq(objects.type, 'tag'), eq(objects.title, tagName)))
        .limit(1)

      if (tagObjects.length > 0) {
        const tagId = tagObjects[0]!.id

        // Find all objects tagged with this tag
        const taggedObjects = await db
          .select({ objectId: relations.fromObjectId })
          .from(relations)
          .where(
            and(
              eq(relations.toObjectId, tagId),
              eq(relations.relationType, 'tagged_with')
            )
          )

        taggedObjects.forEach((row) => taggedObjectIds.add(row.objectId))
      }
    }

    // Filter results to only include tagged objects
    results = results.filter((obj) => taggedObjectIds.has(obj.id))
  }

  // Convert to BaseObject format
  return results.map(dbToBaseObject)
}

/**
 * Test a query without saving it
 * Same as executeQuery but takes raw filter/sort/limit params
 */
export async function testQuery(
  params: {
    filters?: Query['properties']['filters']
    sort?: Query['properties']['sort']
    limit?: Query['properties']['limit']
  },
  db: Context['db']
) {
  // Create temporary query object
  const tempQuery: Query = {
    id: 'temp',
    type: 'query',
    title: 'Temporary Query',
    content: '',
    properties: {
      queryType: 'object-type',
      filters: params.filters,
      sort: params.sort,
      limit: params.limit,
    },
    archived: false,
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      favorited: false,
    },
  }

  return executeQuery(tempQuery, db)
}
