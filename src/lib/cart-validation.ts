// Pure cart line-item validation — the SINGLE SOURCE OF TRUTH for "is this line legit
// and what does it cost". Imported by BOTH the cart server actions and `placeOrder`.
//
// HARD RULE: NO 'use server', NO `next/headers`, NO `@/lib/auth`, NO React here.
// This module is import-safe from server components and from 'use server' action files alike.
// It NEVER trusts a client-supplied price — the unit price is always read from the DB.

import type { Payload } from 'payload'

export type ValidatedLine = {
  ok: true
  productId: number
  productNameSnapshot: string
  quantity: number
  // grosze, read from DB (variant price wins over product price when a variant is chosen)
  unitPrice: number
  variantId: null | number
  variantLabelSnapshot: null | string
}

export type LineError = { error: string; ok: false }

export type LineValidationResult = LineError | ValidatedLine

const tenantOf = (doc: { tenant?: null | number | { id: number } }): null | number =>
  doc.tenant && typeof doc.tenant === 'object' ? doc.tenant.id : (doc.tenant ?? null)

const productIdOf = (doc: { product?: null | number | { id: number } }): null | number =>
  doc.product && typeof doc.product === 'object' ? doc.product.id : (doc.product ?? null)

/**
 * Validates a single cart/order line against the DB authoritatively:
 *  - product exists, belongs to THIS tenant, is published
 *  - if a variant is given: it exists, belongs to THIS tenant, belongs to THAT product, is published
 *  - unit price is READ FROM DB (variant price wins) — client price is never trusted
 * Returns the validated line (with DB price + snapshots) or a typed error.
 *
 * Quantity is clamped: < 1 is treated as an error (callers decide remove vs. reject);
 * the returned quantity is floored to an integer >= 1.
 */
export const validateLineItem = async (
  payload: Payload,
  input: { productId: number; quantity: number; tenantId: number; variantId: null | number },
): Promise<LineValidationResult> => {
  const quantity = Math.floor(input.quantity)
  if (!Number.isFinite(quantity) || quantity < 1) {
    return { error: 'Nieprawidłowa ilość.', ok: false }
  }

  const product = await payload.findByID({
    collection: 'products',
    depth: 0,
    disableErrors: true,
    id: input.productId,
    overrideAccess: true,
  })
  if (!product || tenantOf(product) !== input.tenantId || product._status !== 'published') {
    return { error: 'Pozycja spoza katalogu tego dostawcy.', ok: false }
  }

  let unitPrice = typeof product.priceInPLN === 'number' ? product.priceInPLN : null
  let variantLabelSnapshot: null | string = null

  if (input.variantId) {
    const variant = await payload.findByID({
      collection: 'variants',
      depth: 0,
      disableErrors: true,
      id: input.variantId,
      overrideAccess: true,
    })
    if (
      !variant ||
      tenantOf(variant) !== input.tenantId ||
      productIdOf(variant) !== input.productId ||
      variant._status !== 'published'
    ) {
      return { error: 'Niepoprawny wariant produktu.', ok: false }
    }
    unitPrice = typeof variant.priceInPLN === 'number' ? variant.priceInPLN : null
    variantLabelSnapshot = variant.title ?? null
  }

  if (unitPrice === null) {
    return { error: `Produkt "${product.title ?? 'Produkt'}" nie ma ceny.`, ok: false }
  }

  return {
    ok: true,
    productId: input.productId,
    productNameSnapshot: product.title ?? 'Produkt',
    quantity,
    unitPrice,
    variantId: input.variantId ?? null,
    variantLabelSnapshot,
  }
}
