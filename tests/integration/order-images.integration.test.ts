import type { Payload } from 'payload'

import { sql } from '@payloadcms/db-postgres'
import { afterAll, beforeAll, expect, it } from 'vitest'

import { resolveOrderItemImages } from '@/lib/shop'
import { createFixtures, type TenantFixtures } from '../setup/fixtures'
import { describeIntegration } from '../setup/integration'
import { requireTestPayload } from '../setup/payload'

/**
 * order-images tenant-isolation (S3.3, AC3 / R-S3.2) — `resolveOrderItemImages` resolves live
 * thumbnails for order items (variant→product fallback) and, like `getCatalog`, MUST never surface
 * another tenant's media. Its reads are `overrideAccess: true` + manual `where { tenant }`; this
 * proves that defense-in-depth on the ORDER-DETAIL path (mirrors `catalog-images` AC4 for the
 * catalog path, which previously had no equivalent). DB-backed; skipped if no Postgres reachable.
 */
describeIntegration('order-images', () => {
  let payload: Payload
  let fx: TenantFixtures
  let mediaAId: number
  let mediaBId: number

  beforeAll(async () => {
    payload = await requireTestPayload()
    fx = await createFixtures(payload)
    mediaAId = (await fx.createMedia(fx.tenantA.id, 'ord-a')).id
    mediaBId = (await fx.createMedia(fx.tenantB.id, 'ord-b')).id

    // tenant-A product + variant get a tenant-A heroImage → should resolve.
    await payload.update({
      collection: 'products',
      data: { heroImage: mediaAId },
      id: fx.productA.id,
      overrideAccess: true,
    })
    await payload.update({
      collection: 'variants',
      data: { heroImage: mediaAId },
      id: fx.variantA.id,
      overrideAccess: true,
    })
  })

  afterAll(async () => {
    await fx?.cleanup()
  })

  it('AC3: resolves a product thumbnail for a tenant-A order item', async () => {
    const images = await resolveOrderItemImages(fx.tenantA.id, [{ product: fx.productA.id }])
    expect(images.get(0)).toBeDefined()
    expect(images.get(0)?.alt).toBe('ord-a')
  })

  it('AC3: resolves a variant thumbnail (variant hero preferred)', async () => {
    const images = await resolveOrderItemImages(fx.tenantA.id, [{ product: fx.productA.id, variant: fx.variantA.id }])
    expect(images.get(0)).toBeDefined()
    expect(images.get(0)?.alt).toBe('ord-a')
  })

  it('R-S3.2: an order item referencing ANOTHER tenant product yields no image (no leak)', async () => {
    // productB belongs to tenant B; resolving in tenant-A context must not surface B's media.
    const images = await resolveOrderItemImages(fx.tenantA.id, [{ product: fx.productB.id }])
    expect(images.get(0)).toBeUndefined()
  })

  it('R-S3.2: a forged cross-tenant heroImage on the product read does NOT leak tenant B media', async () => {
    // Forge directly in the DB (the write guard blocks this via Local API) to exercise the read path.
    await payload.db.drizzle.execute(sql`UPDATE products SET hero_image_id = ${mediaBId} WHERE id = ${fx.productA.id}`)
    const images = await resolveOrderItemImages(fx.tenantA.id, [{ product: fx.productA.id }])
    // tenant-scoped media read (where { tenant: A }) filters out B's media → no thumbnail.
    expect(images.get(0)).toBeUndefined()
    await payload.db.drizzle.execute(sql`UPDATE products SET hero_image_id = ${mediaAId} WHERE id = ${fx.productA.id}`)
  })

  it('R-S3.2: a forged cross-tenant heroImage on the variant read does NOT leak tenant B media', async () => {
    await payload.db.drizzle.execute(sql`UPDATE variants SET hero_image_id = ${mediaBId} WHERE id = ${fx.variantA.id}`)
    // No product hero this item → only the (forged) variant hero, which must be filtered out.
    const images = await resolveOrderItemImages(fx.tenantA.id, [{ variant: fx.variantA.id }])
    expect(images.get(0)).toBeUndefined()
    await payload.db.drizzle.execute(sql`UPDATE variants SET hero_image_id = ${mediaAId} WHERE id = ${fx.variantA.id}`)
  })
})
