import type { Payload } from 'payload'

import { afterAll, beforeAll, expect, it } from 'vitest'

import { getAvailableDelivery, validateChosenSlot } from '@/lib/delivery-slots-read'
import { createDeliveryFixtures, type DeliveryFixtures } from '../setup/delivery-fixtures'
import { createFixtures, type TenantFixtures } from '../setup/fixtures'
import { describeIntegration } from '../setup/integration'
import { requireTestPayload } from '../setup/payload'

/**
 * S2.3 — `validateChosenSlot` server-side cutoff/validity guard (O2, O7, O8; R-S2.2).
 *
 * This is the exact guard `placeOrder` calls before creating an order. We exercise it directly
 * against the DB (the repo convention — cf. cart-validation testing `validateLineItem` rather
 * than the full `placeOrder`, which needs a Next request context for `next/headers` auth). It
 * reuses the pure `computeAvailableSlots`, so the membership check covers cutoff/past/excluded/
 * foreign-tenant/capacity<=0 in one shot. DB-backed; skipped without Postgres.
 */
describeIntegration('validateChosenSlot: server-side slot validation (O2/O7/O8)', () => {
  let payload: Payload
  let fx: TenantFixtures
  let df: DeliveryFixtures
  let aSlotId: number

  beforeAll(async () => {
    payload = await requireTestPayload()
    fx = await createFixtures(payload)
    df = await createDeliveryFixtures(payload, fx)
    aSlotId = [...df.aSlotIds][0]
  })

  afterAll(async () => {
    await df?.cleanup()
    await fx?.cleanup()
  })

  it('accepts a real available occurrence (AC1)', async () => {
    const { slots } = await getAvailableDelivery(fx.tenantA.id)
    const result = await validateChosenSlot(fx.tenantA.id, { date: slots[0].date, id: slots[0].id })
    expect(result.ok).toBe(true)
  })

  it('rejects a past date for a real slot id (AC2)', async () => {
    const result = await validateChosenSlot(fx.tenantA.id, { date: '2020-01-01', id: aSlotId })
    expect(result.ok).toBe(false)
  })

  it('rejects a foreign tenant’s slot id (NFR1 / AC2)', async () => {
    const { slots } = await getAvailableDelivery(fx.tenantA.id)
    const result = await validateChosenSlot(fx.tenantA.id, { date: slots[0].date, id: df.bSlotId })
    expect(result.ok).toBe(false)
  })

  it('O8 on: rejects a missing slot when the tenant has windows (AC3)', async () => {
    const result = await validateChosenSlot(fx.tenantA.id, undefined)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe('Wybierz termin dostawy.')
    }
  })

  it('O8 off: passes when the tenant has no windows, even with no slot (AC3)', async () => {
    const result = await validateChosenSlot(df.tenantNoSlotsId, undefined)
    expect(result.ok).toBe(true)
  })

  it('O7: rejects an occurrence whose date has been excluded', async () => {
    const before = await getAvailableDelivery(fx.tenantA.id)
    const target = before.slots[0]
    const exception = await payload.create({
      collection: 'delivery-date-exceptions',
      data: { date: target.date, tenant: fx.tenantA.id } as never,
      overrideAccess: true,
    })
    df.trackException(exception.id)

    const result = await validateChosenSlot(fx.tenantA.id, { date: target.date, id: target.id })
    expect(result.ok).toBe(false)
  })
})
