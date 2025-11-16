#!/usr/bin/env bun
// Script to apply database migrations

import { Database } from 'bun:sqlite'
import { join, dirname } from 'path'
import { readdirSync, mkdirSync } from 'fs'

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

// Open database
const db = new Database(dbPath, { create: true })
db.run('PRAGMA foreign_keys = ON')

// Get all migration files in order
const migrationsDir = join(import.meta.dir, '../migrations')
const migrationFiles = readdirSync(migrationsDir)
  .filter((file) => file.endsWith('.sql'))
  .sort()

console.log(`Found ${migrationFiles.length} migration files`)

// Apply each migration
for (const file of migrationFiles) {
  console.log(`Applying migration: ${file}`)

  const migrationPath = join(migrationsDir, file)
  const migration = await Bun.file(migrationPath).text()

  try {
    db.exec(migration)
    console.log(`  ✅ ${file} applied successfully`)
  } catch (error) {
    console.error(`  ❌ Failed to apply ${file}:`, error)
    throw error
  }
}

db.close()
console.log('\n✅ All migrations applied successfully')
