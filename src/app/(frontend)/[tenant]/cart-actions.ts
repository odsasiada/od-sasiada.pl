'use server'

// Server-side cart on the ecommerce plugin's `carts` collection (one open cart per
// customer+tenant). Imported ONLY by client components (cart-store.tsx).
//
// HYDRATION GOTCHA (see memory `use-server-turbopack-gotcha`): this 'use server' file is
// imported by a CLIENT component, so it MUST import `next/headers` DIRECTLY (not via
// @/lib/auth — that transitive next/headers import silently breaks Turbopack's client proxy
// and the island never hydrates). Types are INLINE for the same reason. This file MUST NOT
// be imported by any server component.
//
// Price + tenant are validated SERVER-SIDE via the pure cart-validation module; the client
// price is never trusted. The cart's `tenant` is inherited from the customer's account and
// stamped server-side — NEVER accepted from the client for writes.

import { revalidatePath } from 'next/cache'
import { headers as nextHeaders } from 'next/headers'
import { getPayload } from 'payload'

import { validateLineItem } from '@/lib/cart-validation'
import config from '@/payload.config'

type CartLine = {
  key: string
  priceInPLN: number
  productId: number
  quantity: number
  title: string
  variantId: null | number
  variantLabel: null | string
}

type CartSnapshot = {
  count: number
  items: CartLine[]
  total: number
}

type CartActionResult = { error: string; ok: false } | { ok: true; snapshot: CartSnapshot }

type LineInput = { productId: number; quantity: number; variantId: null | number }

type RawCartItem = {
  id?: null | string
  product?: null | number | { id: number }
  quantity: number
  variant?: null | number | { id: number }
}

const keyOf = (productId: number, variantId: null | number) => `${productId}:${variantId ?? ''}`

const idOf = (v: null | number | { id: number } | undefined): null | number =>
  v && typeof v === 'object' ? v.id : (v ?? null)

/**
 * Logged-in customer for THIS tenant. Inline (NO @/lib/auth import) — mirrors getCurrentCustomer
 * but with a DIRECT next/headers import to keep client hydration intact. Tenant comes from the
 * customer's own account, so a customer logged in at tenant A is anonymous on tenant B.
 */
const resolveCustomer = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  tenantId: number,
): Promise<null | { id: number }> => {
  const { user } = await payload.auth({ headers: await nextHeaders() })

  if (user?.collection !== 'customers') {
    return null
  }

  const c = user as unknown as { id: number; tenant?: null | number | { id: number } }
  const tenant = typeof c.tenant === 'object' ? c.tenant?.id : c.tenant

  return tenant === tenantId ? { id: c.id } : null
}

/**
 * Find-or-create the single open cart for (customer, tenant).
 * NOTE (spike): `status` is NOT a queryable path on carts — we scope by customer + tenant only
 * and treat the matched row as the open cart. Tenant is stamped server-side from the customer.
 */
const findOrCreateCart = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  customerId: number,
  tenantId: number,
) => {
  const existing = await payload.find({
    collection: 'carts',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    sort: '-createdAt',
    where: {
      and: [
        {
          customer: {
            equals: customerId,
          },
        },
        {
          tenant: {
            equals: tenantId,
          },
        },
      ],
    },
  })

  if (existing.docs[0]) {
    return existing.docs[0]
  }

  return payload.create({
    collection: 'carts',
    data: {
      currency: 'PLN',
      customer: customerId,
      items: [],
      status: 'active',
      tenant: tenantId,
    },
    overrideAccess: true,
  })
}

/** Re-prices + re-validates every line against the DB; drops lines that no longer validate. */
const buildSnapshot = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  tenantId: number,
  rawItems: RawCartItem[],
): Promise<CartSnapshot> => {
  const items: CartLine[] = []
  for (const raw of rawItems) {
    const productId = idOf(raw.product)

    if (!productId) {
      continue
    }

    const variantId = idOf(raw.variant)
    const validated = await validateLineItem(payload, { productId, quantity: raw.quantity, tenantId, variantId })

    if (!validated.ok) {
      continue
    }

    items.push({
      key: keyOf(productId, variantId),
      priceInPLN: validated.unitPrice,
      productId,
      quantity: validated.quantity,
      title: validated.productNameSnapshot,
      variantId,
      variantLabel: validated.variantLabelSnapshot,
    })
  }

  return {
    count: items.reduce((n, i) => n + i.quantity, 0),
    items,
    total: items.reduce((sum, i) => sum + i.priceInPLN * i.quantity, 0),
  }
}

/** Persist raw items back to the cart row + recompute subtotal, then return a fresh snapshot. */
const persist = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  cartId: number,
  tenantId: number,
  rawItems: { product: number; quantity: number; variant: null | number }[],
): Promise<CartSnapshot> => {
  const snapshot = await buildSnapshot(
    payload,
    tenantId,
    rawItems.map((i) => ({
      product: i.product,
      quantity: i.quantity,
      variant: i.variant,
    })),
  )

  await payload.update({
    collection: 'carts',
    data: {
      items: rawItems.map((i) => ({ product: i.product, quantity: i.quantity, variant: i.variant })),
      subtotal: snapshot.total,
    },
    id: cartId,
    overrideAccess: true,
  })

  return snapshot
}

const rawLinesOf = (cart: {
  items?: null | RawCartItem[]
}): { product: number; quantity: number; variant: null | number }[] =>
  (cart.items ?? [])
    .map((i) => ({ product: idOf(i.product), quantity: i.quantity, variant: idOf(i.variant) }))
    .filter((i): i is { product: number; quantity: number; variant: null | number } => i.product !== null)

const emptySnapshot: CartSnapshot = { count: 0, items: [], total: 0 }

const revalidateTenant = () => {
  // One uniform invalidation strategy: revalidate the whole tenant subtree so Header (count),
  // catalog and cart page all reflect the server cart after a mutation.
  revalidatePath('/[tenant]', 'layout')
}

/** Read the current cart snapshot (re-priced from DB). Anonymous → empty cart. */
export const getCart = async (tenantId: number): Promise<CartSnapshot> => {
  const payload = await getPayload({ config })
  const customer = await resolveCustomer(payload, tenantId)

  if (!customer) {
    return emptySnapshot
  }

  const cart = await findOrCreateCart(payload, customer.id, tenantId)

  return buildSnapshot(payload, tenantId, (cart.items ?? []) as RawCartItem[])
}

export const addToCart = async (tenantId: number, input: LineInput): Promise<CartActionResult> => {
  const payload = await getPayload({ config })
  const customer = await resolveCustomer(payload, tenantId)
  if (!customer) {
    return { error: 'Musisz być zalogowany.', ok: false }
  }

  // SERVER-SIDE validation: tenant match + DB price (client price, if any, is ignored).
  const validated = await validateLineItem(payload, {
    productId: input.productId,
    quantity: input.quantity,
    tenantId,
    variantId: input.variantId ?? null,
  })

  if (!validated.ok) {
    return {
      error: validated.error,
      ok: false,
    }
  }

  const cart = await findOrCreateCart(payload, customer.id, tenantId)
  const lines = rawLinesOf(cart)
  const existing = lines.find((l) => l.product === validated.productId && l.variant === (input.variantId ?? null))

  if (existing) {
    existing.quantity += validated.quantity
  } else {
    lines.push({ product: validated.productId, quantity: validated.quantity, variant: input.variantId ?? null })
  }

  const snapshot = await persist(payload, cart.id, tenantId, lines)
  revalidateTenant()

  return {
    ok: true,
    snapshot,
  }
}

export const updateQty = async (tenantId: number, lineKey: string, quantity: number): Promise<CartActionResult> => {
  const payload = await getPayload({ config })
  const customer = await resolveCustomer(payload, tenantId)

  if (!customer) {
    return { error: 'Musisz być zalogowany.', ok: false }
  }

  const cart = await findOrCreateCart(payload, customer.id, tenantId)
  let lines = rawLinesOf(cart)
  const target = lines.find((l) => keyOf(l.product, l.variant) === lineKey)

  if (!target) {
    return { error: 'Nie znaleziono pozycji.', ok: false }
  }

  // Clamp: <1 removes the line (never a negative quantity/total).
  const q = Math.floor(quantity)

  if (!Number.isFinite(q) || q < 1) {
    lines = lines.filter((l) => keyOf(l.product, l.variant) !== lineKey)
  } else {
    target.quantity = q
  }

  const snapshot = await persist(payload, cart.id, tenantId, lines)
  revalidateTenant()

  return {
    ok: true,
    snapshot,
  }
}

export const removeItem = async (tenantId: number, lineKey: string): Promise<CartActionResult> => {
  const payload = await getPayload({ config })
  const customer = await resolveCustomer(payload, tenantId)

  if (!customer) {
    return { error: 'Musisz być zalogowany.', ok: false }
  }

  const cart = await findOrCreateCart(payload, customer.id, tenantId)
  const lines = rawLinesOf(cart).filter((l) => keyOf(l.product, l.variant) !== lineKey)
  const snapshot = await persist(payload, cart.id, tenantId, lines)

  revalidateTenant()

  return {
    ok: true,
    snapshot,
  }
}

export const clearCart = async (tenantId: number): Promise<CartActionResult> => {
  const payload = await getPayload({ config })
  const customer = await resolveCustomer(payload, tenantId)

  if (!customer) {
    return { error: 'Musisz być zalogowany.', ok: false }
  }

  const cart = await findOrCreateCart(payload, customer.id, tenantId)
  const snapshot = await persist(payload, cart.id, tenantId, [])
  revalidateTenant()

  return {
    ok: true,
    snapshot,
  }
}
