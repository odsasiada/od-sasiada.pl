import { writeFileSync } from 'node:fs'

import { getPayload } from 'payload'

import config from '@/payload.config'

/**
 * S1.4: order list in the panel is tenant-scoped.
 * `find` with overrideAccess:false uses the same access path as the admin list.
 * Run: `pnpm payload run src/spike-order-list.ts`.
 */
const run = async () => {
  const payload = await getPayload({ config })
  const out: string[] = []
  const log = (l: string) => out.push(l)

  const tenants = await payload.find({ collection: 'tenants', limit: 50 })
  const tenantA = tenants.docs.find((t) => t.slug === 'swieze-z-kaszub')!
  const adminB = (
    await payload.find({ collection: 'users', limit: 1, where: { email: { equals: 'dostawca-b@od-sasiada.pl' } } })
  ).docs[0]
  const adminBUser = await payload.findByID({ collection: 'users', id: adminB.id })

  const product = (await payload.find({ collection: 'products', limit: 1, where: { tenant: { equals: tenantA.id } } }))
    .docs[0]
  const orderA = await payload.create({
    collection: 'orders',
    data: {
      amount: 5000,
      currency: 'PLN',
      customerEmail: 'list@example.com',
      items: [{ product: product.id, quantity: 1 }],
      tenant: tenantA.id,
    },
  })

  const asB = { overrideAccess: false as const, user: adminBUser }
  const listB = await payload.find({ collection: 'orders', limit: 200, ...asB })
  const listAll = await payload.count({ collection: 'orders' })

  const pass = (c: boolean) => (c ? 'PASS ✅' : 'FAIL ❌')
  log('═══ S1.4: tenant-scoped order list ═══')
  log(`Total orders (platform): ${listAll.totalDocs}`)
  log(`Orders visible to admin B (tenant ${(adminBUser as { tenants?: unknown }).tenants}): ${listB.totalDocs}`)
  log(`  ${pass(listB.totalDocs === 0)} admin B does NOT see order A in the list`)
  log(`  ${pass(!listB.docs.some((o) => o.id === orderA.id))} order A absent from B's results`)

  await payload.delete({ collection: 'orders', id: orderA.id })
  writeFileSync('/tmp/spike-list.txt', `${out.join('\n')}\n`)
}

try {
  await run()
  process.exit(0)
} catch (err) {
  writeFileSync('/tmp/spike-list.txt', `LIST FAILED:\n${(err as Error)?.stack ?? String(err)}\n`)
  process.exit(1)
}
