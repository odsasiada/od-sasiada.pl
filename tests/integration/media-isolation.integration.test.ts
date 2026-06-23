import type { Payload } from 'payload'

import { afterAll, beforeAll, expect, it } from 'vitest'

import { createFixtures, type TenantFixtures } from '../setup/fixtures'
import { describeIntegration } from '../setup/integration'
import { requireTestPayload } from '../setup/payload'

/**
 * media-tenant-isolation regression (S3.1, AC3 / NFR1 / R-S3.2) — mirrors
 * `orders-isolation`. The `media` Upload collection has `read: isAdmin` (any panel
 * user, NOT tenant-scoped), so cross-tenant isolation is enforced solely by
 * multiTenantPlugin's row scoping. Contract: a tenant-B admin (overrideAccess:false)
 * can neither LIST nor READ tenant A's media, while an explicit `where { tenant }`
 * (the storefront read pattern, S3.3) returns only that tenant's media.
 *
 * Media records are created via the shared `fx.createMedia` helper (real PNG; Q1: upload
 * collections require a binary on create). DB-backed; skipped if no Postgres is reachable.
 */
describeIntegration('media-tenant-isolation', () => {
  let payload: Payload
  let fx: TenantFixtures
  let mediaAId: number
  let mediaBId: number

  beforeAll(async () => {
    payload = await requireTestPayload()
    fx = await createFixtures(payload)
    mediaAId = (await fx.createMedia(fx.tenantA.id, 'media-a')).id
    mediaBId = (await fx.createMedia(fx.tenantB.id, 'media-b')).id
  })

  afterAll(async () => {
    await fx?.cleanup()
  })

  it('AC2: sharp generates the configured responsive variants on upload', async () => {
    const docA = await payload.findByID({ collection: 'media', id: mediaAId, overrideAccess: true })
    expect(docA.sizes?.thumbnail?.width).toBe(400)
    expect(docA.sizes?.card?.width).toBe(768)
    expect(docA.sizes?.hero?.width).toBe(1200)
  })

  it('storefront read pattern: where { tenant: A } returns only tenant A media', async () => {
    const listA = await payload.find({
      collection: 'media',
      limit: 200,
      overrideAccess: true,
      where: { tenant: { equals: fx.tenantA.id } },
    })
    expect(listA.docs.some((m) => m.id === mediaAId)).toBe(true)
    expect(listA.docs.some((m) => m.id === mediaBId)).toBe(false)
  })

  it('tenant-B admin media list includes B media and excludes tenant A media', async () => {
    const listB = await payload.find({
      collection: 'media',
      limit: 200,
      overrideAccess: false,
      user: fx.adminBUser as never,
    })
    expect(listB.docs.some((m) => m.id === mediaBId)).toBe(true)
    expect(listB.docs.some((m) => m.id === mediaAId)).toBe(false)
  })

  it('tenant-B admin cannot read tenant A media by id (blocked or not found)', async () => {
    let blocked = false
    let doc: null | { id: number } = null
    try {
      doc = await payload.findByID({
        collection: 'media',
        id: mediaAId,
        overrideAccess: false,
        user: fx.adminBUser as never,
      })
    } catch {
      blocked = true
    }
    // Isolation holds if the read was blocked OR did not return tenant A's doc.
    expect(blocked || doc === null || doc.id !== mediaAId).toBe(true)
  })
})
