import type { CatalogProduct, CatalogVariant, ShopTenant } from '@/lib/money'

import { getPayload } from 'payload'

import config from '@/payload.config'

export type { CatalogProduct, CatalogVariant, ShopTenant } from '@/lib/money'

export { formatPLN } from '@/lib/money'

/** Resolves supplier by slug. Active only. */
export const getTenantBySlug = async (slug: string): Promise<null | ShopTenant> => {
  const payload = await getPayload({ config })
  const res = await payload.find({
    collection: 'tenants',
    depth: 0,
    limit: 1,
    where: { slug: { equals: slug } },
  })
  const t = res.docs[0]
  if (!t || t.settings?.isActive === false) {
    return null
  }
  return {
    contactPhone: t.settings?.contactPhone ?? null,
    id: t.id,
    minOrderValue: t.settings?.minOrderValue ?? 0,
    name: t.name,
    priceNotice: t.settings?.priceNotice ?? null,
    slug: t.slug,
  }
}

/**
 * Supplier catalog — ONLY published products for THIS tenant.
 * Isolation is MANUAL here (tenant filter) — the plugin doesn't guard public queries.
 */
export const getCatalog = async (tenantId: number): Promise<CatalogProduct[]> => {
  const payload = await getPayload({ config })

  const products = await payload.find({
    collection: 'products',
    depth: 0,
    limit: 500,
    where: {
      _status: { equals: 'published' },
      tenant: { equals: tenantId },
    },
  })

  const productIds = products.docs.map((p) => p.id)
  const variantsByProduct = new Map<number, CatalogVariant[]>()

  if (productIds.length > 0) {
    const variants = await payload.find({
      collection: 'variants',
      depth: 0,
      limit: 1000,
      where: {
        _status: { equals: 'published' },
        product: { in: productIds },
        tenant: { equals: tenantId },
      },
    })
    for (const v of variants.docs) {
      const pid = typeof v.product === 'object' ? v.product.id : v.product
      if (typeof v.priceInPLN !== 'number') {
        continue
      }
      const list = variantsByProduct.get(pid) ?? []
      list.push({ id: v.id, label: v.title ?? 'Variant', priceInPLN: v.priceInPLN })
      variantsByProduct.set(pid, list)
    }
  }

  return products.docs.map((p) => ({
    description: p.description ?? null,
    id: p.id,
    priceInPLN: typeof p.priceInPLN === 'number' ? p.priceInPLN : null,
    title: p.title ?? 'Product',
    variants: variantsByProduct.get(p.id) ?? [],
  }))
}
