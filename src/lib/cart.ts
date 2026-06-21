import { getPayload } from 'payload'

import { getCurrentCustomer } from '@/lib/auth'
import { validateLineItem } from '@/lib/cart-validation'
import { type CartLine, type CartSnapshot, EMPTY_CART } from '@/lib/money'
import config from '@/payload.config'

/**
 * Server-component reader for the customer's open cart (one per customer+tenant), re-priced
 * from the DB. Plain server util (NOT 'use server') — used by server components (layout/Header,
 * cart page) so we never import the 'use server' cart-actions module on the server side
 * (which would break client action proxying — see memory `use-server-turbopack-gotcha`).
 *
 * The MUTATION counterpart lives in cart-actions.ts and re-implements customer resolution +
 * snapshotting inline (direct next/headers import) on purpose, to keep that 'use server' file
 * free of any indirect next/headers import.
 */

const idOf = (v: unknown): null | number => {
  if (v && typeof v === 'object' && 'id' in v) {
    return (v as { id: number }).id
  }
  return typeof v === 'number' ? v : null
}

const keyOf = (productId: number, variantId: null | number) => `${productId}:${variantId ?? ''}`

export const getCartSnapshot = async (tenantId: number): Promise<CartSnapshot> => {
  const customer = await getCurrentCustomer(tenantId)
  if (!customer) {
    return EMPTY_CART
  }

  const payload = await getPayload({ config })
  const res = await payload.find({
    collection: 'carts',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    sort: '-createdAt',
    where: { and: [{ customer: { equals: customer.id } }, { tenant: { equals: tenantId } }] },
  })
  const cart = res.docs[0]
  if (!cart) {
    return EMPTY_CART
  }

  const items: CartLine[] = []
  for (const raw of cart.items ?? []) {
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
