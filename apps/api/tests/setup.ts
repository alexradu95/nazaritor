// Test setup file
// This runs before all tests

import { Database } from 'bun:sqlite'
import { mkdirSync } from 'fs'
import { dirname, join } from 'path'

// Setup test environment variables FIRST
// This must happen before any other imports that might read the env
const testDbPath = './data/nazaritor.test.db'

// Delete any existing DATABASE_URL to prevent conflicts
delete process.env.DATABASE_URL

// Set test environment
process.env.DATABASE_URL = testDbPath
process.env.NODE_ENV = 'test'

// Reset any previously initialized database clients
// This is critical for tests that might have already imported the database module
import { resetDatabase } from '@repo/database'
resetDatabase()

console.log('Test environment initialized')
console.log('Test database:', process.env.DATABASE_URL)

// Create test database with schema using Drizzle migrator
async function setupTestDatabase() {
  // Ensure data directory exists (no Bun equivalent for mkdir)
  const dir = dirname(testDbPath)
  const dirExists = await Bun.file(dir).exists()
  if (!dirExists) {
    mkdirSync(dir, { recursive: true })
  }

  // Remove existing test database
  const testDbFile = Bun.file(testDbPath)
  if (await testDbFile.exists()) {
    const { unlinkSync } = await import('fs')
    try {
      unlinkSync(testDbPath)
    } catch (err) {
      // Ignore errors if file doesn't exist
    }
  }

  // Create fresh database
  const sqlite = new Database(testDbPath, { create: true })
  sqlite.run('PRAGMA foreign_keys = ON')

  try {
    // Import Drizzle migrator
    const { drizzle } = await import('drizzle-orm/bun-sqlite')
    const { migrate } = await import('drizzle-orm/bun-sqlite/migrator')

    // Create Drizzle instance
    const db = drizzle(sqlite)

    // Run migrations using Drizzle's migrator
    const migrationsFolder = join(import.meta.dir, '../../../packages/database/migrations')

    console.log('Applying migrations to test database...')
    await migrate(db, { migrationsFolder })
    console.log('✅ Test database schema created')

    sqlite.close()
  } catch (err) {
    console.error('Failed to create test database schema!')
    console.error(err)
    sqlite.close()
    throw err
  }
}

// Setup database before tests (now async)
await setupTestDatabase()
