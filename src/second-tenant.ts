import { writeFileSync } from 'node:fs'

import { getPayload } from 'payload'

import config from '@/payload.config'

/**
 * Creates a second supplier (tenant B) with its own products and a tenant-admin
 * assigned only to it, then tests data isolation:
 * tenant-admin B cannot see supplier A's products / orders / customers.
 * Run: `pnpm payload run src/second-tenant.ts`.
 */
const run = async () => {
  const payload = await getPayload({ config })

  const out: string[] = []
  const log = (line: string) => out.push(line)

  // ── Supplier A (existing) ────────────────────────────────────────────────
  const tenantsA = await payload.find({
    collection: 'tenants',
    limit: 1,
    where: { slug: { equals: 'swieze-z-kaszub' } },
  })
  const tenantA = tenantsA.docs[0]
  if (!tenantA) {
    throw new Error('Missing supplier A — run `pnpm seed`.')
  }

  // ── Clean up previous B (idempotent) ────────────────────────────────────
  const oldB = await payload.find({ collection: 'tenants', limit: 1, where: { slug: { equals: 'zielony-ogrod' } } })
  for (const t of oldB.docs) {
    await payload.delete({ collection: 'tenants', id: t.id })
  }
  const oldUser = await payload.find({
    collection: 'users',
    limit: 1,
    where: { email: { equals: 'dostawca-b@od-sasiada.pl' } },
  })
  for (const u of oldUser.docs) {
    await payload.delete({ collection: 'users', id: u.id })
  }

  // ── Supplier B ───────────────────────────────────────────────────────────
  const tenantB = await payload.create({
    collection: 'tenants',
    data: {
      name: 'Zielony Ogród',
      settings: { contactPhone: '512 000 999', isActive: true, minOrderValue: 4000 },
      slug: 'zielony-ogrod',
    },
  })

  const productB = (title: string, priceInPLN: number) =>
    payload.create({
      collection: 'products',
      data: { _status: 'published', priceInPLN, priceInPLNEnabled: true, tenant: tenantB.id, title },
    })

  await productB('Marchew', 250)
  await productB('Buraki', 200)
  await productB('Cebula', 300)

  // ── Tenant-admin assigned ONLY to B ─────────────────────────────────────
  const adminB = await payload.create({
    collection: 'users',
    data: {
      email: 'dostawca-b@od-sasiada.pl',
      password: 'dostawcab12345',
      roles: ['tenant-admin'],
      tenants: [{ tenant: tenantB.id }],
    },
  })
  // Full user document (with tenants) for access simulation
  const adminBUser = await payload.findByID({ collection: 'users', id: adminB.id })

  // ── ISOLATION TESTS (as tenant-admin B, overrideAccess: false) ───────────
  const asB = { overrideAccess: false as const, user: adminBUser }

  const allProducts = await payload.count({ collection: 'products' })
  const bProducts = await payload.find({ collection: 'products', limit: 200, ...asB })
  const bOrders = await payload.find({ collection: 'orders', limit: 200, ...asB })
  const bCustomers = await payload.find({ collection: 'customers', limit: 200, ...asB })

  const allOrders = await payload.count({ collection: 'orders' })
  const allCustomers = await payload.count({ collection: 'customers' })

  const bProductTitles = bProducts.docs.map((p) => p.title)
  const leakedProducts = bProducts.docs.filter((p) => {
    const tid = typeof p.tenant === 'object' && p.tenant ? p.tenant.id : p.tenant
    return tid !== tenantB.id
  })

  const pass = (cond: boolean) => (cond ? 'PASS ✅' : 'FAIL ❌')

  log('═══ CONFIGURATION ═══')
  log(`Supplier A: ${tenantA.name} (id ${tenantA.id})`)
  log(`Supplier B: ${tenantB.name} (id ${tenantB.id})`)
  log(`Tenant-admin B: ${adminB.email} (tenants: [${tenantB.id}])`)
  log('')
  log('═══ PLATFORM ADMIN VIEW (everything) ═══')
  log(`Total products: ${allProducts.totalDocs}`)
  log(`Total orders: ${allOrders.totalDocs}`)
  log(`Total customers: ${allCustomers.totalDocs}`)
  log('')
  log('═══ TENANT-ADMIN B VIEW (should see ONLY own data) ═══')
  log(`Products visible to B: ${bProducts.totalDocs} → [${bProductTitles.join(', ')}]`)
  log(`  ${pass(bProducts.totalDocs === 3)} sees exactly 3 own products`)
  log(
    `  ${pass(leakedProducts.length === 0)} no cross-tenant product leak (leaked: ${leakedProducts.length})`,
  )
  log(`  ${pass(!bProductTitles.includes('Jaja wiejskie'))} does NOT see "Jaja wiejskie" (supplier A product)`)
  log(`Orders visible to B: ${bOrders.totalDocs}`)
  log(`  ${pass(bOrders.totalDocs === 0)} does NOT see supplier A orders (total: ${allOrders.totalDocs})`)
  log(`Customers visible to B: ${bCustomers.totalDocs}`)
  log(`  ${pass(bCustomers.totalDocs === 0)} does NOT see supplier A customers (total: ${allCustomers.totalDocs})`)

  writeFileSync('/tmp/isolation-result.txt', `${out.join('\n')}\n`)
}

try {
  await run()
  process.exit(0)
} catch (err) {
  writeFileSync('/tmp/isolation-result.txt', `ISOLATION TEST FAILED:\n${(err as Error)?.stack ?? String(err)}\n`)
  process.exit(1)
}
