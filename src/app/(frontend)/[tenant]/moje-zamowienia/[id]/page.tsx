import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

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

type ShippingAddress = {
  addressLine1?: null | string
  city?: null | string
  firstName?: null | string
  lastName?: null | string
  phone?: null | string
  postalCode?: null | string
}

type DeliverySlotSnapshot = {
  date?: null | string
  label?: null | string
  windowEnd?: null | string
  windowStart?: null | string
}

export default async function MyOrderDetailPage({ params }: { params: Promise<{ id: string; tenant: string }> }) {
  const { id, tenant: slug } = await params
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

  const orderId = Number(id)
  if (Number.isNaN(orderId)) {
    notFound()
  }

  const payload = await getPayload({ config })
  const orders = await payload.find({
    collection: 'orders',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      and: [{ id: { equals: orderId } }, { customer: { equals: customer.id } }, { tenant: { equals: tenant.id } }],
    },
  })

  if (orders.docs.length === 0) {
    notFound()
  }

  const order = orders.docs[0]
  const o = order as typeof order & {
    deliverySlot?: null | DeliverySlotSnapshot
    items?: null | OrderItem[]
    orderNumber?: string
    shippingAddress?: null | ShippingAddress
  }
  const address = o.shippingAddress
  const slot = o.deliverySlot

  return (
    <main className='container'>
      <Link className='link-back' href={`/${slug}/moje-zamowienia`}>
        ← Back to my orders
      </Link>
      <h1>Order details</h1>

      <div className='order-card'>
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

        {slot?.date ? (
          <div className='tenant-meta'>
            <strong>Termin dostawy</strong>
            <br />
            {slot.label ?? `${slot.date}${slot.windowStart ? `, ${slot.windowStart}–${slot.windowEnd ?? ''}` : ''}`}
          </div>
        ) : null}

        {address ? (
          <div className='tenant-meta'>
            <strong>Delivery address</strong>
            <br />
            {address.firstName} {address.lastName}
            <br />
            {address.addressLine1}
            <br />
            {address.postalCode} {address.city}
            {address.phone ? (
              <>
                <br />
                tel. {address.phone}
              </>
            ) : null}
          </div>
        ) : null}

        <div className='order-total'>Total: {formatPLN(o.amount ?? 0)}</div>
      </div>
    </main>
  )
}
