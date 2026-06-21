import { writeFileSync } from 'node:fs'

import { getPayload } from 'payload'

import config from '@/payload.config'

/**
 * Creates a test customer and places a sample order (cash on delivery).
 * Order created directly via Local API — bypassing the plugin payment flow.
 * Run: `pnpm payload run src/place-order.ts`.
 */
const run = async () => {
  const payload = await getPayload({ config })

  // Pin a specific supplier — `limit:1` might return a different tenant than the products
  // searched by title, which (rightly) fails the multi-tenant relation validation.
  const tenants = await payload.find({
    collection: 'tenants',
    limit: 1,
    where: { slug: { equals: 'swieze-z-kaszub' } },
  })
  const tenant = tenants.docs[0]
  if (!tenant) {
    throw new Error('Missing supplier "swieze-z-kaszub" — run `pnpm seed` first.')
  }
  const tenantId = tenant.id

  // Clear previous orders (dev) — so numbering starts fresh.
  await payload.delete({ collection: 'orders', where: { id: { exists: true } } })

  // ── Customer (idempotent) ─────────────────────────────────────────────────
  const email = 'anna.kowalska@example.com'
  const existing = await payload.find({ collection: 'customers', limit: 1, where: { email: { equals: email } } })
  await Promise.all(existing.docs.map((c) => payload.delete({ collection: 'customers', id: c.id })))

  const customer = await payload.create({
    collection: 'customers',
    data: {
      email,
      firstName: 'Anna',
      lastName: 'Kowalska',
      password: 'klient12345',
      phone: '600 100 200',
      tenant: tenantId,
    },
  })

  // ── Order line items (always within this supplier) ────────────────────────
  const findProduct = async (title: string) => {
    const res = await payload.find({
      collection: 'products',
      limit: 1,
      where: { tenant: { equals: tenantId }, title: { equals: title } },
    })
    const doc = res.docs[0]
    if (!doc) {
      throw new Error(`Product not found: ${title}`)
    }
    return doc
  }

  const jaja = await findProduct('Jaja wiejskie')
  const miod = await findProduct('Miód lipowy 1 L')
  const ziemniaki = await findProduct('Ziemniaki')

  const variantRes = await payload.find({
    collection: 'variants',
    limit: 1,
    where: { tenant: { equals: tenantId }, title: { like: 'worek 15' } },
  })
  const worek = variantRes.docs[0]
  if (!worek) {
    throw new Error('Variant "worek 15 kg" not found.')
  }

  const lines = [
    { priceInPLN: jaja.priceInPLN ?? 0, product: jaja.id, quantity: 12, variant: null },
    { priceInPLN: miod.priceInPLN ?? 0, product: miod.id, quantity: 2, variant: null },
    { priceInPLN: worek.priceInPLN ?? 0, product: ziemniaki.id, quantity: 1, variant: worek.id },
  ]

  const amount = lines.reduce((sum, l) => sum + l.priceInPLN * l.quantity, 0)

  // ── Order ─────────────────────────────────────────────────────────────────
  const order = await payload.create({
    collection: 'orders',
    data: {
      amount,
      currency: 'PLN',
      customer: customer.id,
      customerEmail: email,
      items: lines.map((l) => ({ product: l.product, quantity: l.quantity, variant: l.variant })),
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
      tenant: tenantId,
    },
  })

  const zl = (gr: number) => `${(gr / 100).toFixed(2).replace('.', ',')} zł`
  const summary = [
    `Customer: ${customer.firstName} ${customer.lastName} <${customer.email}> (id ${customer.id})`,
    `Order #${order.id}, status: ${order.status}`,
    `Items:`,
    `  12 × Jaja wiejskie        = ${zl(jaja.priceInPLN! * 12)}`,
    `   2 × Miód lipowy 1 L      = ${zl(miod.priceInPLN! * 2)}`,
    `   1 × Ziemniaki worek 15kg = ${zl(worek.priceInPLN! * 1)}`,
    `TOTAL: ${zl(amount)} (min. order: ${zl(tenant.settings?.minOrderValue ?? 0)})`,
  ].join('\n')

  writeFileSync('/tmp/order-result.txt', `${summary}\n`)
}

try {
  await run()
  process.exit(0)
} catch (err) {
  writeFileSync('/tmp/order-result.txt', `ORDER FAILED:\n${(err as Error)?.stack ?? String(err)}\n`)
  process.exit(1)
}
