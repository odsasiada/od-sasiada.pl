import type { Payload } from 'payload'
import type { OrderStatusValue } from '@/ecommerce/order-status'

import { afterAll, beforeAll, expect, it } from 'vitest'

import { createFixtures, type TenantFixtures } from '../setup/fixtures'
import { describeIntegration } from '../setup/integration'
import { requireTestPayload } from '../setup/payload'

/**
 * Status machine enforced through the DB (S1.5) — ports `src/spike-status-machine.ts`.
 * Drives `payload.update` so the `validateStatusTransition` beforeChange hook is exercised
 * end-to-end (the pure predicate is also unit-tested in tests/unit/order-status.test.ts).
 * DB-backed; skipped if no Postgres is reachable.
 */
describeIntegration('order status machine (via Payload update)', () => {
  let payload: Payload
  let fx: TenantFixtures
  let orderId: number

  beforeAll(async () => {
    payload = await requireTestPayload()
    fx = await createFixtures(payload)
    const order = await fx.createOrder({
      amount: 5000,
      currency: 'PLN',
      customer: fx.customerA1.id,
      customerEmail: 'sm@example.com',
      items: [{ product: fx.productA.id, quantity: 1 }],
      status: 'new',
      tenant: fx.tenantA.id,
    })
    orderId = order.id
  })

  afterAll(async () => {
    await fx?.cleanup()
  })

  const tryUpdate = async (to: OrderStatusValue): Promise<boolean> => {
    try {
      await payload.update({ collection: 'orders', data: { status: to }, id: orderId, overrideAccess: true })
      return true
    } catch {
      return false
    }
  }

  // These run sequentially and walk the order through states (matching the spike's order).
  it('forbids skipping new → preparing', async () => {
    expect(await tryUpdate('preparing')).toBe(false)
  })
  it('allows step new → confirmed', async () => {
    expect(await tryUpdate('confirmed')).toBe(true)
  })
  it('allows step confirmed → preparing', async () => {
    expect(await tryUpdate('preparing')).toBe(true)
  })
  it('allows rollback preparing → new', async () => {
    expect(await tryUpdate('new')).toBe(true)
  })
  it('allows re-confirm new → confirmed', async () => {
    expect(await tryUpdate('confirmed')).toBe(true)
  })
  it('forbids skipping confirmed → out_for_delivery', async () => {
    expect(await tryUpdate('out_for_delivery')).toBe(false)
  })
  it('allows cancel confirmed → cancelled', async () => {
    expect(await tryUpdate('cancelled')).toBe(true)
  })
  it('allows reactivate cancelled → new', async () => {
    expect(await tryUpdate('new')).toBe(true)
  })
  it('forbids skipping new → delivered', async () => {
    expect(await tryUpdate('delivered')).toBe(false)
  })
})
