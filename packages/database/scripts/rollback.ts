#!/usr/bin/env bun
/**
 * Database Migration Rollback Script
 *
 * Rolls back the last applied migration or rolls back to a specific migration
 *
 * Usage:
 *   bun run packages/database/scripts/rollback.ts           # Rollback last migration
 *   bun run packages/database/scripts/rollback.ts --to=0002 # Rollback to migration 0002
 */

import { Database } from 'bun:sqlite'
import { join, dirname } from 'path'
import { mkdirSync } from 'fs'

const dbPath = process.env.DATABASE_URL || './data/nazaritor.db'

// Ensure data directory exists
if (!dbPath.includes('://')) {
  const dir = dirname(dbPath)
  try {
    mkdirSync(dir, { recursive: true })
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw err
    }
  }
}

const db = new Database(dbPath, { create: true })

// Create migrations tracking table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS _migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    applied_at INTEGER NOT NULL DEFAULT (unixepoch())
  )
`)

// Get all applied migrations in reverse order
const appliedMigrations = db
  .prepare('SELECT name FROM _migrations ORDER BY id DESC')
  .all() as Array<{ name: string }>

if (appliedMigrations.length === 0) {
  console.log('No migrations to rollback')
  process.exit(0)
}

// Parse command line arguments
const args = process.argv.slice(2)
const rollbackTo = args.find(arg => arg.startsWith('--to='))?.split('=')[1]

let migrationsToRollback: string[]

if (rollbackTo) {
  // Rollback to specific migration
  const targetIndex = appliedMigrations.findIndex(m => m.name.startsWith(rollbackTo))
  if (targetIndex === -1) {
    console.error(`Migration ${rollbackTo} not found or not applied`)
    process.exit(1)
  }
  migrationsToRollback = appliedMigrations.slice(0, targetIndex + 1).map(m => m.name)
} else {
  // Rollback last migration only
  migrationsToRollback = [appliedMigrations[0]!.name]
}

const migrationsDir = join(import.meta.dir, '../migrations')

console.log(`Rolling back ${migrationsToRollback.length} migration(s)...\n`)

for (const migrationName of migrationsToRollback) {
  const downFile = migrationName.replace('.sql', '.down.sql')
  const downPath = join(migrationsDir, downFile)

  const downMigration = Bun.file(downPath)

  if (!(await downMigration.exists())) {
    console.error(`❌ Rollback file not found: ${downFile}`)
    console.error(`   Migration ${migrationName} cannot be rolled back`)
    process.exit(1)
  }

  try {
    console.log(`Rolling back: ${migrationName}`)
    const sql = await downMigration.text()
    db.exec(sql)

    // Remove from migrations table
    db.prepare('DELETE FROM _migrations WHERE name = ?').run(migrationName)

    console.log(`  ✅ Rolled back successfully\n`)
  } catch (error) {
    console.error(`❌ Error rolling back ${migrationName}:`)
    console.error(error)
    process.exit(1)
  }
}

db.close()

console.log('✅ Rollback completed successfully')
