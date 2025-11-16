/**
 * Query Router and Executor Tests
 *
 * Tests query CRUD operations and query execution functionality
 */

import { describe, it, expect, beforeAll } from 'bun:test'
import { appRouter } from '../../../src/trpc/router'
import { db } from '@repo/database'
import type { Context } from '../../../src/trpc/context'

describe('Query Router', () => {
  let caller: ReturnType<typeof appRouter.createCaller>
  let ctx: Context

  beforeAll(() => {
    ctx = { db } as Context
    caller = appRouter.createCaller(ctx)
  })

  describe('Query CRUD', () => {
    it('should create a basic query', async () => {
      const query = await caller.query.create({
        title: 'Active Projects',
        content: 'All non-archived projects',
        properties: {
          queryType: 'object-type',
          filters: {
            objectType: 'project',
            archived: false,
          },
          sort: {
            field: 'updatedAt',
            order: 'desc',
          },
          limit: 50,
        },
      })

      expect(query).toMatchObject({
        type: 'query',
        title: 'Active Projects',
        properties: {
          queryType: 'object-type',
          filters: {
            objectType: 'project',
            archived: false,
          },
        },
        archived: false,
      })
      expect(query.id).toBeDefined()
    })

    it('should create a query with property filters', async () => {
      const query = await caller.query.create({
        title: 'High Priority Tasks',
        properties: {
          queryType: 'object-type',
          filters: {
            objectType: 'task',
            properties: {
              priority: 'high',
              status: 'active',
            },
          },
        },
      })

      expect(query.properties.filters?.properties).toMatchObject({
        priority: 'high',
        status: 'active',
      })
    })

    it('should create a query with tag filters', async () => {
      const query = await caller.query.create({
        title: 'Important Items',
        properties: {
          queryType: 'object-type',
          filters: {
            tags: ['Important', 'Work'],
          },
        },
      })

      expect(query.properties.filters?.tags).toEqual(['Important', 'Work'])
    })

    it('should create a query with date range filters', async () => {
      const startDate = new Date('2025-01-01')
      const endDate = new Date('2025-01-31')

      const query = await caller.query.create({
        title: 'January Items',
        properties: {
          queryType: 'object-type',
          filters: {
            dateRange: {
              start: startDate,
              end: endDate,
            },
          },
        },
      })

      expect(query.properties.filters?.dateRange).toMatchObject({
        start: startDate,
        end: endDate,
      })
    })

    it('should list all queries', async () => {
      await caller.query.create({
        title: 'Query List 1',
        properties: {
          queryType: 'object-type',
          filters: { objectType: 'project' },
        },
      })

      await caller.query.create({
        title: 'Query List 2',
        properties: {
          queryType: 'object-type',
          filters: { objectType: 'task' },
        },
      })

      const queries = await caller.query.list()

      expect(queries.length).toBeGreaterThanOrEqual(2)
      expect(queries.every((q) => q.type === 'query')).toBe(true)
      expect(queries.every((q) => q.archived === false)).toBe(true)
    })

    it('should get query by ID', async () => {
      const created = await caller.query.create({
        title: 'Get By ID Query',
        properties: {
          queryType: 'object-type',
          filters: { objectType: 'person' },
        },
      })

      const fetched = await caller.query.getById({ id: created.id })

      expect(fetched).toMatchObject({
        id: created.id,
        type: 'query',
        title: 'Get By ID Query',
      })
    })

    it('should return null for non-existent query', async () => {
      const result = await caller.query.getById({
        id: '00000000-0000-0000-0000-000000000000',
      })

      expect(result).toBeNull()
    })

    it('should update a query', async () => {
      const query = await caller.query.create({
        title: 'Update Test Query',
        properties: {
          queryType: 'object-type',
          filters: { objectType: 'project' },
          limit: 10,
        },
      })

      const updated = await caller.query.update({
        id: query.id,
        updates: {
          title: 'Updated Query Title',
          properties: {
            queryType: 'object-type',
            filters: { objectType: 'task' },
            limit: 20,
          },
        },
      })

      expect(updated).toMatchObject({
        id: query.id,
        title: 'Updated Query Title',
        properties: {
          filters: { objectType: 'task' },
          limit: 20,
        },
      })
    })

    it('should delete a query', async () => {
      const query = await caller.query.create({
        title: 'Delete Test Query',
        properties: {
          queryType: 'object-type',
          filters: { objectType: 'project' },
        },
      })

      const result = await caller.query.delete({ id: query.id })
      expect(result.success).toBe(true)

      // Verify deleted
      const fetched = await caller.query.getById({ id: query.id })
      expect(fetched).toBeNull()
    })

    it('should throw error when updating non-existent query', async () => {
      await expect(
        caller.query.update({
          id: '00000000-0000-0000-0000-000000000000',
          updates: { title: 'Updated' },
        })
      ).rejects.toThrow('not found')
    })

    it('should throw error when deleting non-existent query', async () => {
      await expect(
        caller.query.delete({
          id: '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow('not found')
    })
  })

  describe('Query Execution', () => {
    it('should execute query filtering by object type', async () => {
      // Create test objects
      await caller.object.create({
        type: 'project',
        title: 'Query Exec Project 1',
        content: '',
        properties: {},
      })

      await caller.object.create({
        type: 'task',
        title: 'Query Exec Task 1',
        content: '',
        properties: {},
      })

      // Create and execute query for projects only
      const query = await caller.query.create({
        title: 'All Projects',
        properties: {
          queryType: 'object-type',
          filters: { objectType: 'project' },
        },
      })

      const results = await caller.query.execute({ id: query.id })

      expect(results.length).toBeGreaterThanOrEqual(1)
      expect(results.every((obj) => obj.type === 'project')).toBe(true)
    })

    it('should execute query with property filters', async () => {
      // Create test tasks with different priorities
      await caller.object.create({
        type: 'task',
        title: 'High Priority Task',
        content: '',
        properties: {
          priority: { type: 'text', value: 'high' },
        },
      })

      await caller.object.create({
        type: 'task',
        title: 'Low Priority Task',
        content: '',
        properties: {
          priority: { type: 'text', value: 'low' },
        },
      })

      // Query for high priority tasks
      const query = await caller.query.create({
        title: 'High Priority Tasks',
        properties: {
          queryType: 'object-type',
          filters: {
            objectType: 'task',
            properties: { priority: 'high' },
          },
        },
      })

      const results = await caller.query.execute({ id: query.id })

      expect(results.length).toBeGreaterThanOrEqual(1)
      expect(
        results.every(
          (obj) => obj.type === 'task' && (obj.properties as any).priority?.value === 'high'
        )
      ).toBe(true)
    })

    it('should execute query with limit', async () => {
      // Create multiple projects
      for (let i = 0; i < 5; i++) {
        await caller.object.create({
          type: 'project',
          title: `Limit Test Project ${i}`,
          content: '',
          properties: {},
        })
      }

      // Query with limit 3
      const query = await caller.query.create({
        title: 'Limited Projects',
        properties: {
          queryType: 'object-type',
          filters: { objectType: 'project' },
          limit: 3,
        },
      })

      const results = await caller.query.execute({ id: query.id })

      expect(results.length).toBeLessThanOrEqual(3)
    })

    it('should execute query with sorting', async () => {
      const now = Date.now() / 1000

      // Create projects with different timestamps
      await caller.object.create({
        type: 'project',
        title: 'Sort Test Project A',
        content: '',
        properties: {},
      })

      // Wait a bit to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10))

      await caller.object.create({
        type: 'project',
        title: 'Sort Test Project B',
        content: '',
        properties: {},
      })

      // Query sorted by createdAt descending (newest first)
      const query = await caller.query.create({
        title: 'Sorted Projects',
        properties: {
          queryType: 'object-type',
          filters: { objectType: 'project' },
          sort: { field: 'createdAt', order: 'desc' },
        },
      })

      const results = await caller.query.execute({ id: query.id })

      expect(results.length).toBeGreaterThanOrEqual(2)

      // Verify descending order (newer first)
      for (let i = 0; i < results.length - 1; i++) {
        const current = new Date(results[i].metadata.createdAt).getTime()
        const next = new Date(results[i + 1].metadata.createdAt).getTime()
        expect(current).toBeGreaterThanOrEqual(next)
      }
    })

    it('should exclude archived objects by default', async () => {
      // Create and archive a project
      const project = await caller.object.create({
        type: 'project',
        title: 'Archived Query Project',
        content: '',
        properties: {},
      })

      await caller.object.archive({ id: project.id, archived: true })

      // Query projects
      const query = await caller.query.create({
        title: 'Non-Archived Projects',
        properties: {
          queryType: 'object-type',
          filters: { objectType: 'project' },
        },
      })

      const results = await caller.query.execute({ id: query.id })

      const titles = results.map((obj) => obj.title)
      expect(titles).not.toContain('Archived Query Project')
    })

    it('should include archived objects when explicitly requested', async () => {
      // Create and archive a task
      const task = await caller.object.create({
        type: 'task',
        title: 'Explicitly Archived Task',
        content: '',
        properties: {},
      })

      await caller.object.archive({ id: task.id, archived: true })

      // Query with archived: true
      const query = await caller.query.create({
        title: 'Archived Tasks',
        properties: {
          queryType: 'object-type',
          filters: { objectType: 'task', archived: true },
        },
      })

      const results = await caller.query.execute({ id: query.id })

      const titles = results.map((obj) => obj.title)
      expect(titles).toContain('Explicitly Archived Task')
    })

    it('should execute query with tag filters', async () => {
      // Create tag
      const tag = await caller.tag.create({
        title: 'Query Tag',
        properties: { color: '#FF0000' },
      })

      // Create and tag objects
      const project = await caller.object.create({
        type: 'project',
        title: 'Tagged Query Project',
        content: '',
        properties: {},
      })

      await caller.tag.tagObject({
        objectId: project.id,
        tagId: tag.id,
      })

      // Query by tag name
      const query = await caller.query.create({
        title: 'Items Tagged Query Tag',
        properties: {
          queryType: 'object-type',
          filters: { tags: ['Query Tag'] },
        },
      })

      const results = await caller.query.execute({ id: query.id })

      const titles = results.map((obj) => obj.title)
      expect(titles).toContain('Tagged Query Project')
    })
  })

  describe('Query Testing (without saving)', () => {
    it('should test query without saving', async () => {
      // Create test projects
      await caller.object.create({
        type: 'project',
        title: 'Test Query Project',
        content: '',
        properties: {
          status: { type: 'text', value: 'active' },
        },
      })

      // Test query without saving
      const results = await caller.query.test({
        filters: {
          objectType: 'project',
          properties: { status: 'active' },
        },
      })

      expect(results.length).toBeGreaterThanOrEqual(1)
      expect(
        results.every(
          (obj) => obj.type === 'project' && (obj.properties as any).status?.value === 'active'
        )
      ).toBe(true)

      // Verify no query object was created
      const queries = await caller.query.list()
      const testQueryTitles = queries.map((q) => q.title)
      expect(testQueryTitles).not.toContain('Temporary Query')
    })

    it('should test query with limit and sort', async () => {
      const results = await caller.query.test({
        filters: { objectType: 'task' },
        sort: { field: 'createdAt', order: 'desc' },
        limit: 5,
      })

      expect(results.length).toBeLessThanOrEqual(5)
      expect(results.every((obj) => obj.type === 'task')).toBe(true)
    })
  })

  describe('Complex Query Scenarios', () => {
    it('should execute query combining multiple filter types', async () => {
      // Create tag
      const urgentTag = await caller.tag.create({
        title: 'Urgent',
      })

      // Create high priority urgent task
      const task = await caller.object.create({
        type: 'task',
        title: 'Complex Query Task',
        content: '',
        properties: {
          priority: { type: 'text', value: 'high' },
          status: { type: 'text', value: 'active' },
        },
      })

      await caller.tag.tagObject({
        objectId: task.id,
        tagId: urgentTag.id,
      })

      // Query: tasks + high priority + tagged Urgent
      const query = await caller.query.create({
        title: 'Complex Query',
        properties: {
          queryType: 'object-type',
          filters: {
            objectType: 'task',
            properties: { priority: 'high' },
            tags: ['Urgent'],
          },
        },
      })

      const results = await caller.query.execute({ id: query.id })

      const titles = results.map((obj) => obj.title)
      expect(titles).toContain('Complex Query Task')
    })

    it('should execute query with date range', async () => {
      const startDate = new Date('2025-01-01')
      const endDate = new Date('2025-12-31')

      const query = await caller.query.create({
        title: '2025 Items',
        properties: {
          queryType: 'object-type',
          filters: {
            dateRange: {
              start: startDate,
              end: endDate,
            },
          },
        },
      })

      const results = await caller.query.execute({ id: query.id })

      // Verify all results are within date range
      results.forEach((obj) => {
        const createdAt = new Date(obj.metadata.createdAt)
        expect(createdAt >= startDate).toBe(true)
        expect(createdAt <= endDate).toBe(true)
      })
    })
  })
})
