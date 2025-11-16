/**
 * Database Helper Functions
 *
 * Shared utilities for converting database objects to schema types
 */

import type { Object as DbObject } from '@repo/database'

/**
 * Convert database object to BaseObject format
 * Handles metadata typing and ensures all required fields are present
 */
export function dbToBaseObject(obj: DbObject): any {
  const metadata = obj.metadata as Record<string, unknown> | undefined

  return {
    id: obj.id,
    type: obj.type,
    title: obj.title,
    content: obj.content || '',
    properties: obj.properties || {},
    archived: obj.archived,
    relations: [], // Relations are fetched separately
    metadata: {
      ...(metadata || {}),
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
      tags: (metadata?.tags as string[]) || [],
      favorited: (metadata?.favorited as boolean) || false,
    },
  }
}
