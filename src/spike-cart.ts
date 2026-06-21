/**
 * SPIKE S1.2 — confirm `carts` plugin + multi-tenant cooperation for a logged-in customer.
 * Run: pnpm payload run src/spike-cart.ts  (dumps to /tmp/spike-cart.txt via shell redirect)
 *
 * Probes:
 *  - CREATE a carts row via Local API (overrideAccess) with customer + tenant stamped server-side.
 *  - Read it back filtered by customer; confirm tenant isolation holds.
 *  - Does multi-tenant REQUIRE a tenant on carts? Is it settable explicitly under overrideAccess?
 *  - Discover real cart line-item shape (items: {product, variant, quantity}).
 */
import { appendFileSync, writeFileSync } from 'node:fs'

import { getPayload } from 'payload'

import config from '@/payload.config'

const OUT = '/tmp/spike-cart.txt'
writeFileSync(OUT, '')
const log = (...a: unknown[]) => {
  const line = a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ')
  appendFileSync(OUT, `${line}\n`)
  console.log(line)
}

const run = async () => {
  const payload = await getPayload({ config })

  // Resolve two tenants. Tenant A = the one that has the seeded customer (swieze-z-kaszub).
  const tenants = await payload.find({ collection: 'tenants', depth: 0, limit: 10 })
  log(
    'TENANTS:',
    tenants.docs.map((t) => ({ id: t.id, slug: t.slug })),
  )
  const tenantA = tenants.docs.find((t) => t.slug === 'swieze-z-kaszub') ?? tenants.docs[0]
  const tenantB = tenants.docs.find((t) => t.id !== tenantA!.id) ?? tenants.docs[0]

  const customers = await payload.find({
    collection: 'customers',
    depth: 0,
    limit: 1,
    where: { tenant: { equals: tenantA!.id } },
  })
  const customer = customers.docs[0]
  log('CUSTOMER (tenant A):', customer ? { email: customer.email, id: customer.id } : null)

  // A product in tenant A + a product in tenant B (cross-tenant probe).
  const prodA = (
    await payload.find({ collection: 'products', depth: 0, limit: 1, where: { tenant: { equals: tenantA!.id } } })
  ).docs[0]
  const prodB = (
    await payload.find({ collection: 'products', depth: 0, limit: 1, where: { tenant: { equals: tenantB!.id } } })
  ).docs[0]
  log('PRODUCT A:', prodA ? { id: prodA.id, price: prodA.priceInPLN, tenant: prodA.tenant } : null)
  log('PRODUCT B:', prodB ? { id: prodB.id, price: prodB.priceInPLN, tenant: prodB.tenant } : null)

  // Clean any leftover carts for this customer (idempotent spike).
  await payload.delete({ collection: 'carts', where: { customer: { equals: customer!.id } } })

  // 1) CREATE cart with customer + tenant stamped server-side.
  log('\n=== 1) CREATE cart (overrideAccess, tenant+customer stamped) ===')
  let cart
  try {
    cart = await payload.create({
      collection: 'carts',
      data: {
        currency: 'PLN',
        customer: customer!.id,
        items: prodA ? [{ product: prodA.id, quantity: 2, variant: null }] : [],
        status: 'active',
        tenant: tenantA!.id,
      },
      overrideAccess: true,
    })
    const tId = typeof cart.tenant === 'object' ? cart.tenant?.id : cart.tenant
    const cId = typeof cart.customer === 'object' ? cart.customer?.id : cart.customer
    log('CREATED cart id', cart.id, 'tenant=', tId, 'customer=', cId, 'status=', cart.status)
    const items = (cart.items ?? []).map((i) => ({
      product: typeof i.product === 'object' ? i.product?.id : i.product,
      quantity: i.quantity,
      variant: typeof i.variant === 'object' ? i.variant?.id : i.variant,
    }))
    log('cart.items=', items)
  } catch (e) {
    log('CREATE FAILED:', (e as Error).message)
  }

  // 2) Read back filtered by customer.
  log('\n=== 2) Read back by customer (overrideAccess + manual where) ===')
  // NOTE: `status` is NOT a queryable path on carts → filter by customer + tenant only.
  const byCustomer = await payload.find({
    collection: 'carts',
    depth: 0,
    where: { and: [{ customer: { equals: customer!.id } }, { tenant: { equals: tenantA!.id } }] },
  })
  log('found', byCustomer.totalDocs, 'cart(s) for customer', customer!.id, 'in tenant A')

  // 3) Tenant isolation: same customer cart should NOT be retrievable under tenant B's filter.
  log('\n=== 3) Tenant isolation probe ===')
  const underTenantB = await payload.find({
    collection: 'carts',
    depth: 0,
    where: {
      and: [{ customer: { equals: customer!.id } }, { tenant: { equals: tenantB!.id } }],
    },
  })
  log('carts for this customer under tenant B filter:', underTenantB.totalDocs, '(expect 0 if A!==B)')

  // 4) Is tenant required? Try creating a cart with NO tenant.
  log('\n=== 4) Is tenant required on carts? (create without tenant) ===')
  try {
    const noTenant = await payload.create({
      collection: 'carts',
      data: { currency: 'PLN', customer: customer!.id, items: [], status: 'active' },
      overrideAccess: true,
    })
    log('created cart WITHOUT explicit tenant; resulting tenant =', noTenant.tenant, '(id', noTenant.id, ')')
    await payload.delete({ collection: 'carts', id: noTenant.id, overrideAccess: true })
  } catch (e) {
    log('create without tenant FAILED (tenant required):', (e as Error).message)
  }

  // 5) Cross-tenant line item: would we accept a tenant-B product? (we validate in app code, not plugin)
  log('\n=== 5) Cross-tenant product note ===')
  log('prodB tenant !== tenantA →', prodB && prodB.tenant !== tenantA!.id, '— app code must reject this at validation.')

  // Cleanup the spike cart.
  if (cart) {
    await payload.delete({ collection: 'carts', id: cart.id, overrideAccess: true })
    log('\ncleaned up spike cart', cart.id)
  }

  log('\nSPIKE DONE')
}

try {
  await run()
  process.exit(0)
} catch (e) {
  log('SPIKE ERROR', (e as Error)?.stack ?? String(e))
  process.exit(1)
}
