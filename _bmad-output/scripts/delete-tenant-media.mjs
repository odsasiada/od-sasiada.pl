/**
 * One-off (S4.6): delete the demo tenant's Media docs so `seed:production` re-uploads them
 * with addRandomSuffix:false (blob key == filename → resized variants resolve, no 404).
 *
 * Nulls products/variants hero_image_id first to avoid FK issues, then deletes media rows.
 * Orphaned (old suffixed) blobs are left behind — harmless.
 *
 * Run:
 *   set -a; . ./.env.production; set +a
 *   node _bmad-output/scripts/delete-tenant-media.mjs
 */
import { readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url)
// pg is a transitive dep (via @payloadcms/db-postgres) — not resolvable from the repo root,
// so locate it in the pnpm store.
const pnpmDir = path.resolve(process.cwd(), 'node_modules/.pnpm')
const pgPkg = readdirSync(pnpmDir).find((d) => /^pg@\d/.test(d))
if (!pgPkg) throw new Error('pg package not found under node_modules/.pnpm')
const { Client } = require(path.join(pnpmDir, pgPkg, 'node_modules/pg'))

const TENANT_SLUG = 'swieze-z-kaszub'

// Guard: without DATABASE_URL, pg falls back to PGHOST/localhost — this DESTRUCTIVE delete
// would then wipe the wrong (e.g. local dev) database. Require it explicitly.
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL not set — refusing to run destructive delete. Source .env.production first.')
}

const c = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

await c.connect()
try {
  const tid = (await c.query('select id from tenants where slug=$1', [TENANT_SLUG])).rows[0]?.id
  if (!tid) throw new Error(`Tenant ${TENANT_SLUG} not found`)

  const p = await c.query(
    'update products set hero_image_id=null where tenant_id=$1 and hero_image_id is not null',
    [tid],
  )
  let vCount = 'n/a'
  try {
    const v = await c.query(
      'update variants set hero_image_id=null where tenant_id=$1 and hero_image_id is not null',
      [tid],
    )
    vCount = String(v.rowCount)
  } catch (e) {
    vCount = `skip (${e.message})`
  }
  const d = await c.query('delete from media where tenant_id=$1', [tid])

  console.log(`tenant=${TENANT_SLUG} nulled product hero=${p.rowCount} variant hero=${vCount} deleted media=${d.rowCount}`)
} finally {
  await c.end()
}
