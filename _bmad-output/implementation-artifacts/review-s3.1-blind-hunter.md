# Blind Hunter Review — S3.1 Media

**Skill:** `bmad-review-adversarial-general`

**No project context, no spec — review the code below only.**

===

=== src/collections/Media.ts ===
```typescript
import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access'

export const Media: CollectionConfig = {
  access: { create: isAdmin, delete: isAdmin, read: isAdmin, update: isAdmin },
  admin: { group: 'Shop', useAsTitle: 'alt' },
  fields: [{ label: 'Tekst alternatywny', name: 'alt', required: true, type: 'text' }],
  slug: 'media',
  upload: {
    imageSizes: [
      { height: 400, name: 'thumbnail', width: 400 },
      { name: 'card', width: 768 },
      { name: 'hero', width: 1200 },
    ],
    mimeTypes: ['image/*'],
  },
}
```

=== src/payload.config.ts (relevant sections) ===
- collections: [Users, Tenants, Customers, Media, DeliverySlots, DeliveryDateExceptions]
- multiTenantPlugin({ collections: { media: {}, /* ... other collections */ } })
- ...(env.BLOB_READ_WRITE_TOKEN ? [vercelBlobStorage({ collections: { media: true }, token: env.BLOB_READ_WRITE_TOKEN })] : [])

=== src/env.ts ===
- BLOB_READ_WRITE_TOKEN: z.string().min(1).optional()

=== tests/integration/media-isolation.integration.test.ts ===
```typescript
import type { Payload } from 'payload'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { createFixtures, type TenantFixtures } from '../setup/fixtures'
import { describeIntegration } from '../setup/integration'
import { requireTestPayload } from '../setup/payload'

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

  afterAll(async () => { await fx?.cleanup() })

  it('AC2: sharp generates the configured responsive variants on upload', async () => {
    const docA = await payload.findByID({ collection: 'media', id: mediaAId, overrideAccess: true })
    expect(docA.sizes?.thumbnail?.width).toBe(400)
    expect(docA.sizes?.card?.width).toBe(768)
    expect(docA.sizes?.hero?.width).toBe(1200)
  })

  it('storefront read pattern: where { tenant: A } returns only tenant A media', async () => {
    const listA = await payload.find({ collection: 'media', limit: 200, overrideAccess: true, where: { tenant: { equals: fx.tenantA.id } } })
    expect(listA.docs.some((m) => m.id === mediaAId)).toBe(true)
    expect(listA.docs.some((m) => m.id === mediaBId)).toBe(false)
  })

  it('tenant-B admin media list includes B media and excludes tenant A media', async () => {
    const listB = await payload.find({ collection: 'media', limit: 200, overrideAccess: false, user: fx.adminBUser as never })
    expect(listB.docs.some((m) => m.id === mediaBId)).toBe(true)
    expect(listB.docs.some((m) => m.id === mediaAId)).toBe(false)
  })

  it('tenant-B admin cannot read tenant A media by id (blocked or not found)', async () => {
    let blocked = false; let doc: null | { id: number } = null
    try { doc = await payload.findByID({ collection: 'media', id: mediaAId, overrideAccess: false, user: fx.adminBUser as never }) }
    catch { blocked = true }
    expect(blocked || doc === null || doc.id !== mediaAId).toBe(true)
  })
})
```
