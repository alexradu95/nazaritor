import { drizzle } from 'drizzle-orm/bun-sqlite'
import { Database } from 'bun:sqlite'
import * as schema from './schema'
import { mkdirSync } from 'fs'
import { dirname } from 'path'

// Lazy database initialization to prevent race conditions in tests
// The database is created on first access, allowing environment variables
// to be set before initialization occurs
let _sqlite: Database | null = null
let _db: ReturnType<typeof drizzle> | null = null

function initializeDatabase() {
  if (_db && _sqlite) {
    return { db: _db, sqlite: _sqlite }
  }

  // Database file path - read at initialization time, not module load time  // This project uses SQLite only. Ignore any non-SQLite DATABASE_URLs (like PostgreSQL)
  let dbPath = process.env.DATABASE_URL || './data/nazaritor.db'

  // Reject non-SQLite URLs - this project only supports SQLite
  if (dbPath.includes('postgresql://') || dbPath.includes('mysql://') || dbPath.includes('mongodb://')) {
    // Silently fall back to default SQLite path
    dbPath = './data/nazaritor.db'
  }

  // Create directory for SQLite file
  const dir = dirname(dbPath)
  try {
    mkdirSync(dir, { recursive: true })
  } catch (err) {
    // Directory might already exist, ignore EEXIST errors
    if ((err as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw err
    }
  }

  // Create SQLite connection using Bun's native SQLite
  _sqlite = new Database(dbPath, { create: true })

  // Enable foreign keys
  _sqlite.run('PRAGMA foreign_keys = ON')

  // Create drizzle instance
  _db = drizzle(_sqlite, { schema })

  return { db: _db, sqlite: _sqlite }
}

// Reset function for tests - closes existing connection and clears cached instances
export function resetDatabase() {
  if (_sqlite) {
    _sqlite.close()
  }
  _sqlite = null
  _db = null
}

// Export proxied instances that initialize on first access
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    const { db } = initializeDatabase()
    return db[prop as keyof typeof db]
  },
})

export const sqlite = new Proxy({} as Database, {
  get(_target, prop) {
    const { sqlite } = initializeDatabase()
    return sqlite[prop as keyof typeof sqlite]
  },
})
