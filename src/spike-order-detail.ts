import { writeFileSync } from 'node:fs'

import { getPayload } from 'payload'

import config from '@/payload.config'

/**
 * S1.6: order detail isolation on the client frontend.
 * The page fetches the order with the same query `where {and:[id, customer, tenant]}`.
 * This script confirms that the `customer` (and `tenant`) clause blocks IDOR.
 *
 * Assertions:
 *  - customer A1 reads own order → 1 doc (baseline),
 *  - customer A1 reads order A2 (same tenant, different customer) → 0 docs (core IDOR),
 *  - customer A1 reads tenant B order (cross-tenant) → 0 docs,
 *  - garbage / non-existent id → 0 docs, no exception.
 * Run: `pnpm payload run src/spike-order-detail.ts`.
 */
const run = async () => {
  const payload = await getPayload({ config })
  const out: string[] = []
  const log = (l: string) => out.push(l)

  const tenants = await payload.find({ collection: 'tenants', limit: 50 })
  const tenantA = tenants.docs.find((t) => t.slug === 'swieze-z-kaszub')
  const tenantB = tenants.docs.find((t) => t.slug === 'zielony-ogrod')
  if (!tenantA || !tenantB) {
    throw new Error('Missing tenants A/B — run seed + second-tenant.')
  }

  const productA = (await payload.find({ collection: 'products', limit: 1, where: { tenant: { equals: tenantA.id } } }))
    .docs[0]
  const productB = (await payload.find({ collection: 'products', limit: 1, where: { tenant: { equals: tenantB.id } } }))
    .docs[0]
  if (!productA || !productB) {
    throw new Error('Missing products A/B — run seed + second-tenant.')
  }

  const stamp = Date.now()
  const makeCustomer = (suffix: string, tenantId: number) =>
    payload.create({
      collection: 'customers',
      data: {
        email: `idor-${suffix}-${stamp}@example.com`,
        firstName: 'Idor',
        lastName: suffix,
        password: 'idor12345',
        tenant: tenantId,
      },
    })

  const customerA1 = await makeCustomer('a1', tenantA.id)
  const customerA2 = await makeCustomer('a2', tenantA.id)
  const customerB1 = await makeCustomer('b1', tenantB.id)

  const makeOrder = (customerId: number, tenantId: number, productId: number) =>
    payload.create({
      collection: 'orders',
      data: {
        amount: 5000,
        currency: 'PLN',
        customer: customerId,
        customerEmail: `idor-${stamp}@example.com`,
        items: [{ product: productId, quantity: 1 }],
        status: 'new',
        tenant: tenantId,
      },
    })

  const orderA1 = await makeOrder(customerA1.id, tenantA.id, productA.id)
  const orderA2 = await makeOrder(customerA2.id, tenantA.id, productA.id)
  const orderB1 = await makeOrder(customerB1.id, tenantB.id, productB.id)

  // Exact page query: where { and: [id, customer, tenant] }.
  const pageQuery = async (orderId: number, customerId: number, tenantId: number) => {
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

  log('═══ S1.6: order detail isolation (where {and:[id,customer,tenant]}) ═══')
  log(`tenantA=${tenantA.id} tenantB=${tenantB.id}`)
  log(`A1=${customerA1.id} A2=${customerA2.id} B1=${customerB1.id}`)
  log(`orderA1=#${orderA1.id} orderA2=#${orderA2.id} orderB1=#${orderB1.id}`)
  log('')

  const checks: { expected: number; got: number; name: string }[] = []

  // 1. baseline — own order
  checks.push({ expected: 1, got: await pageQuery(orderA1.id, customerA1.id, tenantA.id), name: 'A1 reads own' })

  // 2. IDOR same tenant — A1 substitutes order A2 id (tenant clause passes, customer saves it)
  checks.push({
    expected: 0,
    got: await pageQuery(orderA2.id, customerA1.id, tenantA.id),
    name: 'A1 reads order A2 (same tenant) — IDOR',
  })

  // 3. cross-tenant — A1 substitutes order B1 id with own tenant A
  checks.push({
    expected: 0,
    got: await pageQuery(orderB1.id, customerA1.id, tenantA.id),
    name: 'A1 reads order B1 (cross-tenant)',
  })

  // 4. garbage / non-existent
  let garbageThrew = false
  let garbageGot = -1
  try {
    garbageGot = await pageQuery(999999999, customerA1.id, tenantA.id)
  } catch {
    garbageThrew = true
  }
  checks.push({ expected: 0, got: garbageThrew ? -1 : garbageGot, name: 'non-existent id (no exception)' })

  let allPass = true
  for (const c of checks) {
    const ok = c.got === c.expected
    allPass = allPass && ok
    log(`${ok ? 'PASS ✅' : 'FAIL ❌'} — ${c.name}: docs=${c.got} (expected ${c.expected})`)
  }
  log('')
  log(allPass ? 'RESULT: PASS ✅ — detail isolation works' : 'RESULT: FAIL ❌ — ORDER DETAIL LEAK')

  // cleanup
  await payload.delete({ collection: 'orders', id: orderA1.id })
  await payload.delete({ collection: 'orders', id: orderA2.id })
  await payload.delete({ collection: 'orders', id: orderB1.id })
  await payload.delete({ collection: 'customers', id: customerA1.id })
  await payload.delete({ collection: 'customers', id: customerA2.id })
  await payload.delete({ collection: 'customers', id: customerB1.id })

  writeFileSync('/tmp/spike-order-detail.txt', `${out.join('\n')}\n`)
  if (!allPass) {
    throw new Error('Isolation assertions failed — see /tmp/spike-order-detail.txt')
  }
}

try {
  await run()
  process.exit(0)
} catch (err) {
  writeFileSync('/tmp/spike-order-detail.txt', `SPIKE ORDER DETAIL FAILED:\n${(err as Error)?.stack ?? String(err)}\n`)
  process.exit(1)
}
