import { Database } from 'bun:sqlite'
import { readFileSync, existsSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'

const dbPath = process.env.DATABASE_URL || './data/nazaritor.db'

// Ensure data directory exists
const dir = dirname(dbPath)
if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true })
}

async function migrate() {
  console.log('Running migrations...')
  console.log(`Database path: ${dbPath}`)

  // Create SQLite database
  const db = new Database(dbPath, { create: true })

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON')

  try {
    // Read migration file
    const migrationPath = join(
      import.meta.dir,
      '../../../../packages/database/migrations/0000_initial.sql'
    )

    if (!existsSync(migrationPath)) {
      console.error('Migration file not found:', migrationPath)
      process.exit(1)
    }

    const migration = readFileSync(migrationPath, 'utf-8')

    // Execute the entire migration file at once
    // This handles multi-line statements like triggers correctly
    db.exec(migration)

    console.log('✅ Migrations complete!')
    console.log(`Database created at: ${dbPath}`)

    // Verify tables were created
    const tables = db
      .query("SELECT name FROM sqlite_master WHERE type='table'")
      .all() as { name: string }[]

    console.log('Tables created:', tables.map((t) => t.name).join(', '))

    db.close()
    process.exit(0)
  } catch (err) {
    console.error('Migration failed!')
    console.error(err)
    db.close()
    process.exit(1)
  }
}

migrate()
