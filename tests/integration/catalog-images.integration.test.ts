import type { Payload } from 'payload'

import { sql } from '@payloadcms/db-postgres'
import { afterAll, beforeAll, expect, it } from 'vitest'

import { getCatalog } from '@/lib/shop'
import { createFixtures, type TenantFixtures } from '../setup/fixtures'
import { describeIntegration } from '../setup/integration'
import { requireTestPayload } from '../setup/payload'

/**
 * catalog-images tenant-isolation (S3.3, AC2/AC4 / R-S3.2) — getCatalog must attach the
 * resolved `image` (preferring the `card` sharp variant) for products/variants whose heroImage
 * belongs to THIS tenant, and must NEVER surface another tenant's media even when a heroImage
 * reference points cross-tenant (defense-in-depth: the read is overrideAccess + manual
 * `where { tenant }`). Media created via the shared `fx.createMedia` helper. DB-backed; skipped
 * if no Postgres is reachable.
 */
describeIntegration('catalog-images', () => {
  let payload: Payload
  let fx: TenantFixtures
  let mediaAId: number
  let mediaBId: number

  beforeAll(async () => {
    payload = await requireTestPayload()
    fx = await createFixtures(payload)
    mediaAId = (await fx.createMedia(fx.tenantA.id, 'cat-a')).id
    mediaBId = (await fx.createMedia(fx.tenantB.id, 'cat-b')).id

    // productA (tenant A) gets a tenant-A heroImage → should resolve.
    await payload.update({
      collection: 'products',
      data: { heroImage: mediaAId },
      id: fx.productA.id,
      overrideAccess: true,
    })
    // variantA (tenant A) gets the SAME tenant-A media → variant image should resolve too.
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

  it('AC2: attaches a resolved image (card variant) to a product with a tenant-A heroImage', async () => {
    const catalog = await getCatalog(fx.tenantA.id)
    const prod = catalog.find((p) => p.id === fx.productA.id)
    expect(prod?.image).not.toBeNull()
    expect(prod?.image?.alt).toBe('cat-a')
    expect(prod?.image?.url).toContain('cat-a')
    // Card sharp variant is 768w.
    expect(prod?.image?.width).toBe(768)
  })

  it('AC2: attaches a resolved image to a variant with a heroImage', async () => {
    const catalog = await getCatalog(fx.tenantA.id)
    const variantProduct = catalog.find((p) => p.id === fx.variantA.productId)
    const v = variantProduct?.variants.find((x) => x.id === fx.variantA.id)
    expect(v?.image).not.toBeNull()
    expect(v?.image?.alt).toBe('cat-a')
  })

  it('AC4 (R-S3.2): a cross-tenant heroImage reference does NOT leak tenant B media', async () => {
    // S3.2's beforeValidate hook blocks setting a cross-tenant heroImage via the Local API, so to
    // exercise the READ path's defense-in-depth we forge the reference directly in the DB (bypassing
    // the write guard) — simulating a stale/forged row. getCatalog's tenant-scoped media read must
    // still refuse to surface tenant B's media.
    await payload.db.drizzle.execute(sql`UPDATE products SET hero_image_id = ${mediaBId} WHERE id = ${fx.productA.id}`)
    const catalog = await getCatalog(fx.tenantA.id)
    const prod = catalog.find((p) => p.id === fx.productA.id)
    // The tenant-scoped media read (where { tenant: A }) filters out B's media → no leak.
    expect(prod?.image).toBeNull()

    // Restore the valid tenant-A reference for cleanup symmetry.
    await payload.db.drizzle.execute(sql`UPDATE products SET hero_image_id = ${mediaAId} WHERE id = ${fx.productA.id}`)
  })

  it('products without a heroImage have image === null', async () => {
    const catalog = await getCatalog(fx.tenantA.id)
    const noImageProduct = catalog.find((p) => p.id === fx.variantA.productId)
    // variantA's parent product has no product-level heroImage in fixtures.
    expect(noImageProduct?.image).toBeNull()
  })
})
