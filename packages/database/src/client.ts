import { drizzle } from 'drizzle-orm/bun-sqlite'
import { Database } from 'bun:sqlite'
import * as schema from './schema'
import { existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'

// Database file path
const dbPath = process.env.DATABASE_URL || './data/nazaritor.db'

// Only create directory for local file paths, not for URLs
if (!dbPath.includes('://')) {
  const dir = dirname(dbPath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
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
