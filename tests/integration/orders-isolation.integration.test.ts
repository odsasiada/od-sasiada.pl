import type { Payload } from 'payload'

import { afterAll, beforeAll, expect, it } from 'vitest'

import { createFixtures, type TenantFixtures } from '../setup/fixtures'
import { describeIntegration } from '../setup/integration'
import { requireTestPayload } from '../setup/payload'

/**
 * orders-tenant-isolation regression (SPIKE-A) — ports `src/spike-order-isolation.ts`
 * and the list-scoping check from `src/spike-order-list.ts` (S1.4).
 *
 * Contract: a tenant-B admin (overrideAccess:false) can neither UPDATE nor LIST tenant A's
 * order. DB-backed; skipped if no Postgres is reachable.
 */
describeIntegration('orders-tenant-isolation', () => {
  let payload: Payload
  let fx: TenantFixtures
  let orderAId: number

  beforeAll(async () => {
    payload = await requireTestPayload()
    fx = await createFixtures(payload)
    const orderA = await fx.createOrder({
      amount: 5000,
      currency: 'PLN',
      customer: fx.customerA1.id,
      customerEmail: 'iso@example.com',
      items: [{ product: fx.productA.id, quantity: 1 }],
      status: 'new',
      tenant: fx.tenantA.id,
    })
    orderAId = orderA.id
  })

  afterAll(async () => {
    await fx?.cleanup()
  })

  it('tenant-B admin cannot update tenant A order status (blocked or unchanged)', async () => {
    let blocked = false
    try {
      await payload.update({
        collection: 'orders',
        data: { status: 'confirmed' },
        id: orderAId,
        overrideAccess: false,
        user: fx.adminBUser as never,
      })
    } catch {
      blocked = true
    }
    const after = await payload.findByID({ collection: 'orders', id: orderAId, overrideAccess: true })
    // Isolation holds if the update was blocked OR the status did not change.
    expect(blocked || after.status === 'new').toBe(true)
  })

  it('S1.4: tenant-B admin order list returns 0 docs and A order is absent', async () => {
    const listB = await payload.find({
      collection: 'orders',
      limit: 200,
      overrideAccess: false,
      user: fx.adminBUser as never,
    })
    expect(listB.totalDocs).toBe(0)
    expect(listB.docs.some((o) => o.id === orderAId)).toBe(false)
  })
})
