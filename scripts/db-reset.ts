/**
 * Full local DB reset:
 * 1) DROP + CREATE the Postgres database
 * 2) prisma generate + db push
 * 3) regenerate catalog JSON
 * 4) seed users, stores, categories, products (prisma/seed.ts)
 *
 * Usage: yarn db:reset
 */
import 'dotenv/config'
import { spawnSync } from 'node:child_process'
import pg from 'pg'

function parseDatabaseUrl(urlString: string) {
  const url = new URL(urlString)
  const database = decodeURIComponent(url.pathname.replace(/^\//, ''))
  if (!database) {
    throw new Error('DATABASE_URL is missing a database name')
  }

  const adminUrl = new URL(urlString)
  adminUrl.pathname = '/postgres'

  return { database, adminUrl: adminUrl.toString(), appUrl: urlString }
}

function run(command: string, args: string[]) {
  console.log(`\n→ ${command} ${args.join(' ')}`)
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  })
  if (result.status !== 0) {
    throw new Error(`Command failed (${result.status}): ${command} ${args.join(' ')}`)
  }
}

async function dropAndCreateDatabase() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set')
  }
  if (databaseUrl.startsWith('prisma://') || databaseUrl.startsWith('prisma+postgres://')) {
    throw new Error('db:reset requires DATABASE_URL as a postgres:// TCP URL (not Accelerate)')
  }

  const { database, adminUrl } = parseDatabaseUrl(databaseUrl)
  if (database === 'postgres') {
    throw new Error('Refusing to drop the maintenance database "postgres"')
  }

  console.log(`\n🗑  Dropping database "${database}"...`)
  const client = new pg.Client({ connectionString: adminUrl })
  await client.connect()

  try {
    await client.query(
      `
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = $1 AND pid <> pg_backend_pid()
      `,
      [database],
    )
    await client.query(`DROP DATABASE IF EXISTS "${database}"`)
    await client.query(`CREATE DATABASE "${database}"`)
    console.log(`✅ Recreated empty database "${database}"`)
  } finally {
    await client.end()
  }
}

async function main() {
  console.log('🔁 CartPulse DB reset (drop → push → seed users + products)\n')

  await dropAndCreateDatabase()

  run('yarn', ['prisma', 'generate'])
  run('yarn', ['prisma', 'db', 'push'])
  run('yarn', ['generate:data'])
  run('yarn', ['db:seed'])

  console.log('\n🎉 DB reset complete. Demo logins:')
  console.log('   admin@platform.com / password123')
  console.log('   customer@demo.com / password123')
  console.log('\n⚠️  After reset, clear browser localStorage + sign out (see README).\n')
}

main().catch((error) => {
  console.error('\n❌ db:reset failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})
