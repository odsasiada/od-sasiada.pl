import type { Payload } from 'payload'

import { afterAll, beforeAll, expect, it } from 'vitest'

import { createFixtures, type TenantFixtures } from '../setup/fixtures'
import { describeIntegration } from '../setup/integration'
import { requireTestPayload } from '../setup/payload'

/**
 * hero-tenant-isolation regression (S3.2, AC3/AC4 / R-S3.4). The authoritative tenant-match
 * guard on `heroImage` must hold for BOTH products and variants: same-tenant media accepted,
 * cross-tenant media rejected at write — even with overrideAccess, since beforeValidate hooks
 * always run (overrideAccess only bypasses access control, not hooks). Field stays optional
 * (D6). DB-backed; skipped if no Postgres is reachable.
 */
describeIntegration('hero-tenant-isolation', () => {
  let payload: Payload
  let fx: TenantFixtures
  let mediaAId: number
  let mediaBId: number

  const heroIdOf = (doc: { heroImage?: null | number | { id: number } }): null | number => {
    const h = doc.heroImage
    return h && typeof h === 'object' ? h.id : (h ?? null)
  }

  beforeAll(async () => {
    payload = await requireTestPayload()
    fx = await createFixtures(payload)
    mediaAId = (await fx.createMedia(fx.tenantA.id, 'hero-a')).id
    mediaBId = (await fx.createMedia(fx.tenantB.id, 'hero-b')).id
  })

  afterAll(async () => {
    await fx?.cleanup()
  })

  it('product: same-tenant hero image is accepted', async () => {
    const updated = await payload.update({
      collection: 'products',
      data: { heroImage: mediaAId },
      id: fx.productA.id,
      overrideAccess: true,
    })
    expect(heroIdOf(updated)).toBe(mediaAId)
  })

  it('product: cross-tenant hero image is rejected (R-S3.4)', async () => {
    await expect(
      payload.update({
        collection: 'products',
        data: { heroImage: mediaBId },
        id: fx.productA.id,
        overrideAccess: true,
      }),
    ).rejects.toThrow()
  })

  it('variant: same-tenant hero image is accepted', async () => {
    const updated = await payload.update({
      collection: 'variants',
      data: { heroImage: mediaAId },
      id: fx.variantA.id,
      overrideAccess: true,
    })
    expect(heroIdOf(updated)).toBe(mediaAId)
  })

  it('variant: cross-tenant hero image is rejected (R-S3.4)', async () => {
    await expect(
      payload.update({
        collection: 'variants',
        data: { heroImage: mediaBId },
        id: fx.variantA.id,
        overrideAccess: true,
      }),
    ).rejects.toThrow()
  })

  it('D6: a product without a hero image saves fine', async () => {
    const created = await payload.create({
      collection: 'products',
      data: {
        _status: 'published',
        priceInPLN: 700,
        priceInPLNEnabled: true,
        tenant: fx.tenantA.id,
        title: 'Bez hero',
      },
      overrideAccess: true,
    })
    expect(created.id).toBeTruthy()
    expect(heroIdOf(created)).toBeNull()
    await payload.delete({ collection: 'products', id: created.id, overrideAccess: true })
  })
})
