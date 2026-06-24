import type { CatalogProduct, CatalogVariant, ProductImage, ShopTenant } from '@/lib/money'
import type { Media } from '@/payload-types'

import { getPayload } from 'payload'

import { resolveProductImage } from '@/lib/product-image'
import config from '@/payload.config'

export type { CatalogProduct, ProductImage, ShopTenant } from '@/lib/money'

export { formatPLN } from '@/lib/money'

/** Reads the numeric id from a relationship that may be an id or a populated doc. */
const idOf = (rel: unknown): null | number => {
  if (typeof rel === 'number') {
    return rel
  }
  if (rel && typeof rel === 'object' && 'id' in rel && typeof (rel as { id: unknown }).id === 'number') {
    return (rel as { id: number }).id
  }
  return null
}

/** Builds a storefront ProductImage from a media doc — prefers the `card` sharp variant. */
const toProductImage = (m: Media): null | ProductImage => {
  const card = m.sizes?.card
  const url = card?.url ?? m.url
  if (!url) {
    return null
  }
  return {
    alt: m.alt,
    height: card?.height ?? m.height ?? undefined,
    url,
    width: card?.width ?? m.width ?? undefined,
  }
}

const CHUNK = 100

/**
 * Loads media for a set of ids, tenant-scoped (R-S3.2: manual `where { tenant }` is mandatory on
 * every public read with overrideAccess — defense-in-depth against cross-tenant leakage).
 * Returns a Map keyed by media id.
 *
 * Paginates in chunks of CHUNK (100) to stay within Payload's pagination max and avoid silently
 * truncated sets when the catalog has many hero images (EC3).
 */
const loadImagesByTenant = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  tenantId: number,
  mediaIds: number[],
): Promise<Map<number, ProductImage>> => {
  const map = new Map<number, ProductImage>()
  if (mediaIds.length === 0) {
    return map
  }
  for (let i = 0; i < mediaIds.length; i += CHUNK) {
    const chunk = mediaIds.slice(i, i + CHUNK)
    const media = await payload.find({
      collection: 'media',
      depth: 0,
      limit: CHUNK,
      overrideAccess: true,
      where: {
        and: [{ id: { in: chunk } }, { tenant: { equals: tenantId } }],
      },
    })
    for (const m of media.docs) {
      const img = toProductImage(m)
      if (img) {
        map.set(m.id, img)
      }
    }
  }
  return map
}

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
 * S3.3 — resolves a live thumbnail (variant → product → null) for each order item, tenant-scoped.
 *
 * Order items store `product`/`variant` references only (no image snapshot — image is LIVE per Q2,
 * unlike price/name which ARE snapshotted). We read the current `heroImage` of each referenced
 * variant/product, then load media with a mandatory `where { tenant }` (R-S3.2), and apply the
 * shared D3 fallback. Returns a Map keyed by item array index.
 */
export const resolveOrderItemImages = async (
  tenantId: number,
  items: { product?: null | number; variant?: null | number }[],
): Promise<Map<number, ProductImage>> => {
  const result = new Map<number, ProductImage>()
  const productIds = new Set<number>()
  const variantIds = new Set<number>()
  for (const it of items) {
    if (typeof it.product === 'number') {
      productIds.add(it.product)
    }
    if (typeof it.variant === 'number') {
      variantIds.add(it.variant)
    }
  }
  if (productIds.size === 0 && variantIds.size === 0) {
    return result
  }

  const payload = await getPayload({ config })

  // hero id by product/variant id, collected tenant-scoped (R-S3.2 on every overrideAccess read).
  const heroByProduct = new Map<number, number>()
  const heroByVariant = new Map<number, number>()
  const mediaIds = new Set<number>()

  if (productIds.size > 0) {
    const products = await payload.find({
      collection: 'products',
      depth: 0,
      limit: productIds.size,
      overrideAccess: true,
      where: { and: [{ id: { in: [...productIds] } }, { tenant: { equals: tenantId } }] },
    })
    for (const p of products.docs) {
      const hero = idOf(p.heroImage)
      if (hero !== null) {
        heroByProduct.set(p.id, hero)
        mediaIds.add(hero)
      }
    }
  }
  if (variantIds.size > 0) {
    const variants = await payload.find({
      collection: 'variants',
      depth: 0,
      limit: variantIds.size,
      overrideAccess: true,
      where: { and: [{ id: { in: [...variantIds] } }, { tenant: { equals: tenantId } }] },
    })
    for (const v of variants.docs) {
      const hero = idOf(v.heroImage)
      if (hero !== null) {
        heroByVariant.set(v.id, hero)
        mediaIds.add(hero)
      }
    }
  }

  const imagesByMedia = await loadImagesByTenant(payload, tenantId, [...mediaIds])

  items.forEach((it, idx) => {
    const variantHero = typeof it.variant === 'number' ? heroByVariant.get(it.variant) : undefined
    const productHero = typeof it.product === 'number' ? heroByProduct.get(it.product) : undefined
    const variantImage = variantHero !== undefined ? (imagesByMedia.get(variantHero) ?? null) : null
    const productImage = productHero !== undefined ? (imagesByMedia.get(productHero) ?? null) : null
    const image = resolveProductImage(variantImage, productImage)
    if (image) {
      result.set(idx, image)
    }
  })

  return result
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
  // heroImage id → media id, collected from products + variants so images load in one round-trip.
  const heroImageByVariant = new Map<number, number>()
  const heroImageByProduct = new Map<number, number>()
  const mediaIds = new Set<number>()

  for (const p of products.docs) {
    const hero = idOf(p.heroImage)
    if (hero !== null) {
      heroImageByProduct.set(p.id, hero)
      mediaIds.add(hero)
    }
  }

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
      const hero = idOf(v.heroImage)
      if (hero !== null) {
        heroImageByVariant.set(v.id, hero)
        mediaIds.add(hero)
      }
      const list = variantsByProduct.get(pid) ?? []
      list.push({ id: v.id, image: null, label: v.title ?? 'Variant', priceInPLN: v.priceInPLN })
      variantsByProduct.set(pid, list)
    }
  }

  // Tenant-scoped media read (R-S3.2) — one query for all hero images on this catalog page.
  const imagesByMedia = await loadImagesByTenant(payload, tenantId, [...mediaIds])

  return products.docs.map((p) => {
    const productMediaId = heroImageByProduct.get(p.id)
    const productImage = productMediaId !== undefined ? (imagesByMedia.get(productMediaId) ?? null) : null
    const variants = (variantsByProduct.get(p.id) ?? []).map((v) => {
      const variantMediaId = heroImageByVariant.get(v.id)
      const variantImage = variantMediaId !== undefined ? (imagesByMedia.get(variantMediaId) ?? null) : null
      return { ...v, image: variantImage }
    })
    return {
      description: p.description ?? null,
      id: p.id,
      image: productImage,
      priceInPLN: typeof p.priceInPLN === 'number' ? p.priceInPLN : null,
      title: p.title ?? 'Product',
      variants,
    }
  })
}
