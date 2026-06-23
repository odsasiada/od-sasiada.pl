import type { Payload } from 'payload'

import { afterAll, beforeAll, expect, it } from 'vitest'

import { getAvailableDelivery } from '@/lib/delivery-slots-read'
import { countActiveOrdersForOccurrence } from '@/lib/slot-capacity'
import { reserveSlotAndCreateOrder } from '@/lib/slot-reservation'
import { createDeliveryFixtures, type DeliveryFixtures } from '../setup/delivery-fixtures'
import { createFixtures, type TenantFixtures } from '../setup/fixtures'
import { describeIntegration } from '../setup/integration'
import { requireTestPayload } from '../setup/payload'

/**
 * S2.7 — race-safe capacity (O4) gate. Exercises `reserveSlotAndCreateOrder` (the testable core
 * that `placeOrder` delegates to — no `next/headers` auth needed) and the `cancelled → new`
 * reactivation hook. The anti-overbooking proof (AC#2) runs two reservations of the SAME
 * occurrence concurrently: the advisory lock lives in Postgres, so `Promise.all` on one Payload
 * instance is a real race. Slots are created with `capacity: 1` via the shared fixture.
 * DB-backed; skipped without Postgres.
 */
describeIntegration('delivery capacity: race-safe reservation + lifecycle', () => {
  let payload: Payload
  let fx: TenantFixtures
  let df: DeliveryFixtures
  const createdOrderIds: number[] = []
  let occurrence: { date: string; id: number }

  const orderDataFor = (customerId: number) => ({
    amount: fx.productA.priceInPLN,
    currency: 'PLN' as const,
    customer: customerId,
    customerEmail: 'cap@example.com',
    items: [{ product: fx.productA.id, quantity: 1 }],
    shippingAddress: {
      addressLine1: 'ul. Testowa 1',
      city: 'Kartuzy',
      country: 'PL',
      firstName: 'A',
      lastName: 'B',
      phone: '600100200',
      postalCode: '83-300',
    },
    status: 'new' as const,
    tenant: fx.tenantA.id,
  })

  const reserve = async (customerId: number) => {
    const res = await reserveSlotAndCreateOrder(payload, orderDataFor(customerId), occurrence)
    if (res.ok) {
      createdOrderIds.push(res.order.id)
    }
    return res
  }

  const activeCount = () => countActiveOrdersForOccurrence(payload, occurrence.id, occurrence.date)

  beforeAll(async () => {
    payload = await requireTestPayload()
    fx = await createFixtures(payload)
    df = await createDeliveryFixtures(payload, fx, { capacity: 1 })
    const { slots } = await getAvailableDelivery(fx.tenantA.id)
    occurrence = { date: slots[0].date, id: Number(slots[0].id) }
  })

  afterAll(async () => {
    for (const id of [...createdOrderIds].reverse()) {
      try {
        await payload.delete({ collection: 'orders', id, overrideAccess: true })
      } catch {
        /* best-effort */
      }
    }
    await df?.cleanup()
    await fx?.cleanup()
  })

  it('anti-overbooking: two concurrent reservations of the last seat → exactly one wins (AC#2)', async () => {
    const [r1, r2] = await Promise.all([reserve(fx.customerA1.id), reserve(fx.customerA2.id)])
    expect([r1, r2].filter((r) => r.ok).length).toBe(1)
    expect([r1, r2].filter((r) => !r.ok).length).toBe(1)
    expect(await activeCount()).toBe(1) // capacity respected — no overbooking
  })

  it('cancelling frees the seat (recount excludes cancelled)', async () => {
    // Occurrence is full (capacity 1) from the previous test → a new reservation is rejected.
    expect((await reserve(fx.customerA1.id)).ok).toBe(false)

    // Cancel the active order → seat freed.
    await payload.update({
      collection: 'orders',
      data: { status: 'cancelled' },
      id: createdOrderIds[0],
      overrideAccess: true,
    })

    expect((await reserve(fx.customerA2.id)).ok).toBe(true)
    expect(await activeCount()).toBe(1)
  })

  it('reactivation cancelled→new is rejected when the occurrence is full (AC#6)', async () => {
    // State: one active order holds the only seat; one cancelled order exists on the occurrence.
    const cancelled = (
      await payload.find({
        collection: 'orders',
        overrideAccess: true,
        where: {
          and: [
            { 'deliverySlot.slot': { equals: occurrence.id } },
            { 'deliverySlot.date': { equals: occurrence.date } },
            { status: { equals: 'cancelled' } },
          ],
        },
      })
    ).docs[0]
    expect(cancelled).toBeTruthy()

    await expect(
      payload.update({ collection: 'orders', data: { status: 'new' }, id: cancelled.id, overrideAccess: true }),
    ).rejects.toThrow(/pełny/)
  })

  it('O8: a cancelled order WITHOUT a slot reactivates freely (no capacity logic)', async () => {
    const order = await payload.create({
      collection: 'orders',
      data: { ...orderDataFor(fx.customerA1.id), status: 'cancelled' } as never,
      overrideAccess: true,
    })
    createdOrderIds.push(order.id)
    const reactivated = await payload.update({
      collection: 'orders',
      data: { status: 'new' },
      id: order.id,
      overrideAccess: true,
    })
    expect(reactivated.status).toBe('new')
  })
})
