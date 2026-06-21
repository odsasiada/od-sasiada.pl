'use server'

// 'use server' actions imported ONLY by client components (CartView, ReorderButton).
// HYDRATION GOTCHA: import next/headers DIRECTLY (NOT via @/lib/auth) and keep types INLINE —
// an indirect next/headers import through a regular module breaks Turbopack's client action
// proxy and the island silently fails to hydrate. See memory `use-server-turbopack-gotcha`.

import { headers as nextHeaders } from 'next/headers'
import { getPayload } from 'payload'

import { validateLineItem } from '@/lib/cart-validation'
import { formatPLN } from '@/lib/money'
import config from '@/payload.config'

export type Contact = {
  addressLine1: string
  city: string
  email: string
  firstName: string
  lastName: string
  phone: string
  postalCode: string
}

export type PlaceOrderResult = { error: string; ok: false } | { ok: true; orderNumber: string }
export type ReorderResult = { error: string; ok: false } | { ok: true; skipped: number }

type RawCartItem = {
  product?: null | number | { id: number }
  quantity: number
  variant?: null | number | { id: number }
}

const idOf = (v: null | number | { id: number } | undefined): null | number =>
  v && typeof v === 'object' ? v.id : (v ?? null)

/** Logged-in customer for this tenant — inline (direct next/headers, NO @/lib/auth import). */
const resolveCustomer = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  tenantId: number,
): Promise<null | { email: string; id: number }> => {
  const { user } = await payload.auth({ headers: await nextHeaders() })

  if (user?.collection !== 'customers') {
    return null
  }

  const c = user as unknown as { email: string; id: number; tenant?: null | number | { id: number } }
  const tenant = typeof c.tenant === 'object' ? c.tenant?.id : c.tenant

  return tenant === tenantId ? { email: c.email, id: c.id } : null
}

/** The customer's open cart (one per customer+tenant). NOTE: `status` is not queryable. */
const findCart = async (payload: Awaited<ReturnType<typeof getPayload>>, customerId: number, tenantId: number) => {
  const res = await payload.find({
    collection: 'carts',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    sort: '-createdAt',
    where: { and: [{ customer: { equals: customerId } }, { tenant: { equals: tenantId } }] },
  })

  return res.docs[0] ?? null
}

/**
 * Składa zamówienie (gotówka przy dostawie) z pominięciem przepływu płatności pluginu.
 * Wymaga zalogowanego klienta (wymuszony login). Pozycje i ceny czytane SERWEROWO z `carts` —
 * ciało żądania klienta nie może wpłynąć na zawartość ani sumę zamówienia.
 */
export const placeOrder = async (tenantId: number, contact: Contact): Promise<PlaceOrderResult> => {
  const payload = await getPayload({ config })

  const customer = await resolveCustomer(payload, tenantId)
  if (!customer) {
    return { error: 'Musisz być zalogowany, aby złożyć zamówienie.', ok: false }
  }

  const tenant = await payload.findByID({ collection: 'tenants', depth: 0, disableErrors: true, id: tenantId })
  if (!tenant || tenant.settings?.isActive === false) {
    return { error: 'Nieznany dostawca.', ok: false }
  }

  const cart = await findCart(payload, customer.id, tenantId)
  if (!cart || !cart.items || cart.items.length === 0) {
    return { error: 'Koszyk jest pusty.', ok: false }
  }

  // Re-validate authoritatively at money-time — prices CAN move between add and checkout.
  // Lines are independent DB reads → validate them concurrently, then fold results IN ORDER.
  const lineResults = await Promise.all(
    (cart.items as RawCartItem[]).map(async (raw) => {
      const productId = idOf(raw.product)
      if (!productId) {
        return { error: 'Pozycja w koszyku jest nieprawidłowa.', ok: false as const }
      }
      const variantId = idOf(raw.variant)
      const line = await validateLineItem(payload, { productId, quantity: raw.quantity, tenantId, variantId })
      if (!line.ok) {
        return { error: line.error, ok: false as const }
      }
      return { ok: true as const, productId, quantity: line.quantity, unitPrice: line.unitPrice, variantId }
    }),
  )

  let amount = 0
  const orderItems: { product: number; quantity: number; variant?: null | number }[] = []
  for (const result of lineResults) {
    if (!result.ok) {
      return { error: result.error, ok: false }
    }
    amount += result.unitPrice * result.quantity
    orderItems.push({ product: result.productId, quantity: result.quantity, variant: result.variantId })
  }

  const minOrderValue = tenant.settings?.minOrderValue ?? 0
  if (amount < minOrderValue) {
    return {
      error: `Minimalna kwota zamówienia to ${formatPLN(minOrderValue)} (masz ${formatPLN(amount)}).`,
      ok: false,
    }
  }

  const order = await payload.create({
    collection: 'orders',
    data: {
      amount,
      currency: 'PLN',
      customer: customer.id,
      customerEmail: customer.email || contact.email || undefined,
      items: orderItems,
      shippingAddress: {
        addressLine1: contact.addressLine1,
        city: contact.city,
        country: 'PL',
        firstName: contact.firstName,
        lastName: contact.lastName,
        phone: contact.phone,
        postalCode: contact.postalCode,
      },
      status: 'new',
      tenant: tenantId,
    },
  })

  // Clear the cart now that it's been turned into an order.
  await payload.update({ collection: 'carts', data: { items: [], subtotal: 0 }, id: cart.id, overrideAccess: true })

  return { ok: true, orderNumber: (order as { orderNumber?: string }).orderNumber ?? `#${order.id}` }
}

/**
 * "Zamów ponownie" — REPLACE: czyści koszyk klienta i wypełnia go pozycjami z zamówienia po
 * AKTUALNYCH cenach z bazy, pomijając pozycje już niedostępne. Sprawdza, że zamówienie należy
 * do zalogowanego klienta tego dostawcy. Zwraca liczbę pominiętych pozycji.
 */
export const reorder = async (tenantId: number, orderId: number): Promise<ReorderResult> => {
  const payload = await getPayload({ config })

  const customer = await resolveCustomer(payload, tenantId)
  if (!customer) {
    return { error: 'Musisz być zalogowany.', ok: false }
  }

  const order = await payload.findByID({ collection: 'orders', depth: 0, disableErrors: true, id: orderId })
  const orderTenant = order && (typeof order.tenant === 'object' ? order.tenant?.id : order.tenant)
  const orderCustomer = order && (typeof order.customer === 'object' ? order.customer?.id : order.customer)
  // IDOR / denied read → behave as not-found.
  if (!order || orderTenant !== tenantId || orderCustomer !== customer.id) {
    return { error: 'Nie znaleziono zamówienia.', ok: false }
  }

  // Re-price every order line independently → fan out, then fold results IN ORDER.
  const repriced = await Promise.all(
    (order.items ?? []).map(async (raw) => {
      const productId = idOf(raw.product)
      if (!productId) {
        return null
      }
      const variantId = idOf(raw.variant)
      const line = await validateLineItem(payload, { productId, quantity: raw.quantity, tenantId, variantId })
      if (!line.ok) {
        return null
      }
      return { product: productId, quantity: line.quantity, unitPrice: line.unitPrice, variant: variantId }
    }),
  )

  const lines: { product: number; quantity: number; variant: null | number }[] = []
  let subtotal = 0
  let skipped = 0
  for (const line of repriced) {
    if (!line) {
      skipped++
      continue
    }
    lines.push({ product: line.product, quantity: line.quantity, variant: line.variant })
    subtotal += line.unitPrice * line.quantity
  }

  if (lines.length === 0) {
    return { error: 'Żadna z pozycji nie jest już dostępna.', ok: false }
  }

  // REPLACE the cart (clear + repopulate from the order at current prices).
  const existing = await findCart(payload, customer.id, tenantId)
  if (existing) {
    await payload.update({
      collection: 'carts',
      data: { items: lines, subtotal },
      id: existing.id,
      overrideAccess: true,
    })
  } else {
    await payload.create({
      collection: 'carts',
      data: { currency: 'PLN', customer: customer.id, items: lines, status: 'active', subtotal, tenant: tenantId },
      overrideAccess: true,
    })
  }

  return { ok: true, skipped }
}
