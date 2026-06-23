import type { Payload } from 'payload'

import { afterAll, beforeAll, expect, it } from 'vitest'

import { createFixtures, type TenantFixtures } from '../setup/fixtures'
import { describeIntegration } from '../setup/integration'
import { requireTestPayload } from '../setup/payload'

/**
 * S2.8 — `DeliveryDateExceptions` tenant isolation + date validation (NFR1, AC#1/#5).
 *
 * Contract: exceptions are stamped with `tenant` explicitly; a `find` scoped to tenant A
 * returns only A's exception (no cross-tenant leak), and the `date` field rejects malformed
 * or impossible calendar dates at create time. The exclusion logic itself lives in the pure
 * `computeAvailableSlots` (tested in tests/unit/delivery-slots.test.ts) — this only guards the
 * data layer. DB-backed; skipped if no Postgres is reachable.
 */
describeIntegration('delivery-date-exceptions: tenant isolation + date validation', () => {
  let payload: Payload
  let fx: TenantFixtures
  const createdIds: number[] = []
  let exceptionAId: number

  const createException = async (tenantId: number, data: Record<string, unknown>): Promise<{ id: number }> => {
    const doc = await payload.create({
      collection: 'delivery-date-exceptions',
      data: { tenant: tenantId, ...data } as never,
      overrideAccess: true,
    })
    createdIds.push(doc.id)
    return doc
  }

  beforeAll(async () => {
    payload = await requireTestPayload()
    fx = await createFixtures(payload)
    const exA = await createException(fx.tenantA.id, { date: '2026-12-24', note: 'Wigilia' })
    exceptionAId = exA.id
    await createException(fx.tenantB.id, { date: '2026-12-25' })
  })

  afterAll(async () => {
    for (const id of [...createdIds].reverse()) {
      try {
        await payload.delete({ collection: 'delivery-date-exceptions', id, overrideAccess: true })
      } catch {
        // already gone / cascade-deleted by tenant removal
      }
    }
    await fx?.cleanup()
  })

  it('find scoped to tenant A returns only tenant A exceptions (no cross-tenant leak)', async () => {
    const listA = await payload.find({
      collection: 'delivery-date-exceptions',
      limit: 200,
      overrideAccess: true,
      where: { tenant: { equals: fx.tenantA.id } },
    })
    expect(listA.totalDocs).toBe(1)
    expect(listA.docs.every((e) => e.id === exceptionAId)).toBe(true)
  })

  it('rejects an impossible month/day (2026-13-40) at create time', async () => {
    await expect(createException(fx.tenantA.id, { date: '2026-13-40' })).rejects.toBeTruthy()
  })

  it('rejects a non-date string at create time', async () => {
    await expect(createException(fx.tenantA.id, { date: 'not-a-date' })).rejects.toBeTruthy()
  })

  it('rejects a date without zero-padding (2026-2-3) at create time', async () => {
    await expect(createException(fx.tenantA.id, { date: '2026-2-3' })).rejects.toBeTruthy()
  })

  it('rejects a non-existent calendar day (2026-02-30) at create time', async () => {
    await expect(createException(fx.tenantA.id, { date: '2026-02-30' })).rejects.toBeTruthy()
  })
})
