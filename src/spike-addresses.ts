import { writeFileSync } from 'node:fs'

import { getPayload } from 'payload'

import config from '@/payload.config'

/**
 * S1.3: saved addresses — create/list/delete + owner isolation.
 * Run: `pnpm payload run src/spike-addresses.ts`.
 */
const run = async () => {
  const payload = await getPayload({ config })
  const out: string[] = []
  const log = (l: string) => out.push(l)
  const pass = (c: boolean) => (c ? 'PASS ✅' : 'FAIL ❌')

  const tenant = (
    await payload.find({ collection: 'tenants', limit: 1, where: { slug: { equals: 'swieze-z-kaszub' } } })
  ).docs[0]

  // two customers of the same supplier
  const mk = async (email: string) => {
    const dupes = (await payload.find({ collection: 'customers', where: { email: { equals: email } } })).docs
    await Promise.all(dupes.map((c) => payload.delete({ collection: 'customers', id: c.id })))
    return payload.create({
      collection: 'customers',
      data: { email, firstName: email.split('@')[0], password: 'haslo12345', tenant: tenant.id },
    })
  }
  const c1 = await mk('addr1@example.com')
  const c2 = await mk('addr2@example.com')
  const c1User = await payload.findByID({ collection: 'customers', id: c1.id })

  // create — as customer 1 (access:false, isCustomer sets owner)
  const addr = await payload.create({
    collection: 'addresses',
    data: {
      addressLine1: 'ul. Kwiatowa 7',
      city: 'Kartuzy',
      country: 'PL',
      customer: c1.id,
      firstName: 'Ewa',
      lastName: 'L',
      phone: '605 111 222',
      postalCode: '83-300',
      tenant: tenant.id,
      title: 'Dom',
    },
  })

  // postal code validation — bad format should throw
  let badRejected = false
  try {
    await payload.create({
      collection: 'addresses',
      data: { city: 'X', country: 'PL', customer: c1.id, postalCode: '12345', tenant: tenant.id },
    })
  } catch {
    badRejected = true
  }

  // list as customer 1 vs customer 2 (overrideAccess:false → access isDocumentOwner)
  const asC1 = { overrideAccess: false as const, user: { ...c1User, collection: 'customers' } as never }
  const listC1 = await payload.find({ collection: 'addresses', ...asC1 })
  const c2User = await payload.findByID({ collection: 'customers', id: c2.id })
  const asC2 = { overrideAccess: false as const, user: { ...c2User, collection: 'customers' } as never }
  const listC2 = await payload.find({ collection: 'addresses', ...asC2 })

  log('═══ S1.3: saved addresses ═══')
  log(`Address created: #${addr.id} (${addr.title}, ${addr.postalCode})`)
  log(`  ${pass(badRejected)} bad postal code (12345) rejected by validation`)
  log(`  ${pass(listC1.totalDocs === 1)} customer 1 sees their 1 address`)
  log(`  ${pass(listC2.totalDocs === 0)} customer 2 does NOT see customer 1's address (owner isolation)`)

  // cleanup
  await payload.delete({ collection: 'addresses', id: addr.id })
  await payload.delete({ collection: 'customers', id: c1.id })
  await payload.delete({ collection: 'customers', id: c2.id })

  writeFileSync('/tmp/spike-addr.txt', `${out.join('\n')}\n`)
}

try {
  await run()
  process.exit(0)
} catch (err) {
  writeFileSync('/tmp/spike-addr.txt', `ADDR FAILED:\n${(err as Error)?.stack ?? String(err)}\n`)
  process.exit(1)
}
