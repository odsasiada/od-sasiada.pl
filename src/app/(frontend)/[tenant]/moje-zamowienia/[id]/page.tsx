import type { OrderStatusValue } from '@/ecommerce/order-status'

import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import { StatusBadge } from '@/components/shop/ui/Badge'
import { getCurrentCustomer } from '@/lib/auth'
import { formatPLN, getTenantBySlug, resolveOrderItemImages } from '@/lib/shop'
import config from '@/payload.config'

const THUMB_SIZE = 56

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('pl-PL', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso))

type OrderItem = {
  product?: null | number
  productNameSnapshot?: null | string
  quantity: number
  unitPriceSnapshot?: null | number
  variant?: null | number
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
      <main className='shop-main'>
        <Link className='shop-back' href={`/${slug}`}>
          ← Wróć do sklepu
        </Link>
        <h1 className='shop-h1'>Moje zamówienia</h1>
        <p className='text-text-muted'>
          Aby zobaczyć swoje zamówienia,{' '}
          <Link className='font-semibold text-brand-strong hover:underline' href={`/${slug}/konto`}>
            zaloguj się
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
  const items = o.items ?? []
  // Live thumbnails (variant → product → placeholder), tenant-scoped (R-S3.2). Image is NOT
  // snapshotted (Q2) — it reflects the product's current heroImage, unlike price/name.
  const itemImages = await resolveOrderItemImages(tenant.id, items)

  return (
    <main className='shop-main'>
      <Link className='shop-back' href={`/${slug}/moje-zamowienia`}>
        ← Wróć do moich zamówień
      </Link>
      <h1 className='shop-h1'>Szczegóły zamówienia</h1>

      <div className='shop-card'>
        <div className='flex items-center justify-between text-[length:var(--text-md)]'>
          <strong>{o.orderNumber ?? `#${order.id}`}</strong>
          <StatusBadge status={o.status as OrderStatusValue} />
        </div>
        <div className='shop-meta'>{formatDate(order.createdAt)}</div>

        <ul className='my-3 list-none p-0 text-text-body'>
          {items.map((it, idx) => {
            const image = itemImages.get(idx) ?? null
            return (
              <li className='flex items-center gap-2.5 py-1.5' key={idx}>
                {image ? (
                  <Image
                    alt={image.alt}
                    className='size-14 flex-shrink-0 rounded-md object-cover'
                    height={THUMB_SIZE}
                    sizes={`${THUMB_SIZE}px`}
                    src={image.url}
                    width={THUMB_SIZE}
                  />
                ) : (
                  <div aria-hidden='true' className='shop-img-placeholder size-14 flex-shrink-0 rounded-md' />
                )}
                <span>
                  {it.quantity} × {it.productNameSnapshot}
                  {it.variantLabelSnapshot
                    ? ` (${it.variantLabelSnapshot.replace(`${it.productNameSnapshot} — `, '')})`
                    : ''}{' '}
                  — {formatPLN((it.unitPriceSnapshot ?? 0) * it.quantity)}
                </span>
              </li>
            )
          })}
        </ul>

        {slot?.date ? (
          <div className='shop-meta'>
            <strong>Termin dostawy</strong>
            <br />
            {slot.label ?? `${slot.date}${slot.windowStart ? `, ${slot.windowStart}–${slot.windowEnd ?? ''}` : ''}`}
          </div>
        ) : null}

        {address ? (
          <div className='shop-meta mt-2'>
            <strong>Adres dostawy</strong>
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

        <div className='mt-3 font-bold'>Razem: {formatPLN(o.amount ?? 0)}</div>
      </div>
    </main>
  )
}
