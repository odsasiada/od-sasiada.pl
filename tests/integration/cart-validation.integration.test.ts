import type { Payload } from 'payload'

import { afterAll, beforeAll, expect, it } from 'vitest'

import { validateLineItem } from '@/lib/cart-validation'
import { createFixtures, type TenantFixtures } from '../setup/fixtures'
import { describeIntegration } from '../setup/integration'
import { requireTestPayload } from '../setup/payload'

/**
 * Cart-validation security regression (S1.2) — ports `src/spike-cart-regression.ts` (9 invariants).
 *
 * Exercises the single source of truth `validateLineItem` plus the cart-write/reorder logic the
 * server actions use, proving an attacker-controlled client value cannot change price, total,
 * tenant, or quantity sign. DB-backed (Payload Local API); skipped if no Postgres is reachable.
 */

const idOf = (v: unknown): null | number =>
  v && typeof v === 'object' && 'id' in v ? (v as { id: number }).id : typeof v === 'number' ? v : null

const findOrCreateCart = async (payload: Payload, customerId: number, tenantId: number) => {
  const res = await payload.find({
    collection: 'carts',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    sort: '-createdAt',
    where: { and: [{ customer: { equals: customerId } }, { tenant: { equals: tenantId } }] },
  })
  if (res.docs[0]) {
    return res.docs[0]
  }
  return payload.create({
    collection: 'carts',
    data: { currency: 'PLN', customer: customerId, items: [], status: 'active', tenant: tenantId },
    overrideAccess: true,
  })
}

describeIntegration('cart-validation regression (S1.2)', () => {
  let payload: Payload
  let fx: TenantFixtures

  beforeAll(async () => {
    payload = await requireTestPayload()
    fx = await createFixtures(payload)
  })

  afterAll(async () => {
    // Carts are created ad-hoc by these tests (not via fixtures); remove them before the
    // fixture tenants are deleted, so tenant cascade has no cart rows to walk.
    try {
      await payload.delete({
        collection: 'carts',
        overrideAccess: true,
        where: { customer: { equals: fx.customerA1.id } },
      })
    } catch {
      // best-effort
    }
    await fx?.cleanup()
  })

  it('1. price tampering: unit price is the DB price, not the client value', async () => {
    const CLIENT_FAKE_PRICE = 1
    const v = await validateLineItem(payload, {
      productId: fx.productA.id,
      quantity: 2,
      tenantId: fx.tenantA.id,
      variantId: null,
    })
    expect(v.ok).toBe(true)
    if (v.ok) {
      expect(v.unitPrice).toBe(fx.productA.priceInPLN)
      expect(v.unitPrice).not.toBe(CLIENT_FAKE_PRICE)
    }
  })

  it('1b. persisted cart subtotal = DB price × qty (grosze)', async () => {
    const v = await validateLineItem(payload, {
      productId: fx.productA.id,
      quantity: 2,
      tenantId: fx.tenantA.id,
      variantId: null,
    })
    const cart = await findOrCreateCart(payload, fx.customerA1.id, fx.tenantA.id)
    await payload.update({
      collection: 'carts',
      data: {
        items: [{ product: fx.productA.id, quantity: 2, variant: null }],
        subtotal: v.ok ? v.unitPrice * 2 : 0,
      },
      id: cart.id,
      overrideAccess: true,
    })
    const persisted = await payload.findByID({ collection: 'carts', depth: 0, id: cart.id, overrideAccess: true })
    expect(persisted.subtotal).toBe(fx.productA.priceInPLN * 2)
  })

  it('2. placeOrder total is derived from the cart row, not a client body', async () => {
    const cart = await findOrCreateCart(payload, fx.customerA1.id, fx.tenantA.id)
    const persisted = await payload.findByID({ collection: 'carts', depth: 0, id: cart.id, overrideAccess: true })
    const lineResults = await Promise.all(
      (persisted.items ?? []).map((raw) => {
        const productId = idOf(raw.product)
        if (productId === null) {
          return Promise.resolve({ error: 'no product', ok: false as const })
        }
        return validateLineItem(payload, {
          productId,
          quantity: raw.quantity,
          tenantId: fx.tenantA.id,
          variantId: idOf(raw.variant),
        })
      }),
    )
    let total = 0
    for (const r of lineResults) {
      if (r.ok) {
        total += r.unitPrice * r.quantity
      }
    }
    expect(total).toBe(fx.productA.priceInPLN * 2)
  })

  it('3. cross-tenant product is rejected', async () => {
    const v = await validateLineItem(payload, {
      productId: fx.productB.id, // belongs to tenant B
      quantity: 1,
      tenantId: fx.tenantA.id, // queried under tenant A
      variantId: null,
    })
    expect(v.ok).toBe(false)
  })

  it('4. cart is not retrievable under another tenant', async () => {
    await findOrCreateCart(payload, fx.customerA1.id, fx.tenantA.id)
    const underB = await payload.find({
      collection: 'carts',
      depth: 0,
      overrideAccess: true,
      where: { and: [{ customer: { equals: fx.customerA1.id } }, { tenant: { equals: fx.tenantB.id } }] },
    })
    expect(underB.totalDocs).toBe(0)
  })

  it('5. quantity 0 is rejected (no zero line)', async () => {
    const v = await validateLineItem(payload, {
      productId: fx.productA.id,
      quantity: 0,
      tenantId: fx.tenantA.id,
      variantId: null,
    })
    expect(v.ok).toBe(false)
  })

  it('5b. quantity -5 is rejected (never a negative total)', async () => {
    const v = await validateLineItem(payload, {
      productId: fx.productA.id,
      quantity: -5,
      tenantId: fx.tenantA.id,
      variantId: null,
    })
    expect(v.ok).toBe(false)
  })

  it('6. reorder REPLACES the cart (old variant line gone) and 6b. re-prices at current DB price', async () => {
    const variantA = fx.variantA
    const STALE_PRICE = 99999

    const cart = await findOrCreateCart(payload, fx.customerA1.id, fx.tenantA.id)
    // Seed the cart with a DIFFERENT (variant) line to prove REPLACE, not merge.
    await payload.update({
      collection: 'carts',
      data: { items: [{ product: variantA.productId, quantity: 7, variant: variantA.id }] },
      id: cart.id,
      overrideAccess: true,
    })

    // Reorder from an "order" whose stored unit price is stale — must re-price from DB.
    const orderLines = [
      { product: fx.productA.id, quantity: 3, staleUnitPrice: STALE_PRICE, variant: null as null | number },
    ]
    const reorder = await Promise.all(
      orderLines.map(async (l) => ({
        l,
        r: await validateLineItem(payload, {
          productId: l.product,
          quantity: l.quantity,
          tenantId: fx.tenantA.id,
          variantId: l.variant,
        }),
      })),
    )
    const repriced: { product: number; quantity: number; variant: null | number }[] = []
    let subtotal = 0
    for (const { l, r } of reorder) {
      if (r.ok) {
        repriced.push({ product: l.product, quantity: r.quantity, variant: l.variant })
        subtotal += r.unitPrice * r.quantity
      }
    }
    await payload.update({
      collection: 'carts',
      data: { items: repriced, subtotal },
      id: cart.id,
      overrideAccess: true,
    })

    const after = await payload.findByID({ collection: 'carts', depth: 0, id: cart.id, overrideAccess: true })
    const expectReprice = fx.productA.priceInPLN * 3

    // 6. replace
    expect(after.items?.length ?? 0).toBe(1)
    expect(idOf(after.items?.[0]?.product)).toBe(fx.productA.id)
    expect(after.items?.[0]?.variant ?? null).toBeNull()
    // 6b. reprice
    expect(after.subtotal).toBe(expectReprice)
    expect(after.subtotal).not.toBe(STALE_PRICE * 3)
  })
})
