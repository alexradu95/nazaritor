import { db } from './client'
import { relations } from './schema/relations'
import { eq, and, or } from 'drizzle-orm'
import type { Relation, NewRelation } from './schema/relations'

// Relation helper types
export type RelationType =
  | 'parent_of'
  | 'child_of'
  | 'blocks'
  | 'blocked_by'
  | 'relates_to'
  | 'assigned_to'
  | 'member_of'
  | 'references'
  | 'contains'
  | 'attends'
  | 'knows'

export type CreateRelationOptions = {
  fromObjectId: string
  toObjectId: string
  relationType: RelationType
  metadata?: Record<string, unknown>
}

export type FindRelationsOptions = {
  objectId: string
  relationType?: RelationType
  direction?: 'from' | 'to' | 'both'
}

export type DeleteRelationOptions = {
  id?: string
  fromObjectId?: string
  toObjectId?: string
  relationType?: RelationType
}

// Create a new relation between two objects
export const createRelation = async (
  options: CreateRelationOptions
): Promise<Relation> => {
  const { fromObjectId, toObjectId, relationType, metadata = {} } = options

  const newRelation: NewRelation = {
    fromObjectId,
    toObjectId,
    relationType,
    metadata,
  }

  const [relation] = await db.insert(relations).values(newRelation).returning()

  return relation
}

// Find relations for an object
export const findRelations = async (
  options: FindRelationsOptions
): Promise<Relation[]> => {
  const { objectId, relationType, direction = 'both' } = options

  // Build where clause based on direction
  const whereClause = (() => {
    if (direction === 'from') {
      return relationType
        ? and(eq(relations.fromObjectId, objectId), eq(relations.relationType, relationType))
        : eq(relations.fromObjectId, objectId)
    }

    if (direction === 'to') {
      return relationType
        ? and(eq(relations.toObjectId, objectId), eq(relations.relationType, relationType))
        : eq(relations.toObjectId, objectId)
    }

    // direction === 'both'
    const fromCondition = relationType
      ? and(eq(relations.fromObjectId, objectId), eq(relations.relationType, relationType))
      : eq(relations.fromObjectId, objectId)

    const toCondition = relationType
      ? and(eq(relations.toObjectId, objectId), eq(relations.relationType, relationType))
      : eq(relations.toObjectId, objectId)

    return or(fromCondition, toCondition)
  })()

  return db.select().from(relations).where(whereClause)
}

// Get related object IDs from relations
export const getRelatedObjectIds = async (
  options: FindRelationsOptions
): Promise<string[]> => {
  const { objectId, direction = 'both' } = options
  const foundRelations = await findRelations(options)

  return foundRelations.map((relation) => {
    if (direction === 'from') return relation.toObjectId
    if (direction === 'to') return relation.fromObjectId

    // direction === 'both' - return the other object ID
    return relation.fromObjectId === objectId
      ? relation.toObjectId
      : relation.fromObjectId
  })
}

// Delete relations
export const deleteRelation = async (
  options: DeleteRelationOptions
): Promise<void> => {
  const { id, fromObjectId, toObjectId, relationType } = options

  if (id) {
    await db.delete(relations).where(eq(relations.id, id))
    return
  }

  // Build where clause for other options
  const conditions = [
    fromObjectId ? eq(relations.fromObjectId, fromObjectId) : undefined,
    toObjectId ? eq(relations.toObjectId, toObjectId) : undefined,
    relationType ? eq(relations.relationType, relationType) : undefined,
  ].filter((condition): condition is NonNullable<typeof condition> => condition !== undefined)

  if (conditions.length === 0) {
    throw new Error('Must provide at least one deletion criteria')
  }

  const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions)

  await db.delete(relations).where(whereClause)
}

// Check if a relation exists
export const relationExists = async (
  options: Omit<CreateRelationOptions, 'metadata'>
): Promise<boolean> => {
  const { fromObjectId, toObjectId, relationType } = options

  const [relation] = await db
    .select()
    .from(relations)
    .where(
      and(
        eq(relations.fromObjectId, fromObjectId),
        eq(relations.toObjectId, toObjectId),
        eq(relations.relationType, relationType)
      )
    )
    .limit(1)

  return relation !== undefined
}
