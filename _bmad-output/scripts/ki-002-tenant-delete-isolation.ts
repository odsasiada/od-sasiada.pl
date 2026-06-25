import { writeFileSync } from 'node:fs'

import { getPayload } from 'payload'

import config from '@/payload.config'

/**
 * KI-002 — tenant-delete isolation test & targeted cleanup (Payload Local API).
 *
 * WHY: deleting a tenant via the admin panel hangs (idle-in-transaction lock in
 * the long-running Next dev server). This standalone process runs the SAME
 * `deleteByID` path WITHOUT Next.js/HMR, to prove whether the hang is in
 * Payload/Postgres (then it hangs here too) or environmental (then it's fast).
 * See _bmad-output/KNOWN_ISSUES.md → KI-002.
 *
 * USAGE (must be run via `payload run` — it needs the top-level await + config):
 *   # Isolation test: create a throwaway tenant, delete it by id, time it.
 *   pnpm payload run _bmad-output/scripts/ki-002-tenant-delete-isolation.ts
 *
 *   # Targeted cleanup: delete specific tenant ids (space/comma separated).
 *   pnpm payload run _bmad-output/scripts/ki-002-tenant-delete-isolation.ts 853 854 877
 *
 * GOTCHAS (learned the hard way — see KI-002):
 *   - `payload run` requires TOP-LEVEL await (like src/seed.ts). A fire-and-forget
 *     `run().catch()` makes the process exit before the work finishes.
 *   - `payload.logger`/pino drops logs on `process.exit()` (transport worker never
 *     flushes). We mirror output to a file via fs.writeFileSync and close the pool
 *     cleanly with `payload.db.destroy()` instead of exiting mid-flight.
 */

/** Tenants that must NEVER be deleted by this script (id 1 = canonical seed supplier). */
const PROTECTED = new Set<number>([1])
const RESULT = '/tmp/ki-002-tenant-delete.log'

const log = (line: string) => {
  console.log(line)
  writeFileSync(RESULT, `${new Date().toISOString()} ${line}\n`, { flag: 'a' })
}

const parseIds = (argv: string[]): number[] =>
  argv
    .flatMap((a) => a.split(','))
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const n = Number(s)
      if (!Number.isInteger(n)) throw new Error(`Not an integer tenant id: "${s}"`)
      return n
    })

const run = async () => {
  writeFileSync(RESULT, '')
  const ids = parseIds(process.argv.slice(2))

  // Safety net — refuse before booting if any target is protected.
  for (const id of ids) {
    if (PROTECTED.has(id)) throw new Error(`Refusing to delete protected tenant ${id}`)
  }

  const watchdog = setTimeout(() => {
    log(
      '⛔ HANG DETECTED — a deleteByID did not return within 60s → bug IS in Payload/Postgres layer (lock/idle-in-tx), not just the Next dev server.',
    )
    process.exit(2)
  }, 60_000)
  watchdog.unref?.()

  const payload = await getPayload({ config })

  if (ids.length === 0) {
    // Isolation mode: create a throwaway tenant and delete it by id.
    const tenant = await payload.create({
      collection: 'tenants',
      data: { name: '__ki002_isolation_test__', slug: `__ki002_${Date.now()}__` },
    })
    log(`[isolation] created throwaway tenant id=${tenant.id}`)
    const t0 = Date.now()
    await payload.delete({ collection: 'tenants', id: tenant.id })
    log(`[isolation] ✅ deleteByID returned in ${Date.now() - t0}ms — NO hang via Local API.`)
  } else {
    // Targeted cleanup mode.
    for (const id of ids) {
      const t0 = Date.now()
      await payload.delete({ collection: 'tenants', id })
      log(`[cleanup] ✅ deleted tenant ${id} in ${Date.now() - t0}ms`)
    }
  }

  clearTimeout(watchdog)
  const remaining = await payload.find({ collection: 'tenants', depth: 0, limit: 200 })
  log(
    `[done] remaining tenants: ${remaining.docs
      .map((d) => d.id)
      .sort((a, b) => Number(a) - Number(b))
      .join(', ')}`,
  )

  await payload.db.destroy?.()
}

try {
  await run()
  process.exit(0)
} catch (err) {
  log(`❌ Script failed: ${(err as Error)?.stack ?? String(err)}`)
  process.exit(1)
}
