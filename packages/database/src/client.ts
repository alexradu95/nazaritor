import { drizzle } from 'drizzle-orm/bun-sqlite'
import { Database } from 'bun:sqlite'
import * as schema from './schema'
import { mkdirSync } from 'fs'
import { dirname } from 'path'

// Database file path
const dbPath = process.env.DATABASE_URL || './data/nazaritor.db'

// Only create directory for local file paths, not for URLs
// Note: Bun doesn't have a native mkdir API yet, so we use Node's fs
if (!dbPath.includes('://')) {
  const dir = dirname(dbPath)
  // Using Bun.file().exists() would require top-level await, so we keep fs for now
  // This is fine - Bun is compatible with Node's fs module
  try {
    mkdirSync(dir, { recursive: true })
  } catch (err) {
    // Directory might already exist, ignore EEXIST errors
    if ((err as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw err
    }
  }
}

// Create SQLite connection using Bun's native SQLite
const sqlite = new Database(dbPath, { create: true })

// Enable foreign keys
sqlite.run('PRAGMA foreign_keys = ON')

// Create drizzle instance
export const db = drizzle(sqlite, { schema })

// Export sqlite instance for migrations
export { sqlite }
