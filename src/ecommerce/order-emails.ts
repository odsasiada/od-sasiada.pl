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
  deliverySlot?: {
    date?: null | string
    label?: null | string
    windowEnd?: null | string
    windowStart?: null | string
  } | null
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
  // S2.4: `tenant` bywa surowym id lub populowanym obiektem (`depth>0`). Normalizujemy przez `idOf`.
  tenant?: null | number | { id: number }
}

/** Normalizuje `tenant` (id albo populowany obiekt) do liczbowego id. */
const idOf = (t: OrderDoc['tenant']): null | number => {
  if (t == null) {
    return null
  }
  return typeof t === 'object' ? t.id : t
}

const itemsTable = (items: OrderItem[]): string => {
  const rows = items
    .map((i) => {
      const name = i.variantLabelSnapshot || i.productNameSnapshot || 'Produkt'
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
  return `<p style="color:#555">Adres dostawy: ${a.firstName ?? ''} ${a.lastName ?? ''}, ${a.addressLine1 ?? ''}, ${a.postalCode ?? ''} ${a.city ?? ''}${a.phone ? `, tel. ${a.phone}` : ''}</p>`
}

// S2.4/S2.6: blok terminu dostawy zbudowany ze snapshotu slotu zamówienia. Renderowany tylko gdy
// slot został zarezerwowany (O8: tenanci bez okien → brak bloku). Preferuje gotowe `label`
// (zbudowane przez `formatSlotLabel` w S2.4 — jedno źródło formatowania); fallback z daty + okna.
const slotBlock = (s: OrderDoc['deliverySlot']): string => {
  if (!s?.date) {
    return ''
  }
  const text = s.label ?? `${s.date}${s.windowStart ? `, ${s.windowStart}–${s.windowEnd ?? ''}` : ''}`
  return `<p style="color:#555">Termin dostawy: ${text}</p>`
}

/**
 * S2.6: blok z telefonem kontaktowym dostawcy (`tenant.settings.contactPhone`).
 * Best-effort (NFR4): `disableErrors: true` + obsługa `null` — odczyt NIE może wywrócić maila.
 * Brak tenanta / brak telefonu → pusty blok (sekcja pominięta).
 */
const tenantContactBlock = async (payload: BasePayload, tenant: OrderDoc['tenant']): Promise<string> => {
  const tenantId = idOf(tenant)
  if (tenantId == null) {
    return ''
  }
  const t = await payload.findByID({ collection: 'tenants', depth: 0, disableErrors: true, id: tenantId })
  const phone = t?.settings?.contactPhone
  if (!phone) {
    return ''
  }
  return `<p style="color:#555">Kontakt do dostawcy: tel. ${phone}</p>`
}

/** Mail potwierdzający złożenie zamówienia (po polsku, ze slotem i kontaktem dostawcy). */
export const sendOrderConfirmation = async (payload: BasePayload, doc: OrderDoc): Promise<void> => {
  if (!doc.customerEmail) {
    return
  }
  const contact = await tenantContactBlock(payload, doc.tenant)
  const html = `
    <div style="font-family:system-ui,sans-serif;color:#1f2421">
      <h2>Dziękujemy za zamówienie ${doc.orderNumber ?? ''}</h2>
      <p>Otrzymaliśmy Twoje zamówienie. Zadzwonimy, aby potwierdzić dostawę. Płatność gotówką lub przelewem przy odbiorze.</p>
      ${itemsTable(doc.items ?? [])}
      <p style="font-weight:700;margin-top:12px">Razem: ${zl(doc.amount ?? 0)}</p>
      ${slotBlock(doc.deliverySlot)}
      ${addressBlock(doc.shippingAddress)}
      ${contact}
    </div>`
  await payload.sendEmail({
    html,
    subject: `Potwierdzenie zamówienia ${doc.orderNumber ?? ''}`,
    to: doc.customerEmail,
  })
}

/** Mail o zmianie statusu zamówienia (po polsku, z etykietą statusu PL i kontaktem dostawcy). */
export const sendStatusChange = async (payload: BasePayload, doc: OrderDoc): Promise<void> => {
  if (!doc.customerEmail) {
    return
  }
  const label = ORDER_STATUS_LABELS[doc.status as OrderStatusValue] ?? doc.status
  const contact = await tenantContactBlock(payload, doc.tenant)
  const html = `
    <div style="font-family:system-ui,sans-serif;color:#1f2421">
      <h2>Zamówienie ${doc.orderNumber ?? ''}</h2>
      <p>Status Twojego zamówienia zmienił się na: <strong>${label}</strong>.</p>
      <p style="font-weight:700">Razem: ${zl(doc.amount ?? 0)}</p>
      ${contact}
    </div>`
  await payload.sendEmail({
    html,
    subject: `Zamówienie ${doc.orderNumber ?? ''} — ${label}`,
    to: doc.customerEmail,
  })
}
