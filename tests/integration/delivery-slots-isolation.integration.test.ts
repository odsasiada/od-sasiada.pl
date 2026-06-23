import type { Payload } from 'payload'

import { afterAll, beforeAll, expect, it } from 'vitest'

import { createFixtures, type TenantFixtures } from '../setup/fixtures'
import { describeIntegration } from '../setup/integration'
import { requireTestPayload } from '../setup/payload'

/**
 * S2.1 — `DeliverySlots` tenant isolation + write validation (NFR1, AC#1/#4).
 *
 * Contract: slots are stamped with `tenant` explicitly (Local API never auto-populates it);
 * a `find` scoped to tenant A returns only A's slot (no cross-tenant leak), and the field
 * validations reject illogical/ malformed config at create time. Full capacity/concurrency
 * lives in S2.7; this is the cheap NFR1 + validation regression guard. DB-backed; skipped if
 * no Postgres is reachable.
 */
describeIntegration('delivery-slots: tenant isolation + write validation', () => {
  let payload: Payload
  let fx: TenantFixtures
  const createdSlotIds: number[] = []
  let slotAId: number

  const createSlot = async (tenantId: number, data: Record<string, unknown>): Promise<{ id: number }> => {
    const slot = await payload.create({
      collection: 'delivery-slots',
      data: { tenant: tenantId, ...data } as never,
      overrideAccess: true,
    })
    createdSlotIds.push(slot.id)
    return slot
  }

  const validSlot = {
    capacity: 10,
    cutoffDaysBefore: 1,
    cutoffTime: '18:00',
    weekday: 2,
    windowEnd: '12:00',
    windowStart: '08:00',
  }

  beforeAll(async () => {
    payload = await requireTestPayload()
    fx = await createFixtures(payload)
    const slotA = await createSlot(fx.tenantA.id, validSlot)
    slotAId = slotA.id
    await createSlot(fx.tenantB.id, { ...validSlot, weekday: 4, windowEnd: '16:00', windowStart: '14:00' })
  })

  afterAll(async () => {
    for (const id of [...createdSlotIds].reverse()) {
      try {
        await payload.delete({ collection: 'delivery-slots', id, overrideAccess: true })
      } catch {
        // already gone / cascade-deleted by tenant removal
      }
    }
    await fx?.cleanup()
  })

  it('find scoped to tenant A returns only tenant A slots (no cross-tenant leak)', async () => {
    const listA = await payload.find({
      collection: 'delivery-slots',
      limit: 200,
      overrideAccess: true,
      where: { tenant: { equals: fx.tenantA.id } },
    })
    expect(listA.totalDocs).toBe(1)
    expect(listA.docs.every((s) => s.id === slotAId)).toBe(true)
  })

  it('rejects windowEnd <= windowStart at create time', async () => {
    await expect(
      createSlot(fx.tenantA.id, { ...validSlot, windowEnd: '08:00', windowStart: '12:00' }),
    ).rejects.toBeTruthy()
  })

  it('rejects a malformed HH:mm window at create time', async () => {
    await expect(createSlot(fx.tenantA.id, { ...validSlot, windowStart: '99:99' })).rejects.toBeTruthy()
  })

  it('rejects a negative capacity at create time', async () => {
    await expect(createSlot(fx.tenantA.id, { ...validSlot, capacity: -1 })).rejects.toBeTruthy()
  })

  it('rejects a weekday outside 0..6 at create time', async () => {
    await expect(createSlot(fx.tenantA.id, { ...validSlot, weekday: 7 })).rejects.toBeTruthy()
  })
})
