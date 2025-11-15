import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

const migrationClient = postgres(connectionString, { max: 1 })

async function main() {
  console.log('Running migrations...')

  await migrate(drizzle(migrationClient), {
    migrationsFolder: '../../packages/database/migrations',
  })

  console.log('Migrations complete!')
  process.exit(0)
}

main().catch((err) => {
  console.error('Migration failed!')
  console.error(err)
  process.exit(1)
})
