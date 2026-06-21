import type { Payload } from 'payload'

import { getPayload } from 'payload'

import config from '@/payload.config'

/**
 * Shared Payload Local API harness for integration tests.
 *
 * `getTestPayload()` initialises Payload once (lazily) and caches it. If the database
 * is unreachable, it returns null instead of throwing — callers use `describeIntegration`
 * so the whole suite is skipped (not failed) when no DB is available in the environment.
 */

let cached: Payload | null = null
let attempted = false
let initError: unknown = null

export const getTestPayload = async (): Promise<null | Payload> => {
  if (cached) {
    return cached
  }
  if (attempted) {
    return null
  }
  attempted = true
  try {
    cached = await getPayload({ config })
    // Tests must never hit real SMTP. The orders afterChange hook fires
    // `sendOrderConfirmation` (fire-and-forget) on every order create; with real Apple SMTP
    // creds that send hangs the connection pool and stalls later operations (e.g. tenant
    // cascade delete). Replace sendEmail with a no-op for the whole test run. Email *content*
    // is covered purely in tests/unit/order-emails.test.ts.
    cached.sendEmail = (async () => ({})) as typeof cached.sendEmail
    // Force an actual DB round-trip so a config that "inits" but can't reach Postgres
    // is detected here (and the suite skips) rather than failing mid-test.
    await cached.count({ collection: 'tenants' })
    return cached
  } catch (err) {
    initError = err
    cached = null
    return null
  }
}

export const getInitError = (): unknown => initError

/**
 * Like `getTestPayload`, but throws if Payload isn't available. Safe to use inside a
 * `describeIntegration` suite (that suite only runs when the DB is reachable), and lets
 * test bodies avoid non-null assertions.
 */
export const requireTestPayload = async (): Promise<Payload> => {
  const p = await getTestPayload()
  if (!p) {
    throw new Error('Payload/DB not available — this suite should have been skipped')
  }
  return p
}
