import { writeFileSync } from 'node:fs'

import { getPayload } from 'payload'

import type { OrderStatusValue } from '@/ecommerce/order-status'

import config from '@/payload.config'

/**
 * Tests order status machine (S1.5): allowed and disallowed transitions.
 * Run: `pnpm payload run src/spike-status-machine.ts`.
 */
const run = async () => {
  const payload = await getPayload({ config })
  const out: string[] = []
  const log = (l: string) => out.push(l)

  const tenant = (await payload.find({ collection: 'tenants', limit: 1 })).docs[0]
  const product = (await payload.find({ collection: 'products', limit: 1, where: { tenant: { equals: tenant.id } } }))
    .docs[0]

  const order = await payload.create({
    collection: 'orders',
    data: {
      amount: 5000,
      currency: 'PLN',
      customerEmail: 'sm@example.com',
      items: [{ product: product.id, quantity: 1 }],
      status: 'new',
      tenant: tenant.id,
    },
  })

  const tryUpdate = async (to: OrderStatusValue): Promise<{ err?: string; ok: boolean }> => {
    try {
      await payload.update({ collection: 'orders', data: { status: to }, id: order.id })
      return { ok: true }
    } catch (e) {
      return { err: (e as Error)?.message ?? String(e), ok: false }
    }
  }

  const expect = async (to: OrderStatusValue, shouldPass: boolean, note: string) => {
    const r = await tryUpdate(to)
    const pass = r.ok === shouldPass
    log(`${pass ? 'PASS ✅' : 'FAIL ❌'} ${note}: → ${to} ${r.ok ? '(passed)' : '(blocked)'}`)
  }

  const created = await payload.findByID({ collection: 'orders', id: order.id })
  log(`═══ Status machine (start: ${created.status}) ═══`)
  await expect('preparing', false, 'skip new→preparing (forbidden)')
  await expect('confirmed', true, 'step new→confirmed')
  await expect('preparing', true, 'step confirmed→preparing')
  await expect('new', true, 'rollback preparing→new')
  await expect('confirmed', true, 're-confirmed')
  await expect('out_for_delivery', false, 'skip confirmed→out_for_delivery (forbidden)')
  await expect('cancelled', true, 'cancel confirmed→cancelled')
  await expect('new', true, 'reactivate cancelled→new')
  await expect('delivered', false, 'skip new→delivered (forbidden)')

  await payload.delete({ collection: 'orders', id: order.id })
  writeFileSync('/tmp/spike-sm.txt', `${out.join('\n')}\n`)
}

try {
  await run()
  process.exit(0)
} catch (err) {
  writeFileSync('/tmp/spike-sm.txt', `STATUS-MACHINE FAILED:\n${(err as Error)?.stack ?? String(err)}\n`)
  process.exit(1)
}
