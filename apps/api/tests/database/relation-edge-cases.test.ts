import { describe, test, expect, beforeEach } from 'bun:test'
import { db, objects, relations } from '@repo/database'
import {
  createRelation,
  findRelations,
  getRelatedObjectIds,
  deleteRelation,
  relationExists,
} from '@repo/database'

// Helper to create test objects
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

describe('Relation System - Edge Cases', () => {
  beforeEach(async () => {
    await db.delete(relations)
    await db.delete(objects)
  })

  describe('Relation Type Validation', () => {
    test('should accept all 11 valid relation types', async () => {
      const obj1 = await createTestObject('Object 1')
      const obj2 = await createTestObject('Object 2')

      const validTypes = [
        'parent_of',
        'child_of',
        'blocks',
        'blocked_by',
        'relates_to',
        'assigned_to',
        'member_of',
        'references',
        'contains',
        'attends',
        'knows',
      ] as const

      for (const relationType of validTypes) {
        const relation = await createRelation({
          fromObjectId: obj1.id,
          toObjectId: obj2.id,
          relationType,
        })
        expect(relation.relationType).toBe(relationType)

        // Clean up for next iteration
        await db.delete(relations).where()
      }
    })

    test('should reject invalid relation type', async () => {
      const obj1 = await createTestObject('Object 1')
      const obj2 = await createTestObject('Object 2')

      await expect(async () => {
        await createRelation({
          fromObjectId: obj1.id,
          toObjectId: obj2.id,
          relationType: 'invalid_type' as any,
        })
      }).toThrow()
    })

    test('should reject kebab-case relation types (old format)', async () => {
      const obj1 = await createTestObject('Object 1')
      const obj2 = await createTestObject('Object 2')

      await expect(async () => {
        await createRelation({
          fromObjectId: obj1.id,
          toObjectId: obj2.id,
          relationType: 'parent-of' as any, // Old kebab-case format
        })
      }).toThrow()
    })
  })

  describe('Self-Relation Prevention', () => {
    test('should prevent object from relating to itself', async () => {
      const obj = await createTestObject('Self Object')

      await expect(async () => {
        await createRelation({
          fromObjectId: obj.id,
          toObjectId: obj.id, // Same object
          relationType: 'relates_to',
        })
      }).toThrow()
    })
  })

  describe('Cascading Deletes', () => {
    test('should delete relations when fromObject is deleted', async () => {
      const project = await createTestObject('Project')
      const task = await createTestObject('Task', 'task')

      await createRelation({
        fromObjectId: project.id,
        toObjectId: task.id,
        relationType: 'parent_of',
      })

      // Verify relation exists
      const relsBefore = await findRelations({ objectId: project.id })
      expect(relsBefore).toHaveLength(1)

      // Delete project
      await db.delete(objects).where()

      // Verify relation was cascaded
      const relsAfter = await db.select().from(relations)
      expect(relsAfter).toHaveLength(0)
    })

    test('should delete relations when toObject is deleted', async () => {
      const project = await createTestObject('Project')
      const task = await createTestObject('Task', 'task')

      await createRelation({
        fromObjectId: project.id,
        toObjectId: task.id,
        relationType: 'parent_of',
      })

      // Delete task
      await db.delete(objects).where()

      // Verify relation was cascaded
      const relsAfter = await db.select().from(relations)
      expect(relsAfter).toHaveLength(0)
    })
  })

  describe('Bidirectional Relations', () => {
    test('should allow creating inverse relations', async () => {
      const parent = await createTestObject('Parent Task', 'task')
      const child = await createTestObject('Child Task', 'task')

      // Create both directions
      const parentOf = await createRelation({
        fromObjectId: parent.id,
        toObjectId: child.id,
        relationType: 'parent_of',
      })

      const childOf = await createRelation({
        fromObjectId: child.id,
        toObjectId: parent.id,
        relationType: 'child_of',
      })

      expect(parentOf.relationType).toBe('parent_of')
      expect(childOf.relationType).toBe('child_of')
    })

    test('should find relations in both directions', async () => {
      const a = await createTestObject('Object A')
      const b = await createTestObject('Object B')

      await createRelation({
        fromObjectId: a.id,
        toObjectId: b.id,
        relationType: 'relates_to',
      })

      await createRelation({
        fromObjectId: b.id,
        toObjectId: a.id,
        relationType: 'relates_to',
      })

      const fromA = await findRelations({
        objectId: a.id,
        direction: 'from',
      })
      expect(fromA).toHaveLength(1)

      const toA = await findRelations({
        objectId: a.id,
        direction: 'to',
      })
      expect(toA).toHaveLength(1)

      const both = await findRelations({
        objectId: a.id,
        direction: 'both',
      })
      expect(both).toHaveLength(2)
    })
  })

  describe('Complex Relation Networks', () => {
    test('should handle many-to-one relations', async () => {
      const project = await createTestObject('Project')
      const tasks = []

      // Create 10 tasks all related to the same project
      for (let i = 0; i < 10; i++) {
        const task = await createTestObject(`Task ${i}`, 'task')
        tasks.push(task)

        await createRelation({
          fromObjectId: project.id,
          toObjectId: task.id,
          relationType: 'parent_of',
        })
      }

      const projectRelations = await findRelations({
        objectId: project.id,
        direction: 'from',
      })

      expect(projectRelations).toHaveLength(10)
    })

    test('should handle one-to-many relations', async () => {
      const task = await createTestObject('Task', 'task')
      const projects = []

      // Create 5 projects that all reference the same task
      for (let i = 0; i < 5; i++) {
        const project = await createTestObject(`Project ${i}`)
        projects.push(project)

        await createRelation({
          fromObjectId: project.id,
          toObjectId: task.id,
          relationType: 'contains',
        })
      }

      const taskRelations = await findRelations({
        objectId: task.id,
        direction: 'to',
      })

      expect(taskRelations).toHaveLength(5)
    })

    test('should handle many-to-many relations', async () => {
      const tasks = []
      const people = []

      // Create 3 tasks and 3 people
      for (let i = 0; i < 3; i++) {
        tasks.push(await createTestObject(`Task ${i}`, 'task'))
        people.push(await createTestObject(`Person ${i}`, 'person'))
      }

      // Assign each task to each person (9 relations)
      for (const task of tasks) {
        for (const person of people) {
          await createRelation({
            fromObjectId: task.id,
            toObjectId: person.id,
            relationType: 'assigned_to',
          })
        }
      }

      // Verify each task has 3 assignees
      for (const task of tasks) {
        const assignees = await findRelations({
          objectId: task.id,
          relationType: 'assigned_to',
          direction: 'from',
        })
        expect(assignees).toHaveLength(3)
      }

      // Verify each person has 3 tasks
      for (const person of people) {
        const assignedTasks = await findRelations({
          objectId: person.id,
          relationType: 'assigned_to',
          direction: 'to',
        })
        expect(assignedTasks).toHaveLength(3)
      }
    })
  })

  describe('Relation Metadata', () => {
    test('should store and retrieve metadata', async () => {
      const project = await createTestObject('Project')
      const person = await createTestObject('Person', 'person')

      const relation = await createRelation({
        fromObjectId: project.id,
        toObjectId: person.id,
        relationType: 'member_of',
        metadata: {
          role: 'lead',
          since: '2024-01-01',
          hours: 40,
        },
      })

      expect(relation.metadata).toEqual({
        role: 'lead',
        since: '2024-01-01',
        hours: 40,
      })
    })

    test('should accept empty metadata', async () => {
      const obj1 = await createTestObject('Object 1')
      const obj2 = await createTestObject('Object 2')

      const relation = await createRelation({
        fromObjectId: obj1.id,
        toObjectId: obj2.id,
        relationType: 'relates_to',
        metadata: {},
      })

      expect(relation.metadata).toEqual({})
    })

    test('should default to empty metadata when omitted', async () => {
      const obj1 = await createTestObject('Object 1')
      const obj2 = await createTestObject('Object 2')

      const relation = await createRelation({
        fromObjectId: obj1.id,
        toObjectId: obj2.id,
        relationType: 'relates_to',
      })

      expect(relation.metadata).toEqual({})
    })

    test('should allow nested metadata objects', async () => {
      const obj1 = await createTestObject('Object 1')
      const obj2 = await createTestObject('Object 2')

      const relation = await createRelation({
        fromObjectId: obj1.id,
        toObjectId: obj2.id,
        relationType: 'relates_to',
        metadata: {
          details: {
            nested: {
              value: 'deep',
            },
          },
          array: [1, 2, 3],
        },
      })

      expect(relation.metadata).toMatchObject({
        details: {
          nested: {
            value: 'deep',
          },
        },
        array: [1, 2, 3],
      })
    })
  })

  describe('Query Performance with Large Datasets', () => {
    test('should efficiently find relations with 100+ relations', async () => {
      const project = await createTestObject('Large Project')
      const taskIds = []

      // Create 100 related tasks
      for (let i = 0; i < 100; i++) {
        const task = await createTestObject(`Task ${i}`, 'task')
        taskIds.push(task.id)

        await createRelation({
          fromObjectId: project.id,
          toObjectId: task.id,
          relationType: 'parent_of',
        })
      }

      const start = performance.now()
      const relations = await findRelations({
        objectId: project.id,
        direction: 'from',
      })
      const duration = performance.now() - start

      expect(relations).toHaveLength(100)
      expect(duration).toBeLessThan(100) // Should complete in < 100ms
    })
  })

  describe('Edge Case: Multiple Relations Same Type', () => {
    test('should allow multiple relations of same type between objects', async () => {
      const page1 = await createTestObject('Page 1', 'page')
      const page2 = await createTestObject('Page 2', 'page')

      // Create two "references" relations
      const ref1 = await createRelation({
        fromObjectId: page1.id,
        toObjectId: page2.id,
        relationType: 'references',
        metadata: { context: 'introduction' },
      })

      const ref2 = await createRelation({
        fromObjectId: page1.id,
        toObjectId: page2.id,
        relationType: 'references',
        metadata: { context: 'conclusion' },
      })

      const found = await findRelations({
        objectId: page1.id,
        relationType: 'references',
        direction: 'from',
      })

      expect(found).toHaveLength(2)
      expect(found.map(r => r.metadata)).toContainEqual({ context: 'introduction' })
      expect(found.map(r => r.metadata)).toContainEqual({ context: 'conclusion' })
    })
  })

  describe('relationExists Helper', () => {
    test('should correctly identify existing relation', async () => {
      const obj1 = await createTestObject('Object 1')
      const obj2 = await createTestObject('Object 2')

      await createRelation({
        fromObjectId: obj1.id,
        toObjectId: obj2.id,
        relationType: 'relates_to',
      })

      const exists = await relationExists({
        fromObjectId: obj1.id,
        toObjectId: obj2.id,
        relationType: 'relates_to',
      })

      expect(exists).toBe(true)
    })

    test('should return false for non-existent relation', async () => {
      const obj1 = await createTestObject('Object 1')
      const obj2 = await createTestObject('Object 2')

      const exists = await relationExists({
        fromObjectId: obj1.id,
        toObjectId: obj2.id,
        relationType: 'relates_to',
      })

      expect(exists).toBe(false)
    })

    test('should distinguish relation types', async () => {
      const obj1 = await createTestObject('Object 1')
      const obj2 = await createTestObject('Object 2')

      await createRelation({
        fromObjectId: obj1.id,
        toObjectId: obj2.id,
        relationType: 'blocks',
      })

      const blocksExists = await relationExists({
        fromObjectId: obj1.id,
        toObjectId: obj2.id,
        relationType: 'blocks',
      })

      const referencesExists = await relationExists({
        fromObjectId: obj1.id,
        toObjectId: obj2.id,
        relationType: 'references',
      })

      expect(blocksExists).toBe(true)
      expect(referencesExists).toBe(false)
    })

    test('should distinguish relation directions', async () => {
      const obj1 = await createTestObject('Object 1')
      const obj2 = await createTestObject('Object 2')

      await createRelation({
        fromObjectId: obj1.id,
        toObjectId: obj2.id,
        relationType: 'relates_to',
      })

      const forward = await relationExists({
        fromObjectId: obj1.id,
        toObjectId: obj2.id,
        relationType: 'relates_to',
      })

      const reverse = await relationExists({
        fromObjectId: obj2.id,
        toObjectId: obj1.id,
        relationType: 'relates_to',
      })

      expect(forward).toBe(true)
      expect(reverse).toBe(false)
    })
  })

  describe('getRelatedObjectIds Helper', () => {
    test('should return only IDs, not full relation objects', async () => {
      const project = await createTestObject('Project')
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

      const ids = await getRelatedObjectIds({
        objectId: project.id,
        direction: 'from',
      })

      expect(ids).toHaveLength(2)
      expect(ids).toContain(task1.id)
      expect(ids).toContain(task2.id)
      expect(typeof ids[0]).toBe('string')
    })
  })
})
