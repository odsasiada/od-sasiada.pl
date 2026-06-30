import type { OrderStatusValue } from '@/ecommerce/order-status'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import { ReorderButton } from '@/components/shop/ReorderButton'
import { StatusBadge } from '@/components/shop/ui/Badge'
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
    <main className='shop-main'>
      <Link className='shop-back' href={`/${slug}`}>
        ← Wróć do sklepu
      </Link>
      <h1 className='shop-h1'>Moje zamówienia</h1>
      <p className='shop-meta'>
        Zalogowano jako {customer.firstName} {customer.lastName} ·{' '}
        <Link className='font-semibold text-brand-strong hover:underline' href={`/${slug}/konto`}>
          konto
        </Link>
      </p>

      {orders.docs.length === 0 ? (
        <p className='mt-4 text-text-muted'>Nie masz jeszcze zamówień.</p>
      ) : (
        orders.docs.map((order) => {
          const o = order as typeof order & { items?: null | OrderItem[]; orderNumber?: string }
          return (
            <div className='shop-card mt-4' key={order.id}>
              <div className='flex items-center justify-between text-[length:var(--text-md)]'>
                <strong>{o.orderNumber ?? `#${order.id}`}</strong>
                <StatusBadge status={o.status as OrderStatusValue} />
              </div>
              <div className='shop-meta'>{formatDate(order.createdAt)}</div>
              <ul className='my-3 list-none p-0 text-text-body'>
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
              <div className='font-bold'>Razem: {formatPLN(o.amount ?? 0)}</div>
              <Link
                className='mt-1 inline-block font-semibold text-brand-strong hover:underline'
                href={`/${slug}/moje-zamowienia/${order.id}`}
              >
                szczegóły →
              </Link>
              <ReorderButton orderId={order.id} slug={slug} tenantId={tenant.id} />
            </div>
          )
        })
      )}
    </main>
  )
}
