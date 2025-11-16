// Test setup file
// This runs before all tests

import { Database } from 'bun:sqlite'
import { readFileSync, existsSync, mkdirSync, unlinkSync } from 'fs'
import { dirname, join } from 'path'

// Setup test environment variables FIRST
// This must happen before any other imports that might read the env
const testDbPath = './data/nazaritor.test.db'

// Delete any existing DATABASE_URL to prevent conflicts
delete process.env.DATABASE_URL

// Set test environment
process.env.DATABASE_URL = testDbPath
process.env.NODE_ENV = 'test'

console.log('Test environment initialized')
console.log('Test database:', process.env.DATABASE_URL)

// Create test database with schema
function setupTestDatabase() {
  // Ensure data directory exists
  const dir = dirname(testDbPath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  // Remove existing test database
  if (existsSync(testDbPath)) {
    unlinkSync(testDbPath)
  }

  // Create fresh database
  const db = new Database(testDbPath, { create: true })
  db.run('PRAGMA foreign_keys = ON')

  try {
    // Read migration file
    const migrationPath = join(
      import.meta.dir,
      '../../../packages/database/migrations/0000_initial.sql'
    )

    if (!existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`)
    }

    const migration = readFileSync(migrationPath, 'utf-8')

    // Execute the entire migration file at once
    // This handles multi-line statements like triggers correctly
    db.exec(migration)

    console.log('✅ Test database schema created')
    db.close()
  } catch (err) {
    console.error('Failed to create test database schema!')
    console.error(err)
    db.close()
    throw err
  }
}

// Setup database before tests
setupTestDatabase()
