import { describe, test, expect, beforeEach } from 'bun:test'
import { db, objects, relations, createRelation } from '@repo/database'

describe('Database Constraints', () => {
  beforeEach(async () => {
    await db.delete(relations)
    await db.delete(objects)
  })

  describe('Objects table constraints', () => {
    test('should reject invalid object type', async () => {
      await expect(async () => {
        await db.insert(objects).values({
          type: 'invalid-type' as any,
          title: 'Test',
          content: '',
          properties: {},
          metadata: { tags: [] },
        })
      }).toThrow()
    })

    test('should reject empty title', async () => {
      await expect(async () => {
        await db.insert(objects).values({
          type: 'project',
          title: '   ', // whitespace only
          content: '',
          properties: {},
          metadata: { tags: [] },
        })
      }).toThrow()
    })

    test('should accept valid object', async () => {
      const [result] = await db
        .insert(objects)
        .values({
          type: 'project',
          title: 'Valid Project',
          content: 'Content',
          properties: {},
          metadata: { tags: [] },
        })
        .returning()

      expect(result).toBeDefined()
      expect(result.type).toBe('project')
    })
  })

  describe('Relations table constraints', () => {
    test('should reject invalid relation type', async () => {
      const [obj1] = await db
        .insert(objects)
        .values({
          type: 'project',
          title: 'Project',
          content: '',
          properties: {},
          metadata: { tags: [] },
        })
        .returning()

      const [obj2] = await db
        .insert(objects)
        .values({
          type: 'task',
          title: 'Task',
          content: '',
          properties: {},
          metadata: { tags: [] },
        })
        .returning()

      await expect(async () => {
        await createRelation({
          fromObjectId: obj1.id,
          toObjectId: obj2.id,
          relationType: 'invalid-type' as any,
        })
      }).toThrow()
    })

    test('should reject self-relation', async () => {
      const [obj] = await db
        .insert(objects)
        .values({
          type: 'project',
          title: 'Project',
          content: '',
          properties: {},
          metadata: { tags: [] },
        })
        .returning()

      await expect(async () => {
        await createRelation({
          fromObjectId: obj.id,
          toObjectId: obj.id, // same object
          relationType: 'relates_to',
        })
      }).toThrow()
    })

    test('should accept valid relation', async () => {
      const [obj1] = await db
        .insert(objects)
        .values({
          type: 'project',
          title: 'Project',
          content: '',
          properties: {},
          metadata: { tags: [] },
        })
        .returning()

      const [obj2] = await db
        .insert(objects)
        .values({
          type: 'task',
          title: 'Task',
          content: '',
          properties: {},
          metadata: { tags: [] },
        })
        .returning()

      const relation = await createRelation({
        fromObjectId: obj1.id,
        toObjectId: obj2.id,
        relationType: 'parent_of',
      })

      expect(relation).toBeDefined()
      expect(relation.relationType).toBe('parent_of')
    })
  })
})
