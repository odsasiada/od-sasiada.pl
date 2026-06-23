import type { Payload } from 'payload'

import { afterAll, beforeAll, expect, it } from 'vitest'

import { getAvailableDelivery } from '@/lib/delivery-slots-read'
import { createDeliveryFixtures, type DeliveryFixtures } from '../setup/delivery-fixtures'
import { createFixtures, type TenantFixtures } from '../setup/fixtures'
import { describeIntegration } from '../setup/integration'
import { requireTestPayload } from '../setup/payload'

/**
 * S2.2 — `getAvailableDelivery` read path: tenant isolation (NFR1, AC#2) + feature-off (O8, AC#4)
 * + O7 exception exclusion smoke. Slots cover every weekday with same-day cutoff at 23:59, so
 * several concrete occurrences always fall inside the 14-day horizon regardless of the wall-clock
 * `now` the util injects. DB-backed; skipped without Postgres.
 */
describeIntegration('getAvailableDelivery: tenant isolation + feature-off + exceptions', () => {
  let payload: Payload
  let fx: TenantFixtures
  let df: DeliveryFixtures

  beforeAll(async () => {
    payload = await requireTestPayload()
    fx = await createFixtures(payload)
    df = await createDeliveryFixtures(payload, fx)
  })

  afterAll(async () => {
    await df?.cleanup()
    await fx?.cleanup()
  })

  it('returns deliveryEnabled and only tenant A slots (no cross-tenant leak)', async () => {
    const { deliveryEnabled, slots } = await getAvailableDelivery(fx.tenantA.id)
    expect(deliveryEnabled).toBe(true)
    expect(slots.length).toBeGreaterThan(0)
    expect(slots.every((s) => df.aSlotIds.has(Number(s.id)))).toBe(true)
    expect(slots.some((s) => Number(s.id) === df.bSlotId)).toBe(false)
  })

  it('feature-off (O8): a tenant with no slots returns deliveryEnabled=false and []', async () => {
    const { deliveryEnabled, slots } = await getAvailableDelivery(df.tenantNoSlotsId)
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
    df.trackException(exception.id)

    const after = await getAvailableDelivery(fx.tenantA.id)
    expect(after.slots.some((s) => s.date === targetDate)).toBe(false)
  })
})
