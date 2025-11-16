/**
 * Tag Router Tests
 *
 * Tests tag CRUD operations and tagging functionality
 */

import { describe, it, expect, beforeAll } from 'bun:test'
import { appRouter } from '../../../src/trpc/router'
import { db, objects, relations } from '@repo/database'
import { eq, and } from 'drizzle-orm'
import type { Context } from '../../../src/trpc/context'

describe('Tag Router', () => {
  let caller: ReturnType<typeof appRouter.createCaller>
  let ctx: Context

  beforeAll(() => {
    ctx = { db } as Context
    caller = appRouter.createCaller(ctx)
  })

  describe('Tag CRUD', () => {
    it('should create a tag with metadata', async () => {
      const tag = await caller.tag.create({
        title: 'Important',
        content: 'High priority items',
        properties: {
          color: '#FF5733',
          icon: '⭐',
          category: 'Priority',
          description: 'Items requiring immediate attention',
        },
      })

      expect(tag).toMatchObject({
        type: 'tag',
        title: 'Important',
        content: 'High priority items',
        properties: {
          color: '#FF5733',
          icon: '⭐',
          category: 'Priority',
        },
        archived: false,
      })
      expect(tag.id).toBeDefined()
      expect(tag.metadata.createdAt).toBeInstanceOf(Date)
    })

    it('should create a tag with minimal properties', async () => {
      const tag = await caller.tag.create({
        title: 'Work',
      })

      expect(tag).toMatchObject({
        type: 'tag',
        title: 'Work',
        content: '',
        archived: false,
      })
    })

    it('should list all non-archived tags', async () => {
      // Create multiple tags
      await caller.tag.create({
        title: 'Tag List 1',
        properties: { color: '#FF0000' },
      })

      await caller.tag.create({
        title: 'Tag List 2',
        properties: { color: '#00FF00' },
      })

      const tags = await caller.tag.list()

      expect(tags.length).toBeGreaterThanOrEqual(2)
      expect(tags.every((t) => t.type === 'tag')).toBe(true)
      expect(tags.every((t) => t.archived === false)).toBe(true)

      const titles = tags.map((t) => t.title)
      expect(titles).toContain('Tag List 1')
      expect(titles).toContain('Tag List 2')
    })

    it('should get tag by ID', async () => {
      const created = await caller.tag.create({
        title: 'Get By ID Tag',
        properties: { color: '#123456' },
      })

      const fetched = await caller.tag.getById({ id: created.id })

      expect(fetched).toMatchObject({
        id: created.id,
        type: 'tag',
        title: 'Get By ID Tag',
        properties: { color: '#123456' },
      })
    })

    it('should return null for non-existent tag', async () => {
      const result = await caller.tag.getById({
        id: '00000000-0000-0000-0000-000000000000',
      })

      expect(result).toBeNull()
    })
  })

  describe('Tagging Operations', () => {
    it('should tag an object with a tag', async () => {
      // Create tag
      const tag = await caller.tag.create({
        title: 'Test Tag',
        properties: { color: '#FF0000' },
      })

      // Create object to tag
      const project = await caller.object.create({
        type: 'project',
        title: 'Taggable Project',
        content: '',
        properties: {},
      })

      // Tag the object
      const result = await caller.tag.tagObject({
        objectId: project.id,
        tagId: tag.id,
      })

      expect(result.success).toBe(true)

      // Verify relation exists
      const relation = await ctx.db
        .select()
        .from(relations)
        .where(
          and(
            eq(relations.fromObjectId, project.id),
            eq(relations.toObjectId, tag.id),
            eq(relations.relationType, 'tagged_with')
          )
        )

      expect(relation).toHaveLength(1)
    })

    it('should prevent duplicate tagging', async () => {
      const tag = await caller.tag.create({
        title: 'Duplicate Tag Test',
      })

      const project = await caller.object.create({
        type: 'project',
        title: 'Duplicate Tag Project',
        content: '',
        properties: {},
      })

      // Tag once
      await caller.tag.tagObject({
        objectId: project.id,
        tagId: tag.id,
      })

      // Try to tag again - should fail
      await expect(
        caller.tag.tagObject({
          objectId: project.id,
          tagId: tag.id,
        })
      ).rejects.toThrow('already tagged')
    })

    it('should throw error when tagging non-existent object', async () => {
      const tag = await caller.tag.create({
        title: 'Error Test Tag',
      })

      await expect(
        caller.tag.tagObject({
          objectId: '00000000-0000-0000-0000-000000000000',
          tagId: tag.id,
        })
      ).rejects.toThrow('not found')
    })

    it('should throw error when tagging with non-existent tag', async () => {
      const project = await caller.object.create({
        type: 'project',
        title: 'Error Test Project',
        content: '',
        properties: {},
      })

      await expect(
        caller.tag.tagObject({
          objectId: project.id,
          tagId: '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow('not found')
    })

    it('should untag an object', async () => {
      const tag = await caller.tag.create({
        title: 'Untag Test Tag',
      })

      const project = await caller.object.create({
        type: 'project',
        title: 'Untag Test Project',
        content: '',
        properties: {},
      })

      // Tag it
      await caller.tag.tagObject({
        objectId: project.id,
        tagId: tag.id,
      })

      // Untag it
      const result = await caller.tag.untagObject({
        objectId: project.id,
        tagId: tag.id,
      })

      expect(result.success).toBe(true)

      // Verify relation removed
      const relation = await ctx.db
        .select()
        .from(relations)
        .where(
          and(
            eq(relations.fromObjectId, project.id),
            eq(relations.toObjectId, tag.id),
            eq(relations.relationType, 'tagged_with')
          )
        )

      expect(relation).toHaveLength(0)
    })

    it('should allow untagging even if not tagged (idempotent)', async () => {
      const tag = await caller.tag.create({
        title: 'Idempotent Untag Tag',
      })

      const project = await caller.object.create({
        type: 'project',
        title: 'Idempotent Untag Project',
        content: '',
        properties: {},
      })

      // Untag without tagging first - should not error
      const result = await caller.tag.untagObject({
        objectId: project.id,
        tagId: tag.id,
      })

      expect(result.success).toBe(true)
    })
  })

  describe('Tag Queries', () => {
    it('should get all objects with a specific tag', async () => {
      const tag = await caller.tag.create({
        title: 'Multi-Object Tag',
      })

      // Create and tag multiple objects
      const project = await caller.object.create({
        type: 'project',
        title: 'Tagged Project',
        content: '',
        properties: {},
      })

      const task = await caller.object.create({
        type: 'task',
        title: 'Tagged Task',
        content: '',
        properties: {},
      })

      await caller.tag.tagObject({
        objectId: project.id,
        tagId: tag.id,
      })

      await caller.tag.tagObject({
        objectId: task.id,
        tagId: tag.id,
      })

      // Get all objects with this tag
      const taggedObjects = await caller.tag.objectsByTag({ tagId: tag.id })

      expect(taggedObjects.length).toBeGreaterThanOrEqual(2)
      const titles = taggedObjects.map((obj) => obj.title)
      expect(titles).toContain('Tagged Project')
      expect(titles).toContain('Tagged Task')
    })

    it('should exclude archived objects from tag query', async () => {
      const tag = await caller.tag.create({
        title: 'Archive Test Tag',
      })

      const project = await caller.object.create({
        type: 'project',
        title: 'Archived Tagged Project',
        content: '',
        properties: {},
      })

      await caller.tag.tagObject({
        objectId: project.id,
        tagId: tag.id,
      })

      // Archive the project
      await caller.object.archive({
        id: project.id,
        archived: true,
      })

      // Query tagged objects - should not include archived
      const taggedObjects = await caller.tag.objectsByTag({ tagId: tag.id })

      const titles = taggedObjects.map((obj) => obj.title)
      expect(titles).not.toContain('Archived Tagged Project')
    })

    it('should get all tags for a specific object', async () => {
      const tag1 = await caller.tag.create({
        title: 'Multi-Tag 1',
      })

      const tag2 = await caller.tag.create({
        title: 'Multi-Tag 2',
      })

      const project = await caller.object.create({
        type: 'project',
        title: 'Multi-Tagged Project',
        content: '',
        properties: {},
      })

      // Apply multiple tags
      await caller.tag.tagObject({
        objectId: project.id,
        tagId: tag1.id,
      })

      await caller.tag.tagObject({
        objectId: project.id,
        tagId: tag2.id,
      })

      // Get all tags for this object
      const tags = await caller.tag.tagsForObject({ objectId: project.id })

      expect(tags.length).toBeGreaterThanOrEqual(2)
      const titles = tags.map((t) => t.title)
      expect(titles).toContain('Multi-Tag 1')
      expect(titles).toContain('Multi-Tag 2')
    })

    it('should return empty array for object with no tags', async () => {
      const project = await caller.object.create({
        type: 'project',
        title: 'Untagged Project',
        content: '',
        properties: {},
      })

      const tags = await caller.tag.tagsForObject({ objectId: project.id })

      expect(tags).toEqual([])
    })
  })

  describe('Cross-Type Tagging', () => {
    it('should allow tagging different object types with same tag', async () => {
      const workTag = await caller.tag.create({
        title: 'Work Context',
        properties: { color: '#3498DB' },
      })

      // Create different object types
      const project = await caller.object.create({
        type: 'project',
        title: 'Work Project',
        content: '',
        properties: {},
      })

      const task = await caller.object.create({
        type: 'task',
        title: 'Work Task',
        content: '',
        properties: {},
      })

      const person = await caller.object.create({
        type: 'person',
        title: 'Work Colleague',
        content: '',
        properties: {},
      })

      // Tag all with work tag
      await caller.tag.tagObject({ objectId: project.id, tagId: workTag.id })
      await caller.tag.tagObject({ objectId: task.id, tagId: workTag.id })
      await caller.tag.tagObject({ objectId: person.id, tagId: workTag.id })

      // Get all work items
      const workItems = await caller.tag.objectsByTag({ tagId: workTag.id })

      expect(workItems.length).toBeGreaterThanOrEqual(3)

      const types = workItems.map((obj) => obj.type)
      expect(types).toContain('project')
      expect(types).toContain('task')
      expect(types).toContain('person')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should prevent tagging same object with same tag twice', async () => {
      const tag = await caller.tag.create({ title: 'Duplicate Tag Test' })
      const project = await caller.object.create({
        type: 'project',
        title: 'Duplicate Tag Project',
        content: '',
        properties: {},
        relations: [],
      })

      // First tag should succeed
      await caller.tag.tagObject({ objectId: project.id, tagId: tag.id })

      // Second tag should fail with CONFLICT error
      await expect(
        caller.tag.tagObject({ objectId: project.id, tagId: tag.id })
      ).rejects.toThrow('already tagged')
    })

    it('should handle untagging object that is not tagged (idempotent)', async () => {
      const tag = await caller.tag.create({ title: 'Untag Test' })
      const project = await caller.object.create({
        type: 'project',
        title: 'Untag Test Project',
        content: '',
        properties: {},
        relations: [],
      })

      // Untagging without tagging first should succeed (idempotent)
      const result = await caller.tag.untagObject({
        objectId: project.id,
        tagId: tag.id,
      })
      expect(result.success).toBe(true)
    })

    it('should fail when tagging non-existent object', async () => {
      const tag = await caller.tag.create({ title: 'Invalid Object Tag' })

      await expect(
        caller.tag.tagObject({
          objectId: '00000000-0000-0000-0000-000000000000',
          tagId: tag.id,
        })
      ).rejects.toThrow('not found')
    })

    it('should fail when tagging with non-existent tag', async () => {
      const project = await caller.object.create({
        type: 'project',
        title: 'Invalid Tag Project',
        content: '',
        properties: {},
        relations: [],
      })

      await expect(
        caller.tag.tagObject({
          objectId: project.id,
          tagId: '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow('not found')
    })

    it('should handle tag with special characters in title', async () => {
      const specialTag = await caller.tag.create({
        title: 'Tag #1 @Special & $Symbols!',
        properties: { color: '#FF5733' },
      })

      expect(specialTag.title).toBe('Tag #1 @Special & $Symbols!')

      const project = await caller.object.create({
        type: 'project',
        title: 'Special Tag Project',
        content: '',
        properties: {},
        relations: [],
      })

      await caller.tag.tagObject({ objectId: project.id, tagId: specialTag.id })

      const tags = await caller.tag.tagsForObject({ objectId: project.id })
      expect(tags.map((t) => t.title)).toContain('Tag #1 @Special & $Symbols!')
    })

    it('should handle tag with very long title', async () => {
      const longTitle = 'A'.repeat(500) // Max title length is 500
      const tag = await caller.tag.create({ title: longTitle })

      expect(tag.title).toBe(longTitle)
    })

    it('should handle object tagged with many tags', async () => {
      const project = await caller.object.create({
        type: 'project',
        title: 'Many Tags Project',
        content: '',
        properties: {},
        relations: [],
      })

      // Create and apply 20 tags
      const tagIds: string[] = []
      for (let i = 0; i < 20; i++) {
        const tag = await caller.tag.create({ title: `Bulk Tag ${i}` })
        tagIds.push(tag.id)
        await caller.tag.tagObject({ objectId: project.id, tagId: tag.id })
      }

      // Verify all tags are associated
      const tags = await caller.tag.tagsForObject({ objectId: project.id })
      expect(tags.length).toBeGreaterThanOrEqual(20)

      for (let i = 0; i < 20; i++) {
        expect(tags.map((t) => t.title)).toContain(`Bulk Tag ${i}`)
      }
    })

    it('should handle many objects tagged with same tag', async () => {
      const tag = await caller.tag.create({ title: 'Popular Tag' })

      // Create and tag 15 objects
      const objectIds: string[] = []
      for (let i = 0; i < 15; i++) {
        const obj = await caller.object.create({
          type: 'task',
          title: `Popular Tag Task ${i}`,
          content: '',
          properties: {},
          relations: [],
        })
        objectIds.push(obj.id)
        await caller.tag.tagObject({ objectId: obj.id, tagId: tag.id })
      }

      // Verify all objects are tagged
      const objects = await caller.tag.objectsByTag({ tagId: tag.id })
      expect(objects.length).toBeGreaterThanOrEqual(15)

      for (let i = 0; i < 15; i++) {
        expect(objects.map((o) => o.title)).toContain(`Popular Tag Task ${i}`)
      }
    })

    it('should return empty array for tag with no tagged objects', async () => {
      const unusedTag = await caller.tag.create({ title: 'Unused Tag' })

      const objects = await caller.tag.objectsByTag({ tagId: unusedTag.id })
      expect(objects).toEqual([])
    })

    it('should return empty array for object with no tags', async () => {
      const untaggedProject = await caller.object.create({
        type: 'project',
        title: 'Untagged Project',
        content: '',
        properties: {},
        relations: [],
      })

      const tags = await caller.tag.tagsForObject({
        objectId: untaggedProject.id,
      })
      expect(tags).toEqual([])
    })

    it('should handle tag without properties (properties optional)', async () => {
      // Tag creation without properties should work (properties is optional)
      const simpleTag = await caller.tag.create({ title: 'Simple Tag' })

      expect(simpleTag.title).toBe('Simple Tag')
      expect(simpleTag.properties).toBeDefined()
    })

    it('should exclude archived objects from tag queries', async () => {
      const tag = await caller.tag.create({ title: 'Archive Test Tag' })

      const project = await caller.object.create({
        type: 'project',
        title: 'Archive Test Project',
        content: '',
        properties: {},
        relations: [],
      })

      await caller.tag.tagObject({ objectId: project.id, tagId: tag.id })

      // Verify tagged
      let objects = await caller.tag.objectsByTag({ tagId: tag.id })
      expect(objects.map((o) => o.title)).toContain('Archive Test Project')

      // Archive the project
      await caller.object.archive({ id: project.id, archived: true })

      // Should no longer appear in tag query
      objects = await caller.tag.objectsByTag({ tagId: tag.id })
      expect(objects.map((o) => o.title)).not.toContain('Archive Test Project')
    })

    it('should handle concurrent tagging operations', async () => {
      const tag = await caller.tag.create({ title: 'Concurrent Tag' })

      // Create multiple objects
      const objects = await Promise.all([
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

      // Tag all concurrently
      await Promise.all(
        objects.map((obj) =>
          caller.tag.tagObject({ objectId: obj.id, tagId: tag.id })
        )
      )

      // Verify all tagged
      const taggedObjects = await caller.tag.objectsByTag({ tagId: tag.id })
      expect(taggedObjects.length).toBeGreaterThanOrEqual(3)
    })
  })
})
