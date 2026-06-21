import type { BasePayload } from 'payload'

import { ORDER_STATUS_LABELS, type OrderStatusValue } from '@/ecommerce/order-status'

const zl = (gr: number): string => `${(gr / 100).toFixed(2).replace('.', ',')} zł`

type OrderItem = {
  productNameSnapshot?: null | string
  quantity: number
  unitPriceSnapshot?: null | number
  variantLabelSnapshot?: null | string
}

type OrderDoc = {
  amount?: null | number
  customerEmail?: null | string
  items?: null | OrderItem[]
  orderNumber?: null | string
  shippingAddress?: {
    addressLine1?: null | string
    city?: null | string
    firstName?: null | string
    lastName?: null | string
    phone?: null | string
    postalCode?: null | string
  } | null
  status?: null | string
}

const itemsTable = (items: OrderItem[]): string => {
  const rows = items
    .map((i) => {
      const name = i.variantLabelSnapshot || i.productNameSnapshot || 'Product'
      const line = (i.unitPriceSnapshot ?? 0) * i.quantity
      return `<tr><td style="padding:4px 8px">${i.quantity} ×</td><td style="padding:4px 8px">${name}</td><td style="padding:4px 8px;text-align:right">${zl(line)}</td></tr>`
    })
    .join('')
  return `<table style="border-collapse:collapse;width:100%;max-width:480px">${rows}</table>`
}

const addressBlock = (a: OrderDoc['shippingAddress']): string => {
  if (!a) {
    return ''
  }
  return `<p style="color:#555">Delivery: ${a.firstName ?? ''} ${a.lastName ?? ''}, ${a.addressLine1 ?? ''}, ${a.postalCode ?? ''} ${a.city ?? ''}${a.phone ? `, tel. ${a.phone}` : ''}</p>`
}

/** Order placement confirmation email. */
export const sendOrderConfirmation = async (payload: BasePayload, doc: OrderDoc): Promise<void> => {
  if (!doc.customerEmail) {
    return
  }
  const html = `
    <div style="font-family:system-ui,sans-serif;color:#1f2421">
      <h2>Thank you for your order ${doc.orderNumber ?? ''}</h2>
      <p>We have received your order. We will call to confirm delivery. Payment by cash/bank transfer on delivery.</p>
      ${itemsTable(doc.items ?? [])}
      <p style="font-weight:700;margin-top:12px">Total: ${zl(doc.amount ?? 0)}</p>
      ${addressBlock(doc.shippingAddress)}
    </div>`
  await payload.sendEmail({
    html,
    subject: `Order confirmation ${doc.orderNumber ?? ''}`,
    to: doc.customerEmail,
  })
}

/** Order status change email. */
export const sendStatusChange = async (payload: BasePayload, doc: OrderDoc): Promise<void> => {
  if (!doc.customerEmail) {
    return
  }
  const label = ORDER_STATUS_LABELS[doc.status as OrderStatusValue] ?? doc.status
  const html = `
    <div style="font-family:system-ui,sans-serif;color:#1f2421">
      <h2>Order ${doc.orderNumber ?? ''}</h2>
      <p>Your order status has changed to: <strong>${label}</strong>.</p>
      <p style="font-weight:700">Total: ${zl(doc.amount ?? 0)}</p>
    </div>`
  await payload.sendEmail({
    html,
    subject: `Order ${doc.orderNumber ?? ''} — ${label}`,
    to: doc.customerEmail,
  })
}
