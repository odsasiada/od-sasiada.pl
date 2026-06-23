import type { Payload } from 'payload'

import { afterAll, beforeAll, expect, it } from 'vitest'

import { formatSlotLabel } from '@/lib/delivery-slots'
import { getAvailableDelivery, validateChosenSlot } from '@/lib/delivery-slots-read'
import { reserveSlotAndCreateOrder } from '@/lib/slot-reservation'
import {
  createDeliveryFixtures,
  type DeliveryFixtures,
  sampleOrderData,
  teardownOrders,
} from '../setup/delivery-fixtures'
import { createFixtures, type TenantFixtures } from '../setup/fixtures'
import { describeIntegration } from '../setup/integration'
import { requireTestPayload } from '../setup/payload'

/**
 * S2.4 — delivery-slot SNAPSHOT on the order. Proves the validated occurrence is copied onto the
 * order (`date/windowStart/windowEnd/label`) at creation, that the snapshot is immune to later
 * config edits (B1), and that O8 orders (no slot) carry no `deliverySlot`. Exercises the testable
 * seam `reserveSlotAndCreateOrder` (what `placeOrder` delegates to — no `next/headers` auth).
 * DB-backed; skipped without Postgres.
 */
describeIntegration('delivery slot snapshot: placement + B1 immutability', () => {
  let payload: Payload
  let fx: TenantFixtures
  let df: DeliveryFixtures
  const createdOrderIds: number[] = []

  const orderDataFor = () => sampleOrderData(fx, fx.customerA1.id, 'snap@example.com')

  beforeAll(async () => {
    payload = await requireTestPayload()
    fx = await createFixtures(payload)
    df = await createDeliveryFixtures(payload, fx, { capacity: 10 })
  })

  afterAll(async () => {
    await teardownOrders(payload, createdOrderIds, df, fx)
  })

  it('persists the validated slot snapshot (date/window/label) on the order', async () => {
    const check = await validateChosenSlot(fx.tenantA.id, undefined)
    // sanity: tenant A has windows, so a slot is required.
    expect(check.ok).toBe(false)

    const { slots } = await getAvailableDelivery(fx.tenantA.id)
    const picked = slots[0]
    const valid = await validateChosenSlot(fx.tenantA.id, { date: picked.date, id: picked.id })
    expect(valid.ok && valid.slot).toBeTruthy()
    if (!valid.ok || !valid.slot) {
      throw new Error('expected a matched slot')
    }
    const matched = valid.slot

    const reserved = await reserveSlotAndCreateOrder(payload, orderDataFor(), {
      date: matched.date,
      id: matched.id,
      label: formatSlotLabel(matched),
      windowEnd: matched.windowEnd,
      windowStart: matched.windowStart,
    })
    expect(reserved.ok).toBe(true)
    if (!reserved.ok) {
      throw new Error(reserved.error)
    }
    createdOrderIds.push(reserved.order.id)

    const order = await payload.findByID({
      collection: 'orders',
      depth: 0,
      id: reserved.order.id,
      overrideAccess: true,
    })
    const ds = order.deliverySlot
    expect(ds?.date).toBe(matched.date)
    expect(ds?.windowStart).toBe(matched.windowStart)
    expect(ds?.windowEnd).toBe(matched.windowEnd)
    expect(ds?.label).toBe(formatSlotLabel(matched))
    // traceability relation is also stored (S2.7 recount).
    const slotId = ds && (typeof ds.slot === 'object' ? ds.slot?.id : ds.slot)
    expect(Number(slotId)).toBe(Number(matched.id))
  })

  it('B1: editing the delivery-slots config does NOT rewrite the placed order snapshot', async () => {
    const orderId = createdOrderIds[0]
    const before = await payload.findByID({ collection: 'orders', depth: 0, id: orderId, overrideAccess: true })
    const slotId = Number(
      before.deliverySlot &&
        (typeof before.deliverySlot.slot === 'object' ? before.deliverySlot.slot?.id : before.deliverySlot.slot),
    )
    const originalWindowEnd = before.deliverySlot?.windowEnd

    // Change the live config (windowEnd) — the snapshot is a COPY, not a live join.
    await payload.update({
      collection: 'delivery-slots',
      data: { windowEnd: '14:00' },
      id: slotId,
      overrideAccess: true,
    })

    const after = await payload.findByID({ collection: 'orders', depth: 0, id: orderId, overrideAccess: true })
    expect(after.deliverySlot?.windowEnd).toBe(originalWindowEnd)
    expect(after.deliverySlot?.windowEnd).not.toBe('14:00')
  })

  it('O8: an order without a slot carries no deliverySlot snapshot', async () => {
    const order = await payload.create({
      collection: 'orders',
      data: orderDataFor() as never,
      overrideAccess: true,
    })
    createdOrderIds.push(order.id)
    expect(order.deliverySlot?.date ?? null).toBeNull()
  })
})
