import type { Payload } from 'payload'

import { afterAll, beforeAll, expect, it } from 'vitest'

import { createFixtures, type TenantFixtures } from '../setup/fixtures'
import { describeIntegration } from '../setup/integration'
import { requireTestPayload } from '../setup/payload'

/**
 * Order placement (ports `src/place-order.ts`) — verifies the orders override in
 * src/ecommerce/orders.ts: a readable `orderNumber` (ZAM-RRRR-NNNNN) generated on create,
 * and per-line snapshots (name / variant label / unit price in grosze) copied at placement.
 * DB-backed; skipped if no Postgres is reachable.
 */
describeIntegration('order placement: order number + line snapshots', () => {
  let payload: Payload
  let fx: TenantFixtures
  let orderId: number

  beforeAll(async () => {
    payload = await requireTestPayload()
    fx = await createFixtures(payload)
    const variantA = fx.variantA
    const lines = [
      { product: fx.productA.id, quantity: 12, variant: null as null | number },
      { product: variantA.productId, quantity: 1, variant: variantA.id },
    ]
    const amount = fx.productA.priceInPLN * 12 + variantA.priceInPLN * 1
    const order = await fx.createOrder({
      amount,
      currency: 'PLN',
      customer: fx.customerA1.id,
      customerEmail: 'place@example.com',
      items: lines,
      shippingAddress: {
        addressLine1: 'ul. Kaszubska 12',
        city: 'Kartuzy',
        country: 'PL',
        firstName: 'Anna',
        lastName: 'Kowalska',
        phone: '600 100 200',
        postalCode: '83-300',
      },
      status: 'new',
      tenant: fx.tenantA.id,
    })
    orderId = order.id
  })

  afterAll(async () => {
    await fx?.cleanup()
  })

  it('generates an order number in ZAM-RRRR-NNNNN format', async () => {
    const order = await payload.findByID({ collection: 'orders', id: orderId, overrideAccess: true })
    expect(order.orderNumber).toMatch(/^ZAM-\d{4}-\d{5}$/)
  })

  it('snapshots product name and DB unit price onto each line', async () => {
    const order = (await payload.findByID({ collection: 'orders', id: orderId, overrideAccess: true })) as {
      items?: { unitPriceSnapshot?: null | number; variantLabelSnapshot?: null | string }[]
    }
    const items = order.items ?? []
    expect(items.length).toBe(2)
    // simple line: unit price snapshot = product DB price
    expect(items[0]?.unitPriceSnapshot).toBe(fx.productA.priceInPLN)
    // variant line: unit price snapshot = variant DB price, variant label captured
    expect(items[1]?.unitPriceSnapshot).toBe(fx.variantA.priceInPLN)
    expect(items[1]?.variantLabelSnapshot).toBeTruthy()
  })
})
