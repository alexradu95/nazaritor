#!/usr/bin/env bun
// Script to apply database migrations using Drizzle's migrator

import { drizzle } from 'drizzle-orm/bun-sqlite'
import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
import { Database } from 'bun:sqlite'
import { dirname, join } from 'path'
import { mkdirSync } from 'fs'

// Use SQLite database, ignore any PostgreSQL DATABASE_URL
const dbPath = './data/nazaritor.db'

console.log(`Migrating database: ${dbPath}`)

// Create data directory if it doesn't exist
const dir = dirname(dbPath)
try {
  mkdirSync(dir, { recursive: true })
} catch (err) {
  if ((err as NodeJS.ErrnoException).code !== 'EEXIST') {
    throw err
  }
}

// Open database connection
const sqlite = new Database(dbPath, { create: true })
sqlite.run('PRAGMA foreign_keys = ON')

// Create Drizzle instance
const db = drizzle(sqlite)

// Run migrations using Drizzle's migrator
const migrationsFolder = join(import.meta.dir, '../migrations')

try {
  console.log('Applying migrations...')
  await migrate(db, { migrationsFolder })
  console.log('\n✅ All migrations applied successfully')
} catch (error) {
  console.error('❌ Migration failed:', error)
  throw error
} finally {
  sqlite.close()
}
