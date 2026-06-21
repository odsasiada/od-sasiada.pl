import { writeFileSync } from 'node:fs'

import { getPayload } from 'payload'

import config from '@/payload.config'

/**
 * SPIKE-A: can tenant-admin B change tenant A's order status?
 * Multi-tenant filters the list, but `update` access must be verified experimentally.
 * Expected: update as admin B (overrideAccess:false) on order A → REJECTED.
 * Run: `pnpm payload run src/spike-order-isolation.ts`.
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

  // admin B (tenant-admin for B only)
  const usersB = await payload.find({
    collection: 'users',
    limit: 1,
    where: { email: { equals: 'dostawca-b@od-sasiada.pl' } },
  })
  const adminB = usersB.docs[0]
  if (!adminB) {
    throw new Error('Missing admin B — run second-tenant.')
  }
  const adminBUser = await payload.findByID({ collection: 'users', id: adminB.id })

  // customer + order in tenant A (overrideAccess — setup)
  const email = `spike-${Date.now()}@example.com`
  const customerA = await payload.create({
    collection: 'customers',
    data: { email, firstName: 'Spike', lastName: 'A', password: 'spike12345', tenant: tenantA.id },
  })
  const product = (await payload.find({ collection: 'products', limit: 1, where: { tenant: { equals: tenantA.id } } }))
    .docs[0]
  const orderA = await payload.create({
    collection: 'orders',
    data: {
      amount: 5000,
      currency: 'PLN',
      customer: customerA.id,
      customerEmail: email,
      items: [{ product: product.id, quantity: 1 }],
      status: 'new',
      tenant: tenantA.id,
    },
  })

  log('═══ SPIKE-A: order update isolation ═══')
  log(`Order A: #${orderA.id} (tenant ${tenantA.id}), admin B: ${adminB.email} (tenant ${tenantB.id})`)
  log('')

  // ATTEMPT 1: update as admin B, overrideAccess:false → should be rejected
  let blocked = false
  let detail = ''
  try {
    await payload.update({
      collection: 'orders',
      data: { status: 'confirmed' },
      id: orderA.id,
      overrideAccess: false,
      user: adminBUser,
    })
  } catch (err) {
    blocked = true
    detail = (err as Error)?.message ?? String(err)
  }

  // check if status actually didn't change
  const after = await payload.findByID({ collection: 'orders', id: orderA.id })

  log(`ATTEMPT: admin B updates status=confirmed on order A (overrideAccess:false)`)
  log(`  Threw exception (blocked): ${blocked ? 'YES' : 'NO'}${detail ? ` — ${detail.slice(0, 80)}` : ''}`)
  log(`  Order status after attempt: ${after.status} (expected: new)`)
  log('')
  const isolated = blocked || after.status === 'new'
  log(
    isolated ? 'RESULT: PASS ✅ — update isolation works' : 'RESULT: FAIL ❌ — LEAK: admin B changed someone else\'s order',
  )
  if (!isolated) {
    log('→ Need to add access.update in ordersOverride: condition { tenant: { in: <user tenants> } }')
  }

  // cleanup
  await payload.delete({ collection: 'orders', id: orderA.id })
  await payload.delete({ collection: 'customers', id: customerA.id })

  writeFileSync('/tmp/spike-a.txt', `${out.join('\n')}\n`)
}

try {
  await run()
  process.exit(0)
} catch (err) {
  writeFileSync('/tmp/spike-a.txt', `SPIKE-A FAILED:\n${(err as Error)?.stack ?? String(err)}\n`)
  process.exit(1)
}
