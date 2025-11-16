import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test'
import { appRouter } from '@/trpc/router'
import { createContext } from '@/trpc/context'
import { db, sqlite } from '@repo/database'
import { objects } from '@repo/database'

// Helper to create a test context
async function createTestContext() {
  return await createContext({
    req: new Request('http://localhost:3001/trpc'),
    resHeaders: new Headers(),
  })
}

// Helper to create a caller
async function createCaller() {
  const ctx = await createTestContext()
  return appRouter.createCaller(ctx)
}

describe('Object Router', () => {
  beforeAll(async () => {
    // Database should be migrated before running tests
    console.log('Tests starting...')
    console.log('Using test database')
  })

  afterAll(async () => {
    // Database will be cleaned up by test runner
  })

  beforeEach(async () => {
    // Clean up database before each test
    await db.delete(objects)
  })

  describe('ping', () => {
    test('should return pong message', async () => {
      const caller = await createCaller()
      const result = await caller.object.ping()

      expect(result).toEqual({ message: 'pong from object router' })
    })
  })

  describe('create', () => {
    test('should create a new project object', async () => {
      const caller = await createCaller()

      const result = await caller.object.create({
        type: 'project',
        title: 'Test Project',
        content: 'This is a test project',
        properties: {
          status: { type: 'text', value: 'planning' },
          priority: { type: 'text', value: 'high' },
        },
        relations: [],
      })

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.type).toBe('project')
      expect(result.title).toBe('Test Project')
      expect(result.content).toBe('This is a test project')
      expect(result.metadata.createdAt).toBeInstanceOf(Date)
      expect(result.metadata.updatedAt).toBeInstanceOf(Date)
      expect(result.metadata.tags).toEqual([])
      expect(result.metadata.archived).toBe(false)
    })

    test('should create a new task object', async () => {
      const caller = await createCaller()

      const result = await caller.object.create({
        type: 'task',
        title: 'Write tests',
        content: '',
        properties: {
          status: { type: 'text', value: 'todo' },
          priority: { type: 'text', value: 'high' },
        },
        relations: [],
      })

      expect(result.type).toBe('task')
      expect(result.title).toBe('Write tests')
    })

    test('should fail with invalid data', async () => {
      const caller = await createCaller()

      await expect(
        caller.object.create({
          type: 'invalid-type' as any,
          title: '',
          content: '',
          properties: {},
          relations: [],
        })
      ).rejects.toThrow()
    })
  })

  describe('getById', () => {
    test('should retrieve an object by ID', async () => {
      const caller = await createCaller()

      // First create an object
      const created = await caller.object.create({
        type: 'project',
        title: 'Test Project',
        content: '',
        properties: {},
        relations: [],
      })

      // Then retrieve it
      const result = await caller.object.getById({ id: created.id })

      expect(result).toBeDefined()
      expect(result?.id).toBe(created.id)
      expect(result?.title).toBe('Test Project')
    })

    test('should return null for non-existent ID', async () => {
      const caller = await createCaller()

      const result = await caller.object.getById({
        id: '00000000-0000-0000-0000-000000000000',
      })

      expect(result).toBeNull()
    })
  })

  describe('list', () => {
    test('should list all objects', async () => {
      const caller = await createCaller()

      // Create multiple objects
      await caller.object.create({
        type: 'project',
        title: 'Project 1',
        content: '',
        properties: {},
        relations: [],
      })

      await caller.object.create({
        type: 'task',
        title: 'Task 1',
        content: '',
        properties: {},
        relations: [],
      })

      const result = await caller.object.list({})

      expect(result.objects).toHaveLength(2)
      expect(result.total).toBeGreaterThanOrEqual(2)
    })

    test('should filter objects by type', async () => {
      const caller = await createCaller()

      // Create objects of different types
      await caller.object.create({
        type: 'project',
        title: 'Project 1',
        content: '',
        properties: {},
        relations: [],
      })

      await caller.object.create({
        type: 'task',
        title: 'Task 1',
        content: '',
        properties: {},
        relations: [],
      })

      const result = await caller.object.list({ type: 'project' })

      expect(result.objects).toHaveLength(1)
      expect(result.objects[0].type).toBe('project')
    })

    test('should paginate results', async () => {
      const caller = await createCaller()

      // Create multiple objects
      for (let i = 0; i < 5; i++) {
        await caller.object.create({
          type: 'task',
          title: `Task ${i}`,
          content: '',
          properties: {},
          relations: [],
        })
      }

      const page1 = await caller.object.list({ limit: 2, offset: 0 })
      const page2 = await caller.object.list({ limit: 2, offset: 2 })

      expect(page1.objects).toHaveLength(2)
      expect(page2.objects).toHaveLength(2)
      expect(page1.objects[0].id).not.toBe(page2.objects[0].id)
    })
  })

  describe('update', () => {
    test('should update an object', async () => {
      const caller = await createCaller()

      // Create object
      const created = await caller.object.create({
        type: 'project',
        title: 'Original Title',
        content: '',
        properties: {},
        relations: [],
      })

      // Wait to ensure timestamp will be different (DB uses second-level precision)
      await new Promise((resolve) => setTimeout(resolve, 1100))

      // Update it
      const updated = await caller.object.update({
        id: created.id,
        updates: {
          title: 'Updated Title',
          content: 'New content',
        },
      })

      expect(updated.title).toBe('Updated Title')
      expect(updated.content).toBe('New content')
      expect(updated.metadata.updatedAt.getTime()).toBeGreaterThan(
        created.metadata.updatedAt.getTime()
      )
    })

    test('should fail for non-existent object', async () => {
      const caller = await createCaller()

      await expect(
        caller.object.update({
          id: '00000000-0000-0000-0000-000000000000',
          updates: { title: 'Updated' },
        })
      ).rejects.toThrow()
    })
  })

  describe('delete', () => {
    test('should delete an object', async () => {
      const caller = await createCaller()

      // Create object
      const created = await caller.object.create({
        type: 'project',
        title: 'To Delete',
        content: '',
        properties: {},
        relations: [],
      })

      // Delete it
      const result = await caller.object.delete({ id: created.id })
      expect(result.success).toBe(true)

      // Verify it's gone
      const retrieved = await caller.object.getById({ id: created.id })
      expect(retrieved).toBeNull()
    })

    test('should fail for non-existent object', async () => {
      const caller = await createCaller()

      await expect(
        caller.object.delete({ id: '00000000-0000-0000-0000-000000000000' })
      ).rejects.toThrow()
    })
  })

  describe('archive', () => {
    test('should archive an object', async () => {
      const caller = await createCaller()

      // Create object
      const created = await caller.object.create({
        type: 'project',
        title: 'To Archive',
        content: '',
        properties: {},
        relations: [],
      })

      // Archive it
      const archived = await caller.object.archive({
        id: created.id,
        archived: true,
      })

      expect(archived.archived).toBe(true)
      expect(archived.metadata.archived).toBe(true)
    })
  })
})
