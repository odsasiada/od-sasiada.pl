import type { Payload } from 'payload'

import { afterAll, beforeAll, expect, it } from 'vitest'

import { getAvailableDelivery } from '@/lib/delivery-slots-read'
import { createFixtures, type TenantFixtures } from '../setup/fixtures'
import { describeIntegration } from '../setup/integration'
import { requireTestPayload } from '../setup/payload'

/**
 * S2.2 — `getAvailableDelivery` read path: tenant isolation (NFR1, AC#2) + feature-off (O8, AC#4)
 * + O7 exception exclusion smoke. Each slot covers a distinct weekday with same-day cutoff at
 * 23:59, so at least several concrete occurrences always fall inside the 14-day horizon
 * regardless of the wall-clock `now` the util injects. DB-backed; skipped without Postgres.
 */
describeIntegration('getAvailableDelivery: tenant isolation + feature-off + exceptions', () => {
  let payload: Payload
  let fx: TenantFixtures
  const createdSlotIds: number[] = []
  const createdExceptionIds: number[] = []
  let tenantNoSlotsId: number
  const aSlotIds = new Set<number>()
  let bSlotId: number

  const makeSlot = async (tenantId: number, weekday: number): Promise<{ id: number }> => {
    const slot = await payload.create({
      collection: 'delivery-slots',
      data: {
        capacity: 10,
        cutoffDaysBefore: 0,
        cutoffTime: '23:59',
        tenant: tenantId,
        weekday,
        windowEnd: '12:00',
        windowStart: '08:00',
      } as never,
      overrideAccess: true,
    })
    createdSlotIds.push(slot.id)
    return slot
  }

  beforeAll(async () => {
    payload = await requireTestPayload()
    fx = await createFixtures(payload)

    // Tenant A: one slot per weekday → guaranteed available occurrences within the horizon.
    for (let weekday = 0; weekday <= 6; weekday++) {
      const slot = await makeSlot(fx.tenantA.id, weekday)
      aSlotIds.add(slot.id)
    }
    // Tenant B: a single slot, to prove A never sees it.
    const bSlot = await makeSlot(fx.tenantB.id, 3)
    bSlotId = bSlot.id

    // A throwaway tenant with NO slots (feature-off case).
    const tenantNoSlots = await payload.create({
      collection: 'tenants',
      data: { name: `Test NoSlots ${Date.now()}`, settings: { isActive: true }, slug: `test-noslots-${Date.now()}` },
      overrideAccess: true,
    })
    tenantNoSlotsId = tenantNoSlots.id
  })

  afterAll(async () => {
    for (const id of [...createdExceptionIds].reverse()) {
      try {
        await payload.delete({ collection: 'delivery-date-exceptions', id, overrideAccess: true })
      } catch {
        /* best-effort */
      }
    }
    for (const id of [...createdSlotIds].reverse()) {
      try {
        await payload.delete({ collection: 'delivery-slots', id, overrideAccess: true })
      } catch {
        /* best-effort */
      }
    }
    try {
      await payload.delete({ collection: 'tenants', id: tenantNoSlotsId, overrideAccess: true })
    } catch {
      /* best-effort */
    }
    await fx?.cleanup()
  })

  it('returns deliveryEnabled and only tenant A slots (no cross-tenant leak)', async () => {
    const { deliveryEnabled, slots } = await getAvailableDelivery(fx.tenantA.id)
    expect(deliveryEnabled).toBe(true)
    expect(slots.length).toBeGreaterThan(0)
    expect(slots.every((s) => aSlotIds.has(Number(s.id)))).toBe(true)
    expect(slots.some((s) => Number(s.id) === bSlotId)).toBe(false)
  })

  it('feature-off (O8): a tenant with no slots returns deliveryEnabled=false and []', async () => {
    const { deliveryEnabled, slots } = await getAvailableDelivery(tenantNoSlotsId)
    expect(deliveryEnabled).toBe(false)
    expect(slots).toEqual([])
  })

  it('O7: an excluded date removes that day’s occurrences', async () => {
    const before = await getAvailableDelivery(fx.tenantA.id)
    const targetDate = before.slots[0]?.date
    expect(targetDate).toBeTruthy()

    const exception = await payload.create({
      collection: 'delivery-date-exceptions',
      data: { date: targetDate, tenant: fx.tenantA.id } as never,
      overrideAccess: true,
    })
    createdExceptionIds.push(exception.id)

    const after = await getAvailableDelivery(fx.tenantA.id)
    expect(after.slots.some((s) => s.date === targetDate)).toBe(false)
  })
})
