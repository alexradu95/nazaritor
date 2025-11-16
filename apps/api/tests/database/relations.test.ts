import { describe, test, expect, beforeEach } from 'bun:test'
import { db, objects } from '@repo/database'
import {
  createRelation,
  findRelations,
  getRelatedObjectIds,
  deleteRelation,
  relationExists,
  relations,
} from '@repo/database'

// Helper to create a test object
async function createTestObject(title: string, type: string = 'project') {
  const [object] = await db
    .insert(objects)
    .values({
      type,
      title,
      content: '',
      properties: {},
      metadata: { tags: [] },
    })
    .returning()

  return object
}

describe('Relation Helpers', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await db.delete(relations)
    await db.delete(objects)
  })

  describe('createRelation', () => {
    test('should create a relation between two objects', async () => {
      const project = await createTestObject('Project A')
      const task = await createTestObject('Task 1', 'task')

      const relation = await createRelation({
        fromObjectId: project.id,
        toObjectId: task.id,
        relationType: 'parent_of',
      })

      expect(relation).toBeDefined()
      expect(relation.id).toBeDefined()
      expect(relation.fromObjectId).toBe(project.id)
      expect(relation.toObjectId).toBe(task.id)
      expect(relation.relationType).toBe('parent_of')
      expect(relation.metadata).toEqual({})
      expect(relation.createdAt).toBeInstanceOf(Date)
    })

    test('should create a relation with metadata', async () => {
      const person = await createTestObject('Alice', 'person')
      const task = await createTestObject('Task 1', 'task')

      const relation = await createRelation({
        fromObjectId: task.id,
        toObjectId: person.id,
        relationType: 'assigned_to',
        metadata: { role: 'developer', hours: 10 },
      })

      expect(relation.metadata).toEqual({ role: 'developer', hours: 10 })
    })
  })

  describe('findRelations', () => {
    test('should find relations from an object', async () => {
      const project = await createTestObject('Project A')
      const task1 = await createTestObject('Task 1', 'task')
      const task2 = await createTestObject('Task 2', 'task')

      await createRelation({
        fromObjectId: project.id,
        toObjectId: task1.id,
        relationType: 'parent_of',
      })

      await createRelation({
        fromObjectId: project.id,
        toObjectId: task2.id,
        relationType: 'parent_of',
      })

      const foundRelations = await findRelations({
        objectId: project.id,
        direction: 'from',
      })

      expect(foundRelations).toHaveLength(2)
      expect(foundRelations.every((r) => r.fromObjectId === project.id)).toBe(true)
    })

    test('should find relations to an object', async () => {
      const task = await createTestObject('Task 1', 'task')
      const project1 = await createTestObject('Project A')
      const project2 = await createTestObject('Project B')

      await createRelation({
        fromObjectId: project1.id,
        toObjectId: task.id,
        relationType: 'parent_of',
      })

      await createRelation({
        fromObjectId: project2.id,
        toObjectId: task.id,
        relationType: 'parent_of',
      })

      const foundRelations = await findRelations({
        objectId: task.id,
        direction: 'to',
      })

      expect(foundRelations).toHaveLength(2)
      expect(foundRelations.every((r) => r.toObjectId === task.id)).toBe(true)
    })

    test('should find relations in both directions', async () => {
      const person = await createTestObject('Alice', 'person')
      const task = await createTestObject('Task 1', 'task')
      const project = await createTestObject('Project A')

      await createRelation({
        fromObjectId: person.id,
        toObjectId: task.id,
        relationType: 'assigned_to',
      })

      await createRelation({
        fromObjectId: project.id,
        toObjectId: person.id,
        relationType: 'member_of',
      })

      const foundRelations = await findRelations({
        objectId: person.id,
        direction: 'both',
      })

      expect(foundRelations).toHaveLength(2)
    })

    test('should filter relations by type', async () => {
      const project = await createTestObject('Project A')
      const task = await createTestObject('Task 1', 'task')
      const resource = await createTestObject('Resource 1', 'resource')

      await createRelation({
        fromObjectId: project.id,
        toObjectId: task.id,
        relationType: 'parent_of',
      })

      await createRelation({
        fromObjectId: project.id,
        toObjectId: resource.id,
        relationType: 'references',
      })

      const parentRelations = await findRelations({
        objectId: project.id,
        relationType: 'parent_of',
        direction: 'from',
      })

      expect(parentRelations).toHaveLength(1)
      expect(parentRelations[0].relationType).toBe('parent_of')
      expect(parentRelations[0].toObjectId).toBe(task.id)
    })

    test('should return empty array when no relations found', async () => {
      const project = await createTestObject('Project A')

      const foundRelations = await findRelations({
        objectId: project.id,
      })

      expect(foundRelations).toEqual([])
    })
  })

  describe('getRelatedObjectIds', () => {
    test('should get IDs of objects related from the given object', async () => {
      const project = await createTestObject('Project A')
      const task1 = await createTestObject('Task 1', 'task')
      const task2 = await createTestObject('Task 2', 'task')

      await createRelation({
        fromObjectId: project.id,
        toObjectId: task1.id,
        relationType: 'parent_of',
      })

      await createRelation({
        fromObjectId: project.id,
        toObjectId: task2.id,
        relationType: 'parent_of',
      })

      const relatedIds = await getRelatedObjectIds({
        objectId: project.id,
        direction: 'from',
      })

      expect(relatedIds).toHaveLength(2)
      expect(relatedIds).toContain(task1.id)
      expect(relatedIds).toContain(task2.id)
    })

    test('should get IDs of objects related to the given object', async () => {
      const task = await createTestObject('Task 1', 'task')
      const person1 = await createTestObject('Alice', 'person')
      const person2 = await createTestObject('Bob', 'person')

      await createRelation({
        fromObjectId: person1.id,
        toObjectId: task.id,
        relationType: 'assigned_to',
      })

      await createRelation({
        fromObjectId: person2.id,
        toObjectId: task.id,
        relationType: 'assigned_to',
      })

      const relatedIds = await getRelatedObjectIds({
        objectId: task.id,
        direction: 'to',
      })

      expect(relatedIds).toHaveLength(2)
      expect(relatedIds).toContain(person1.id)
      expect(relatedIds).toContain(person2.id)
    })

    test('should get IDs of objects related in both directions', async () => {
      const person = await createTestObject('Alice', 'person')
      const task = await createTestObject('Task 1', 'task')
      const project = await createTestObject('Project A')

      await createRelation({
        fromObjectId: person.id,
        toObjectId: task.id,
        relationType: 'assigned_to',
      })

      await createRelation({
        fromObjectId: project.id,
        toObjectId: person.id,
        relationType: 'member_of',
      })

      const relatedIds = await getRelatedObjectIds({
        objectId: person.id,
        direction: 'both',
      })

      expect(relatedIds).toHaveLength(2)
      expect(relatedIds).toContain(task.id)
      expect(relatedIds).toContain(project.id)
    })
  })

  describe('deleteRelation', () => {
    test('should delete a relation by ID', async () => {
      const project = await createTestObject('Project A')
      const task = await createTestObject('Task 1', 'task')

      const relation = await createRelation({
        fromObjectId: project.id,
        toObjectId: task.id,
        relationType: 'parent_of',
      })

      await deleteRelation({ id: relation.id })

      const foundRelations = await findRelations({ objectId: project.id })
      expect(foundRelations).toHaveLength(0)
    })

    test('should delete relations by fromObjectId', async () => {
      const project = await createTestObject('Project A')
      const task1 = await createTestObject('Task 1', 'task')
      const task2 = await createTestObject('Task 2', 'task')

      await createRelation({
        fromObjectId: project.id,
        toObjectId: task1.id,
        relationType: 'parent_of',
      })

      await createRelation({
        fromObjectId: project.id,
        toObjectId: task2.id,
        relationType: 'parent_of',
      })

      await deleteRelation({ fromObjectId: project.id })

      const foundRelations = await findRelations({ objectId: project.id })
      expect(foundRelations).toHaveLength(0)
    })

    test('should delete relations by toObjectId', async () => {
      const task = await createTestObject('Task 1', 'task')
      const project1 = await createTestObject('Project A')
      const project2 = await createTestObject('Project B')

      await createRelation({
        fromObjectId: project1.id,
        toObjectId: task.id,
        relationType: 'parent_of',
      })

      await createRelation({
        fromObjectId: project2.id,
        toObjectId: task.id,
        relationType: 'parent_of',
      })

      await deleteRelation({ toObjectId: task.id })

      const foundRelations = await findRelations({ objectId: task.id })
      expect(foundRelations).toHaveLength(0)
    })

    test('should delete relations by relationType', async () => {
      const project = await createTestObject('Project A')
      const task = await createTestObject('Task 1', 'task')
      const resource = await createTestObject('Resource 1', 'resource')

      await createRelation({
        fromObjectId: project.id,
        toObjectId: task.id,
        relationType: 'parent_of',
      })

      await createRelation({
        fromObjectId: project.id,
        toObjectId: resource.id,
        relationType: 'references',
      })

      await deleteRelation({
        fromObjectId: project.id,
        relationType: 'parent_of',
      })

      const foundRelations = await findRelations({ objectId: project.id })
      expect(foundRelations).toHaveLength(1)
      expect(foundRelations[0].relationType).toBe('references')
    })

    test('should fail when no deletion criteria provided', async () => {
      await expect(deleteRelation({})).rejects.toThrow(
        'Must provide at least one deletion criteria'
      )
    })
  })

  describe('relationExists', () => {
    test('should return true when relation exists', async () => {
      const project = await createTestObject('Project A')
      const task = await createTestObject('Task 1', 'task')

      await createRelation({
        fromObjectId: project.id,
        toObjectId: task.id,
        relationType: 'parent_of',
      })

      const exists = await relationExists({
        fromObjectId: project.id,
        toObjectId: task.id,
        relationType: 'parent_of',
      })

      expect(exists).toBe(true)
    })

    test('should return false when relation does not exist', async () => {
      const project = await createTestObject('Project A')
      const task = await createTestObject('Task 1', 'task')

      const exists = await relationExists({
        fromObjectId: project.id,
        toObjectId: task.id,
        relationType: 'parent_of',
      })

      expect(exists).toBe(false)
    })

    test('should return false for wrong relation type', async () => {
      const project = await createTestObject('Project A')
      const task = await createTestObject('Task 1', 'task')

      await createRelation({
        fromObjectId: project.id,
        toObjectId: task.id,
        relationType: 'parent_of',
      })

      const exists = await relationExists({
        fromObjectId: project.id,
        toObjectId: task.id,
        relationType: 'references',
      })

      expect(exists).toBe(false)
    })
  })
})
