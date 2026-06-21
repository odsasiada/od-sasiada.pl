import type { Payload } from 'payload'

import { afterAll, beforeAll, expect, it } from 'vitest'

import { createFixtures, type TenantFixtures } from '../setup/fixtures'
import { describeIntegration } from '../setup/integration'
import { requireTestPayload } from '../setup/payload'

/**
 * Order detail IDOR (S1.6) — ports `src/spike-order-detail.ts` (4 cases).
 *
 * Replicates the exact query the order-detail page uses
 * (src/app/(frontend)/[tenant]/moje-zamowienia/[id]/page.tsx):
 *   where { and: [ id, customer, tenant ] }
 * so substituting another customer's/tenant's order id yields 0 docs (deny == not-found).
 * DB-backed; skipped if no Postgres is reachable.
 */
describeIntegration('order detail IDOR (where {and:[id,customer,tenant]})', () => {
  let payload: Payload
  let fx: TenantFixtures
  let orderA1: number
  let orderA2: number
  let orderB1: number

  beforeAll(async () => {
    payload = await requireTestPayload()
    fx = await createFixtures(payload)
    const make = async (customerId: number, tenantId: number, productId: number) =>
      (
        await fx.createOrder({
          amount: 5000,
          currency: 'PLN',
          customer: customerId,
          customerEmail: 'idor@example.com',
          items: [{ product: productId, quantity: 1 }],
          status: 'new',
          tenant: tenantId,
        })
      ).id
    orderA1 = await make(fx.customerA1.id, fx.tenantA.id, fx.productA.id)
    orderA2 = await make(fx.customerA2.id, fx.tenantA.id, fx.productA.id)
    orderB1 = await make(fx.customerB1.id, fx.tenantB.id, fx.productB.id)
  })

  afterAll(async () => {
    await fx?.cleanup()
  })

  // Exactly mirrors the page query.
  const pageQuery = async (orderId: number, customerId: number, tenantId: number): Promise<number> => {
    const res = await payload.find({
      collection: 'orders',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: {
        and: [{ id: { equals: orderId } }, { customer: { equals: customerId } }, { tenant: { equals: tenantId } }],
      },
    })
    return res.docs.length
  }

  it('A1 reads own order → 1 (baseline)', async () => {
    expect(await pageQuery(orderA1, fx.customerA1.id, fx.tenantA.id)).toBe(1)
  })

  it('A1 substitutes A2 order id (same tenant) → 0 (core IDOR)', async () => {
    expect(await pageQuery(orderA2, fx.customerA1.id, fx.tenantA.id)).toBe(0)
  })

  it('A1 substitutes B1 order id (cross-tenant) → 0', async () => {
    expect(await pageQuery(orderB1, fx.customerA1.id, fx.tenantA.id)).toBe(0)
  })

  it('non-existent id 999999999 → 0 and does not throw', async () => {
    await expect(pageQuery(999_999_999, fx.customerA1.id, fx.tenantA.id)).resolves.toBe(0)
  })
})
