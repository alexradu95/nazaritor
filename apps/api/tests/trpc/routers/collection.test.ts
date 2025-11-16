/**
 * Collection Router Tests
 *
 * Tests collection CRUD operations and membership functionality
 */

import { describe, it, expect, beforeAll } from 'bun:test'
import { appRouter } from '../../../src/trpc/router'
import { db, objects, relations } from '@repo/database'
import { eq, and } from 'drizzle-orm'
import type { Context } from '../../../src/trpc/context'

describe('Collection Router', () => {
  let caller: ReturnType<typeof appRouter.createCaller>
  let ctx: Context

  beforeAll(() => {
    ctx = { db } as Context
    caller = appRouter.createCaller(ctx)
  })

  describe('Collection CRUD', () => {
    it('should create a collection with objectType', async () => {
      const collection = await caller.collection.create({
        title: 'Work Projects',
        content: 'All work-related projects',
        properties: {
          objectType: 'project',
          icon: '💼',
          color: '#3498DB',
          description: 'Projects for work',
        },
      })

      expect(collection).toMatchObject({
        type: 'collection',
        title: 'Work Projects',
        content: 'All work-related projects',
        properties: {
          objectType: 'project',
          icon: '💼',
          color: '#3498DB',
        },
        archived: false,
      })
      expect(collection.id).toBeDefined()
    })

    it('should create a collection with default filters and sorting', async () => {
      const collection = await caller.collection.create({
        title: 'High Priority Tasks',
        properties: {
          objectType: 'task',
          defaultFilters: {
            properties: {
              priority: 'high',
            },
          },
          defaultSort: {
            field: 'createdAt',
            order: 'desc',
          },
        },
      })

      expect(collection.properties).toMatchObject({
        objectType: 'task',
        defaultFilters: {
          properties: {
            priority: 'high',
          },
        },
        defaultSort: {
          field: 'createdAt',
          order: 'desc',
        },
      })
    })

    it('should list all collections', async () => {
      await caller.collection.create({
        title: 'Collection List 1',
        properties: { objectType: 'project' },
      })

      await caller.collection.create({
        title: 'Collection List 2',
        properties: { objectType: 'task' },
      })

      const collections = await caller.collection.list()

      expect(collections.length).toBeGreaterThanOrEqual(2)
      expect(collections.every((c) => c.type === 'collection')).toBe(true)
      expect(collections.every((c) => c.archived === false)).toBe(true)
    })

    it('should filter collections by objectType', async () => {
      await caller.collection.create({
        title: 'Project Collection A',
        properties: { objectType: 'project' },
      })

      await caller.collection.create({
        title: 'Task Collection A',
        properties: { objectType: 'task' },
      })

      const projectCollections = await caller.collection.list({
        objectType: 'project',
      })

      expect(projectCollections.length).toBeGreaterThanOrEqual(1)
      expect(
        projectCollections.every((c) => c.properties.objectType === 'project')
      ).toBe(true)
    })

    it('should get collection by ID', async () => {
      const created = await caller.collection.create({
        title: 'Get By ID Collection',
        properties: { objectType: 'person' },
      })

      const fetched = await caller.collection.getById({ id: created.id })

      expect(fetched).toMatchObject({
        id: created.id,
        type: 'collection',
        title: 'Get By ID Collection',
        properties: { objectType: 'person' },
      })
    })

    it('should return null for non-existent collection', async () => {
      const result = await caller.collection.getById({
        id: '00000000-0000-0000-0000-000000000000',
      })

      expect(result).toBeNull()
    })
  })

  describe('Collection Membership', () => {
    it('should add object to collection', async () => {
      const collection = await caller.collection.create({
        title: 'Membership Test Collection',
        properties: { objectType: 'project' },
      })

      const project = await caller.object.create({
        type: 'project',
        title: 'Membership Test Project',
        content: '',
        properties: {},
      })

      const result = await caller.collection.addObject({
        objectId: project.id,
        collectionId: collection.id,
      })

      expect(result.success).toBe(true)

      // Verify relation exists
      const relation = await ctx.db
        .select()
        .from(relations)
        .where(
          and(
            eq(relations.fromObjectId, project.id),
            eq(relations.toObjectId, collection.id),
            eq(relations.relationType, 'member_of')
          )
        )

      expect(relation).toHaveLength(1)
    })

    it('should prevent adding object with wrong type to collection', async () => {
      const projectCollection = await caller.collection.create({
        title: 'Project-Only Collection',
        properties: { objectType: 'project' },
      })

      const task = await caller.object.create({
        type: 'task',
        title: 'Wrong Type Task',
        content: '',
        properties: {},
      })

      await expect(
        caller.collection.addObject({
          objectId: task.id,
          collectionId: projectCollection.id,
        })
      ).rejects.toThrow('does not match')
    })

    it('should prevent duplicate collection membership', async () => {
      const collection = await caller.collection.create({
        title: 'Duplicate Test Collection',
        properties: { objectType: 'task' },
      })

      const task = await caller.object.create({
        type: 'task',
        title: 'Duplicate Test Task',
        content: '',
        properties: {},
      })

      // Add once
      await caller.collection.addObject({
        objectId: task.id,
        collectionId: collection.id,
      })

      // Try to add again - should fail
      await expect(
        caller.collection.addObject({
          objectId: task.id,
          collectionId: collection.id,
        })
      ).rejects.toThrow('already in this collection')
    })

    it('should allow object in multiple collections of same type', async () => {
      const collection1 = await caller.collection.create({
        title: 'Multi-Collection 1',
        properties: { objectType: 'project' },
      })

      const collection2 = await caller.collection.create({
        title: 'Multi-Collection 2',
        properties: { objectType: 'project' },
      })

      const project = await caller.object.create({
        type: 'project',
        title: 'Multi-Collection Project',
        content: '',
        properties: {},
      })

      // Add to both collections
      await caller.collection.addObject({
        objectId: project.id,
        collectionId: collection1.id,
      })

      await caller.collection.addObject({
        objectId: project.id,
        collectionId: collection2.id,
      })

      // Verify both relations exist
      const collections = await caller.collection.collectionsForObject({
        objectId: project.id,
      })

      expect(collections.length).toBeGreaterThanOrEqual(2)
      const titles = collections.map((c) => c.title)
      expect(titles).toContain('Multi-Collection 1')
      expect(titles).toContain('Multi-Collection 2')
    })

    it('should throw error when adding non-existent object', async () => {
      const collection = await caller.collection.create({
        title: 'Error Test Collection',
        properties: { objectType: 'project' },
      })

      await expect(
        caller.collection.addObject({
          objectId: '00000000-0000-0000-0000-000000000000',
          collectionId: collection.id,
        })
      ).rejects.toThrow('not found')
    })

    it('should throw error when adding to non-existent collection', async () => {
      const project = await caller.object.create({
        type: 'project',
        title: 'Error Test Project',
        content: '',
        properties: {},
      })

      await expect(
        caller.collection.addObject({
          objectId: project.id,
          collectionId: '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow('not found')
    })

    it('should remove object from collection', async () => {
      const collection = await caller.collection.create({
        title: 'Remove Test Collection',
        properties: { objectType: 'task' },
      })

      const task = await caller.object.create({
        type: 'task',
        title: 'Remove Test Task',
        content: '',
        properties: {},
      })

      // Add to collection
      await caller.collection.addObject({
        objectId: task.id,
        collectionId: collection.id,
      })

      // Remove from collection
      const result = await caller.collection.removeObject({
        objectId: task.id,
        collectionId: collection.id,
      })

      expect(result.success).toBe(true)

      // Verify relation removed
      const relation = await ctx.db
        .select()
        .from(relations)
        .where(
          and(
            eq(relations.fromObjectId, task.id),
            eq(relations.toObjectId, collection.id),
            eq(relations.relationType, 'member_of')
          )
        )

      expect(relation).toHaveLength(0)
    })

    it('should allow removing even if not in collection (idempotent)', async () => {
      const collection = await caller.collection.create({
        title: 'Idempotent Remove Collection',
        properties: { objectType: 'project' },
      })

      const project = await caller.object.create({
        type: 'project',
        title: 'Idempotent Remove Project',
        content: '',
        properties: {},
      })

      // Remove without adding first - should not error
      const result = await caller.collection.removeObject({
        objectId: project.id,
        collectionId: collection.id,
      })

      expect(result.success).toBe(true)
    })
  })

  describe('Collection Queries', () => {
    it('should get all objects in a collection', async () => {
      const collection = await caller.collection.create({
        title: 'Query Test Collection',
        properties: { objectType: 'task' },
      })

      // Create and add multiple tasks
      const task1 = await caller.object.create({
        type: 'task',
        title: 'Collection Task 1',
        content: '',
        properties: {},
      })

      const task2 = await caller.object.create({
        type: 'task',
        title: 'Collection Task 2',
        content: '',
        properties: {},
      })

      await caller.collection.addObject({
        objectId: task1.id,
        collectionId: collection.id,
      })

      await caller.collection.addObject({
        objectId: task2.id,
        collectionId: collection.id,
      })

      // Get all objects in collection
      const objects = await caller.collection.objectsInCollection({
        collectionId: collection.id,
      })

      expect(objects.length).toBeGreaterThanOrEqual(2)
      const titles = objects.map((obj) => obj.title)
      expect(titles).toContain('Collection Task 1')
      expect(titles).toContain('Collection Task 2')
    })

    it('should exclude archived objects from collection query', async () => {
      const collection = await caller.collection.create({
        title: 'Archive Test Collection',
        properties: { objectType: 'project' },
      })

      const project = await caller.object.create({
        type: 'project',
        title: 'Archived Collection Project',
        content: '',
        properties: {},
      })

      await caller.collection.addObject({
        objectId: project.id,
        collectionId: collection.id,
      })

      // Archive the project
      await caller.object.archive({
        id: project.id,
        archived: true,
      })

      // Query collection objects - should not include archived
      const objects = await caller.collection.objectsInCollection({
        collectionId: collection.id,
      })

      const titles = objects.map((obj) => obj.title)
      expect(titles).not.toContain('Archived Collection Project')
    })

    it('should get all collections for a specific object', async () => {
      const collection1 = await caller.collection.create({
        title: 'Object Query Collection 1',
        properties: { objectType: 'person' },
      })

      const collection2 = await caller.collection.create({
        title: 'Object Query Collection 2',
        properties: { objectType: 'person' },
      })

      const person = await caller.object.create({
        type: 'person',
        title: 'Multi-Collection Person',
        content: '',
        properties: {},
      })

      // Add to both collections
      await caller.collection.addObject({
        objectId: person.id,
        collectionId: collection1.id,
      })

      await caller.collection.addObject({
        objectId: person.id,
        collectionId: collection2.id,
      })

      // Get all collections for this object
      const collections = await caller.collection.collectionsForObject({
        objectId: person.id,
      })

      expect(collections.length).toBeGreaterThanOrEqual(2)
      const titles = collections.map((c) => c.title)
      expect(titles).toContain('Object Query Collection 1')
      expect(titles).toContain('Object Query Collection 2')
    })

    it('should return empty array for object in no collections', async () => {
      const project = await caller.object.create({
        type: 'project',
        title: 'Uncollected Project',
        content: '',
        properties: {},
      })

      const collections = await caller.collection.collectionsForObject({
        objectId: project.id,
      })

      expect(collections).toEqual([])
    })
  })

  describe('Type Validation', () => {
    it('should validate objectType matches for various object types', async () => {
      const taskCollection = await caller.collection.create({
        title: 'Task Collection',
        properties: { objectType: 'task' },
      })

      const personCollection = await caller.collection.create({
        title: 'Person Collection',
        properties: { objectType: 'person' },
      })

      const task = await caller.object.create({
        type: 'task',
        title: 'Valid Task',
        content: '',
        properties: {},
      })

      const person = await caller.object.create({
        type: 'person',
        title: 'Valid Person',
        content: '',
        properties: {},
      })

      // Should succeed
      await caller.collection.addObject({
        objectId: task.id,
        collectionId: taskCollection.id,
      })

      await caller.collection.addObject({
        objectId: person.id,
        collectionId: personCollection.id,
      })

      // Should fail - wrong types
      await expect(
        caller.collection.addObject({
          objectId: task.id,
          collectionId: personCollection.id,
        })
      ).rejects.toThrow()

      await expect(
        caller.collection.addObject({
          objectId: person.id,
          collectionId: taskCollection.id,
        })
      ).rejects.toThrow()
    })
  })

  describe('Edge Cases and Real-Life Scenarios', () => {
    it('should handle collection with many objects (100+ items)', async () => {
      const collection = await caller.collection.create({
        title: 'Large Project Collection',
        properties: { objectType: 'project' },
      })

      // Create 100 projects
      const projectIds: string[] = []
      for (let i = 0; i < 100; i++) {
        const project = await caller.object.create({
          type: 'project',
          title: `Bulk Project ${i}`,
          content: '',
          properties: {},
          relations: [],
        })
        projectIds.push(project.id)
        await caller.collection.addObject({
          objectId: project.id,
          collectionId: collection.id,
        })
      }

      // Verify all objects in collection
      const objects = await caller.collection.objectsInCollection({
        collectionId: collection.id,
      })
      expect(objects.length).toBeGreaterThanOrEqual(100)
    })

    it('should handle object in multiple collections (real-life: project in "Active", "Work", "Client A")', async () => {
      const project = await caller.object.create({
        type: 'project',
        title: 'Client Website Redesign',
        content: '',
        properties: {},
        relations: [],
      })

      // Create multiple collections
      const activeCollection = await caller.collection.create({
        title: 'Active Projects',
        properties: { objectType: 'project' },
      })

      const workCollection = await caller.collection.create({
        title: 'Work Projects',
        properties: { objectType: 'project' },
      })

      const clientCollection = await caller.collection.create({
        title: 'Client A Projects',
        properties: { objectType: 'project' },
      })

      // Add to all collections
      await caller.collection.addObject({
        objectId: project.id,
        collectionId: activeCollection.id,
      })
      await caller.collection.addObject({
        objectId: project.id,
        collectionId: workCollection.id,
      })
      await caller.collection.addObject({
        objectId: project.id,
        collectionId: clientCollection.id,
      })

      // Verify in all collections
      const collections = await caller.collection.collectionsForObject({
        objectId: project.id,
      })
      expect(collections.length).toBeGreaterThanOrEqual(3)

      const titles = collections.map((c) => c.title)
      expect(titles).toContain('Active Projects')
      expect(titles).toContain('Work Projects')
      expect(titles).toContain('Client A Projects')
    })

    it('should prevent adding non-existent object to collection', async () => {
      const collection = await caller.collection.create({
        title: 'Error Test Collection',
        properties: { objectType: 'task' },
      })

      await expect(
        caller.collection.addObject({
          objectId: '00000000-0000-0000-0000-000000000000',
          collectionId: collection.id,
        })
      ).rejects.toThrow('not found')
    })

    it('should prevent adding object to non-existent collection', async () => {
      const task = await caller.object.create({
        type: 'task',
        title: 'Error Test Task',
        content: '',
        properties: {},
        relations: [],
      })

      await expect(
        caller.collection.addObject({
          objectId: task.id,
          collectionId: '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow('not found')
    })

    it('should handle removing object that is not in collection (idempotent)', async () => {
      const collection = await caller.collection.create({
        title: 'Idempotent Remove Collection',
        properties: { objectType: 'task' },
      })

      const task = await caller.object.create({
        type: 'task',
        title: 'Idempotent Task',
        content: '',
        properties: {},
        relations: [],
      })

      // Remove without adding - should succeed
      const result = await caller.collection.removeObject({
        objectId: task.id,
        collectionId: collection.id,
      })
      expect(result.success).toBe(true)
    })

    it('should handle collection with special characters in title', async () => {
      const collection = await caller.collection.create({
        title: 'Projects [2025] - Q1 & Q2 (Active)',
        properties: { objectType: 'project' },
      })

      expect(collection.title).toBe('Projects [2025] - Q1 & Q2 (Active)')
    })

    it('should handle empty collection (no objects added)', async () => {
      const emptyCollection = await caller.collection.create({
        title: 'Empty Collection',
        properties: { objectType: 'task' },
      })

      const objects = await caller.collection.objectsInCollection({
        collectionId: emptyCollection.id,
      })
      expect(objects).toEqual([])
    })

    it('should exclude archived objects from collection queries', async () => {
      const collection = await caller.collection.create({
        title: 'Archive Filter Collection',
        properties: { objectType: 'project' },
      })

      const project = await caller.object.create({
        type: 'project',
        title: 'Archive Filter Project',
        content: '',
        properties: {},
        relations: [],
      })

      await caller.collection.addObject({
        objectId: project.id,
        collectionId: collection.id,
      })

      // Verify in collection
      let objects = await caller.collection.objectsInCollection({
        collectionId: collection.id,
      })
      expect(objects.map((o) => o.title)).toContain('Archive Filter Project')

      // Archive the project
      await caller.object.archive({ id: project.id, archived: true })

      // Should no longer appear
      objects = await caller.collection.objectsInCollection({
        collectionId: collection.id,
      })
      expect(objects.map((o) => o.title)).not.toContain('Archive Filter Project')
    })

    it('should handle real-life scenario: task management workflow', async () => {
      // Create collections for task states
      const backlogCollection = await caller.collection.create({
        title: 'Backlog',
        properties: { objectType: 'task' },
      })

      const inProgressCollection = await caller.collection.create({
        title: 'In Progress',
        properties: { objectType: 'task' },
      })

      const doneCollection = await caller.collection.create({
        title: 'Done',
        properties: { objectType: 'task' },
      })

      // Create a task
      const task = await caller.object.create({
        type: 'task',
        title: 'Implement user authentication',
        content: '',
        properties: {},
        relations: [],
      })

      // Task starts in backlog
      await caller.collection.addObject({
        objectId: task.id,
        collectionId: backlogCollection.id,
      })

      let backlogTasks = await caller.collection.objectsInCollection({
        collectionId: backlogCollection.id,
      })
      expect(backlogTasks.map((t) => t.title)).toContain(
        'Implement user authentication'
      )

      // Move to in progress (remove from backlog, add to in progress)
      await caller.collection.removeObject({
        objectId: task.id,
        collectionId: backlogCollection.id,
      })
      await caller.collection.addObject({
        objectId: task.id,
        collectionId: inProgressCollection.id,
      })

      backlogTasks = await caller.collection.objectsInCollection({
        collectionId: backlogCollection.id,
      })
      const inProgressTasks = await caller.collection.objectsInCollection({
        collectionId: inProgressCollection.id,
      })

      expect(backlogTasks.map((t) => t.title)).not.toContain(
        'Implement user authentication'
      )
      expect(inProgressTasks.map((t) => t.title)).toContain(
        'Implement user authentication'
      )

      // Move to done
      await caller.collection.removeObject({
        objectId: task.id,
        collectionId: inProgressCollection.id,
      })
      await caller.collection.addObject({
        objectId: task.id,
        collectionId: doneCollection.id,
      })

      const doneTasks = await caller.collection.objectsInCollection({
        collectionId: doneCollection.id,
      })
      expect(doneTasks.map((t) => t.title)).toContain(
        'Implement user authentication'
      )
    })

    it('should handle real-life scenario: project categorization', async () => {
      // Create collections for different project types
      const clientProjects = await caller.collection.create({
        title: 'Client Projects',
        properties: { objectType: 'project' },
      })

      const internalProjects = await caller.collection.create({
        title: 'Internal Projects',
        properties: { objectType: 'project' },
      })

      const urgentProjects = await caller.collection.create({
        title: 'Urgent Projects',
        properties: { objectType: 'project' },
      })

      // Create projects
      const project1 = await caller.object.create({
        type: 'project',
        title: 'Client Website Redesign',
        content: '',
        properties: {},
        relations: [],
      })

      const project2 = await caller.object.create({
        type: 'project',
        title: 'Internal Tool Upgrade',
        content: '',
        properties: {},
        relations: [],
      })

      // Categorize projects
      await caller.collection.addObject({
        objectId: project1.id,
        collectionId: clientProjects.id,
      })
      await caller.collection.addObject({
        objectId: project1.id,
        collectionId: urgentProjects.id,
      }) // Client project is also urgent

      await caller.collection.addObject({
        objectId: project2.id,
        collectionId: internalProjects.id,
      })

      // Verify categorization
      const clientItems = await caller.collection.objectsInCollection({
        collectionId: clientProjects.id,
      })
      const urgentItems = await caller.collection.objectsInCollection({
        collectionId: urgentProjects.id,
      })

      expect(clientItems.map((p) => p.title)).toContain(
        'Client Website Redesign'
      )
      expect(urgentItems.map((p) => p.title)).toContain(
        'Client Website Redesign'
      )
    })

    it('should handle concurrent collection operations', async () => {
      const collection = await caller.collection.create({
        title: 'Concurrent Collection',
        properties: { objectType: 'task' },
      })

      // Create multiple tasks concurrently
      const tasks = await Promise.all([
        caller.object.create({
          type: 'task',
          title: 'Concurrent Task 1',
          content: '',
          properties: {},
          relations: [],
        }),
        caller.object.create({
          type: 'task',
          title: 'Concurrent Task 2',
          content: '',
          properties: {},
          relations: [],
        }),
        caller.object.create({
          type: 'task',
          title: 'Concurrent Task 3',
          content: '',
          properties: {},
          relations: [],
        }),
      ])

      // Add all to collection concurrently
      await Promise.all(
        tasks.map((task) =>
          caller.collection.addObject({
            objectId: task.id,
            collectionId: collection.id,
          })
        )
      )

      // Verify all added
      const objects = await caller.collection.objectsInCollection({
        collectionId: collection.id,
      })
      expect(objects.length).toBeGreaterThanOrEqual(3)
    })

    it('should return empty array for non-existent collection objects query', async () => {
      const objects = await caller.collection.objectsInCollection({
        collectionId: '00000000-0000-0000-0000-000000000000',
      })
      expect(objects).toEqual([])
    })

    it('should return empty array for object not in any collections', async () => {
      const task = await caller.object.create({
        type: 'task',
        title: 'Uncollected Task',
        content: '',
        properties: {},
        relations: [],
      })

      const collections = await caller.collection.collectionsForObject({
        objectId: task.id,
      })
      expect(collections).toEqual([])
    })
  })
})
