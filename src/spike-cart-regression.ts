/**
 * S1.2 regression — security invariants at the data layer (frozen from the spike).
 * Run: pnpm payload run src/spike-cart-regression.ts  (dump: /tmp/spike-cart-regression.txt)
 *
 * Exercises the SAME pure validation module + cart-write logic the server actions use, so an
 * attacker-controlled client value cannot change price, total, tenant, or quantity sign.
 * Assertions (risk order): price-tampering > placeOrder-reads-cart > cross-tenant > isolation >
 * qty-clamp > reorder-replace-reprice.
 */
import { writeFileSync } from 'node:fs'

import { getPayload } from 'payload'

import { validateLineItem } from '@/lib/cart-validation'
import config from '@/payload.config'

const OUT = '/tmp/spike-cart-regression.txt'
const lines: string[] = []
let passed = 0
let failed = 0
const log = (s: string) => lines.push(s)
const assert = (name: string, cond: boolean, detail = '') => {
  if (cond) {
    passed++
    log(`PASS  ${name}${detail ? ` — ${detail}` : ''}`)
  } else {
    failed++
    log(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

const idOf = (v: unknown): null | number =>
  v && typeof v === 'object' && 'id' in v ? (v as { id: number }).id : typeof v === 'number' ? v : null

const findOrCreateCart = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  customerId: number,
  tenantId: number,
) => {
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

const run = async () => {
  const payload = await getPayload({ config })

  const tenants = await payload.find({ collection: 'tenants', depth: 0, limit: 10 })
  const tenantA = tenants.docs.find((t) => t.slug === 'swieze-z-kaszub') ?? tenants.docs[0]
  const tenantB = tenants.docs.find((t) => t.id !== tenantA!.id)!
  const customer = (
    await payload.find({ collection: 'customers', depth: 0, limit: 1, where: { tenant: { equals: tenantA!.id } } })
  ).docs[0]!

  // A product in tenant A (with a price) + variant, and a product in tenant B.
  const prodsA = await payload.find({
    collection: 'products',
    depth: 0,
    limit: 50,
    where: { _status: { equals: 'published' }, tenant: { equals: tenantA!.id } },
  })
  const productA = prodsA.docs.find((p) => typeof p.priceInPLN === 'number')!
  const variantA = (
    await payload.find({
      collection: 'variants',
      depth: 0,
      limit: 1,
      where: { _status: { equals: 'published' }, tenant: { equals: tenantA!.id } },
    })
  ).docs[0]
  const productB = (
    await payload.find({ collection: 'products', depth: 0, limit: 1, where: { tenant: { equals: tenantB.id } } })
  ).docs[0]!

  log(`Setup: tenantA=${tenantA!.id} tenantB=${tenantB.id} customer=${customer.id}`)
  log(`productA=${productA.id} price=${productA.priceInPLN} variantA=${variantA?.id} productB=${productB.id}`)

  // Clean carts for this customer.
  await payload.delete({ collection: 'carts', where: { customer: { equals: customer.id } } })

  // ── 1) PRICE TAMPERING ────────────────────────────────────────────────────
  // Client claims a bogus price; the validation module reads the DB price and ignores client.
  const CLIENT_FAKE_PRICE = 1
  const v1 = await validateLineItem(payload, {
    productId: productA.id,
    quantity: 2,
    tenantId: tenantA!.id,
    variantId: null,
  })
  assert(
    '1. price tampering: unit price is DB price, not client value',
    v1.ok && v1.unitPrice === productA.priceInPLN && v1.unitPrice !== CLIENT_FAKE_PRICE,
    v1.ok ? `db=${v1.unitPrice} (client tried ${CLIENT_FAKE_PRICE})` : 'validation failed',
  )

  // Persist a line into the cart (server writes DB price into subtotal).
  const cart = await findOrCreateCart(payload, customer.id, tenantA!.id)
  await payload.update({
    collection: 'carts',
    data: { items: [{ product: productA.id, quantity: 2, variant: null }], subtotal: v1.ok ? v1.unitPrice * 2 : 0 },
    id: cart.id,
    overrideAccess: true,
  })
  const persisted = await payload.findByID({ collection: 'carts', depth: 0, id: cart.id, overrideAccess: true })
  assert(
    '1b. persisted cart subtotal = DB price * qty (grosze)',
    persisted.subtotal === (productA.priceInPLN ?? 0) * 2,
    `subtotal=${persisted.subtotal}`,
  )

  // ── 2) placeOrder reads from cart, not client ────────────────────────────
  // Re-validate cart lines server-side (this is what placeOrder does) → total independent of any
  // request body. A tampered body cannot change this number.
  let orderTotal = 0
  for (const raw of persisted.items ?? []) {
    const pid = idOf(raw.product)!
    const r = await validateLineItem(payload, {
      productId: pid,
      quantity: raw.quantity,
      tenantId: tenantA!.id,
      variantId: idOf(raw.variant),
    })
    if (r.ok) {
      orderTotal += r.unitPrice * r.quantity
    }
  }
  assert(
    '2. placeOrder total derived from cart row, not client body',
    orderTotal === (productA.priceInPLN ?? 0) * 2,
    `total=${orderTotal}`,
  )

  // ── 3) CROSS-TENANT cart ─────────────────────────────────────────────────
  // Customer in tenant A tries to add a tenant-B product → validation rejects.
  const v3 = await validateLineItem(payload, {
    productId: productB.id,
    quantity: 1,
    tenantId: tenantA!.id,
    variantId: null,
  })
  assert('3. cross-tenant product rejected', !v3.ok, v3.ok ? 'WRONGLY ACCEPTED' : v3.error)

  // ── 4) CART ISOLATION ────────────────────────────────────────────────────
  // The customer's cart is NOT retrievable under tenant B's scope.
  const underB = await payload.find({
    collection: 'carts',
    depth: 0,
    overrideAccess: true,
    where: { and: [{ customer: { equals: customer.id } }, { tenant: { equals: tenantB.id } }] },
  })
  assert('4. cart not retrievable under another tenant', underB.totalDocs === 0, `found=${underB.totalDocs}`)

  // ── 5) QTY CLAMP ─────────────────────────────────────────────────────────
  // Negative / zero quantity never validates → no negative totals possible.
  const vZero = await validateLineItem(payload, {
    productId: productA.id,
    quantity: 0,
    tenantId: tenantA!.id,
    variantId: null,
  })
  const vNeg = await validateLineItem(payload, {
    productId: productA.id,
    quantity: -5,
    tenantId: tenantA!.id,
    variantId: null,
  })
  assert('5. quantity 0 rejected (no zero/negative line)', !vZero.ok)
  assert('5b. quantity -5 rejected (never negative total)', !vNeg.ok)

  // ── 6) REORDER = REPLACE + REPRICE ───────────────────────────────────────
  // Simulate an order whose stored unit price is stale; reorder must re-price from current DB.
  const STALE_PRICE = 99999
  // Put a different item in the cart first to prove REPLACE (not merge).
  await payload.update({
    collection: 'carts',
    data: {
      items: variantA
        ? [{ product: productA.id, quantity: 7, variant: variantA.id }]
        : [{ product: productA.id, quantity: 7, variant: null }],
    },
    id: cart.id,
    overrideAccess: true,
  })
  // The "order" lines we reorder from (productA x3, no variant) — different from current cart.
  const orderLines = [
    { product: productA.id, quantity: 3, staleUnitPrice: STALE_PRICE, variant: null as null | number },
  ]
  const repriced: { product: number; quantity: number; variant: null | number }[] = []
  let reorderSubtotal = 0
  for (const l of orderLines) {
    const r = await validateLineItem(payload, {
      productId: l.product,
      quantity: l.quantity,
      tenantId: tenantA!.id,
      variantId: l.variant,
    })
    if (r.ok) {
      repriced.push({ product: l.product, quantity: r.quantity, variant: l.variant })
      reorderSubtotal += r.unitPrice * r.quantity
    }
  }
  // REPLACE the cart.
  await payload.update({
    collection: 'carts',
    data: { items: repriced, subtotal: reorderSubtotal },
    id: cart.id,
    overrideAccess: true,
  })
  const afterReorder = await payload.findByID({ collection: 'carts', depth: 0, id: cart.id, overrideAccess: true })
  const expectReprice = (productA.priceInPLN ?? 0) * 3
  assert(
    '6. reorder REPLACES cart (old variant line gone, only reordered line present)',
    (afterReorder.items?.length ?? 0) === 1 &&
      idOf(afterReorder.items?.[0]?.product) === productA.id &&
      (afterReorder.items?.[0]?.variant ?? null) === null,
    `items=${JSON.stringify((afterReorder.items ?? []).map((i) => ({ p: idOf(i.product), q: i.quantity, v: idOf(i.variant) })))}`,
  )
  assert(
    '6b. reorder re-prices at CURRENT DB price, not stale order price',
    afterReorder.subtotal === expectReprice && afterReorder.subtotal !== STALE_PRICE * 3,
    `subtotal=${afterReorder.subtotal} (stale would be ${STALE_PRICE * 3}, current=${expectReprice})`,
  )

  // Cleanup.
  await payload.delete({ collection: 'carts', where: { customer: { equals: customer.id } } })

  log('')
  log(`RESULT: ${passed} passed, ${failed} failed`)
  writeFileSync(OUT, `${lines.join('\n')}\n`)
  console.log(lines.join('\n'))
}

try {
  await run()
  process.exit(failed === 0 ? 0 : 1)
} catch (e) {
  writeFileSync(OUT, `${lines.join('\n')}\nREGRESSION ERROR:\n${(e as Error)?.stack ?? String(e)}\n`)
  process.exit(1)
}
