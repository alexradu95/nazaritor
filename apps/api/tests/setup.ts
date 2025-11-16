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

// Create test database with schema
async function setupTestDatabase() {
  // Ensure data directory exists (no Bun equivalent for mkdir)
  const dir = dirname(testDbPath)
  const dirExists = await Bun.file(dir).exists()
  if (!dirExists) {
    mkdirSync(dir, { recursive: true })
  }

  // Remove existing test database using Bun native API
  const testDbFile = Bun.file(testDbPath)
  if (await testDbFile.exists()) {
    await Bun.$`rm -f ${testDbPath}`
  }

  // Create fresh database
  const db = new Database(testDbPath, { create: true })
  db.run('PRAGMA foreign_keys = ON')

  try {
    // Read fresh schema migration (single comprehensive migration)
    const migrationsDir = join(import.meta.dir, '../../../packages/database/migrations')

    const migrationFiles = [
      '0000_initial_schema.sql',
    ]

    for (const file of migrationFiles) {
      const migrationPath = join(migrationsDir, file)
      const migrationFile = Bun.file(migrationPath)

      if (!(await migrationFile.exists())) {
        throw new Error(`Migration file not found: ${migrationPath}`)
      }

      const migration = await migrationFile.text()
      db.exec(migration)
      console.log(`  ✅ ${file} applied`)
    }

    console.log('✅ Test database schema created')
    db.close()
  } catch (err) {
    console.error('Failed to create test database schema!')
    console.error(err)
    db.close()
    throw err
  }
}

// Setup database before tests (now async)
await setupTestDatabase()
