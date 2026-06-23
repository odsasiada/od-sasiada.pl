import { describe } from 'vitest'

import { getTestPayload } from './payload'

/**
 * `describeIntegration` runs a DB-backed suite only when Payload + Postgres are reachable.
 * Otherwise the suite is skipped (reported as skipped, not failed), so the test run still
 * passes in environments without a database — the pure-logic suites always run.
 *
 * Probing happens once, before suites are registered, so the skip is decided synchronously.
 */
const dbReachable = (await getTestPayload()) !== null

export const describeIntegration = dbReachable ? describe : describe.skip
export const integrationAvailable = dbReachable
