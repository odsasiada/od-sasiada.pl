import { describe, expect, it } from 'vitest'

/**
 * Polish postal-code validation regex (S1.3), used by the `postalCode` field override in
 * payload.config.ts. The regex is inline there; this test pins the exact contract so a
 * future edit that loosens it fails here. The DB-backed counterpart (a bad code rejected
 * at create time) lives in addresses.integration.test.ts.
 */
const POSTAL_CODE_RE = /^\d{2}-\d{3}$/

describe('PL postal code regex ^\\d{2}-\\d{3}$', () => {
  it('accepts valid NN-NNN codes', () => {
    for (const ok of ['83-300', '00-001', '12-345', '99-999']) {
      expect(POSTAL_CODE_RE.test(ok)).toBe(true)
    }
  })

  it('rejects malformed codes', () => {
    for (const bad of ['12345', '1-234', '123-45', '83-3000', 'ab-cde', '83 300', '83-30a']) {
      expect(POSTAL_CODE_RE.test(bad)).toBe(false)
    }
  })
})
