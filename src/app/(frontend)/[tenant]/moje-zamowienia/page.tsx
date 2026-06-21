import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import { ReorderButton } from '@/components/shop/ReorderButton'
import { ORDER_STATUS_LABELS } from '@/ecommerce/order-status'
import { getCurrentCustomer } from '@/lib/auth'
import { formatPLN, getTenantBySlug } from '@/lib/shop'
import config from '@/payload.config'

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('pl-PL', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso))

type OrderItem = {
  productNameSnapshot?: null | string
  quantity: number
  unitPriceSnapshot?: null | number
  variantLabelSnapshot?: null | string
}

export default async function MyOrdersPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params
  const tenant = await getTenantBySlug(slug)

  if (!tenant) {
    notFound()
  }

  const customer = await getCurrentCustomer(tenant.id)

  if (!customer) {
    return (
      <main className='container'>
        <Link className='link-back' href={`/${slug}`}>
          ← Back to catalog
        </Link>
        <h1>My orders</h1>
        <p className='empty'>
          To see your orders,{' '}
          <Link className='link-back' href={`/${slug}/konto`}>
            log in
          </Link>
          .
        </p>
      </main>
    )
  }

  const payload = await getPayload({ config })
  const orders = await payload.find({
    collection: 'orders',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    sort: '-createdAt',
    where: {
      customer: { equals: customer.id },
      tenant: { equals: tenant.id },
    },
  })

  return (
    <main className='container'>
      <Link className='link-back' href={`/${slug}`}>
        ← Back to catalog
      </Link>
      <h1>My orders</h1>
      <p className='tenant-meta'>
        Logged in as {customer.firstName} {customer.lastName} ·{' '}
        <Link className='link-back' href={`/${slug}/konto`}>
          account
        </Link>
      </p>

      {orders.docs.length === 0 ? (
        <p className='empty'>You have no orders yet.</p>
      ) : (
        orders.docs.map((order) => {
          const o = order as typeof order & { items?: null | OrderItem[]; orderNumber?: string }
          return (
            <div className='order-card' key={order.id}>
              <div className='order-head'>
                <strong>{o.orderNumber ?? `#${order.id}`}</strong>
                <span className='status-badge'>
                  {ORDER_STATUS_LABELS[o.status as keyof typeof ORDER_STATUS_LABELS] ?? o.status}
                </span>
              </div>
              <div className='tenant-meta'>{formatDate(order.createdAt)}</div>
              <ul className='order-items'>
                {(o.items ?? []).map((it, idx) => (
                  <li key={idx}>
                    {it.quantity} × {it.productNameSnapshot}
                    {it.variantLabelSnapshot
                      ? ` (${it.variantLabelSnapshot.replace(`${it.productNameSnapshot} — `, '')})`
                      : ''}{' '}
                    — {formatPLN((it.unitPriceSnapshot ?? 0) * it.quantity)}
                  </li>
                ))}
              </ul>
              <div className='order-total'>Total: {formatPLN(o.amount ?? 0)}</div>
              <Link className='link-back' href={`/${slug}/moje-zamowienia/${order.id}`}>
                details →
              </Link>
              <ReorderButton orderId={order.id} slug={slug} tenantId={tenant.id} />
            </div>
          )
        })
      )}
    </main>
  )
}
