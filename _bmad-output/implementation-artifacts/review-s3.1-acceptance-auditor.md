# Acceptance Auditor Review — S3.1 Media

**Review code against spec below.**

===

## SPEC (Story S3.1) — Acceptance Criteria

1. **Kolekcja `Media` (Upload)** istnieje (`src/collections/Media.ts`, slug `media`), wpięta w `collections: [...]` i w `multiTenantPlugin.collections` (`media: {}`) → pole/izolacja tenant od pluginu.
2. **Warianty sharp** (thumbnail 400², card 768w, hero 1200w) + `mimeTypes: ['image/*']`; pole **`alt` wymagane**.
3. **Access panel-only, tenant-scoped; `read` celowo NIE publiczny** — dostawca B nie widzi/edytuje mediów A (panel + Local API). Izolacja zależy wyłącznie od `multiTenantPlugin` (jak `orders`). Test integracyjny `media-isolation` weryfikuje NFR1.
4. **Storage = Vercel Blob** — `vercelBlobStorage({ collections: { media: true }, token })` aktywny gdy `env.BLOB_READ_WRITE_TOKEN` ustawiony; bez tokenu fallback na dysk lokalny (dev), aplikacja wstaje.
5. **URL obrazu nie przecieka cross-tenant (R-S3.2)** — brak przewidywalnego/listowalnego dostępu do mediów innego tenanta. Wymaga realnego bloba (token) do potwierdzenia.
6. **Bez regresji**: `pnpm payload:types`, `pnpm test`, `pnpm lint`, `pnpm dev` — zielone. Gotcha `products:` nietknięta.

## CODE TO REVIEW

### src/collections/Media.ts (full)
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

### src/payload.config.ts (relevant)
- `collections: [Users, Tenants, Customers, Media, DeliverySlots, DeliveryDateExceptions]`
- `multiTenantPlugin({ ... collections: { media: {}, addresses: {}, carts: {}, ... } })`
- `...(env.BLOB_READ_WRITE_TOKEN ? [vercelBlobStorage({ collections: { media: true }, token: env.BLOB_READ_WRITE_TOKEN })] : [])`

### src/env.ts (relevant)
- `BLOB_READ_WRITE_TOKEN: z.string().min(1).optional()`

### tests/integration/media-isolation.integration.test.ts (full)
```typescript
describeIntegration('media-tenant-isolation', () => {
  let payload: Payload, fx: TenantFixtures, mediaAId: number, mediaBId: number

  beforeAll(async () => {
    payload = await requireTestPayload()
    fx = await createFixtures(payload)
    mediaAId = (await fx.createMedia(fx.tenantA.id, 'media-a')).id
    mediaBId = (await fx.createMedia(fx.tenantB.id, 'media-b')).id
  })
  afterAll(async () => { await fx?.cleanup() })

  it('AC2: sharp generates configured variants', async () => {
    const docA = await payload.findByID({ collection: 'media', id: mediaAId, overrideAccess: true })
    expect(docA.sizes?.thumbnail?.width).toBe(400)
    expect(docA.sizes?.card?.width).toBe(768)
    expect(docA.sizes?.hero?.width).toBe(1200)
  })

  it('storefront: where { tenant: A } returns only A media', async () => {
    const listA = await payload.find({ collection: 'media', limit: 200, overrideAccess: true, where: { tenant: { equals: fx.tenantA.id } } })
    expect(listA.docs.some((m) => m.id === mediaAId)).toBe(true)
    expect(listA.docs.some((m) => m.id === mediaBId)).toBe(false)
  })

  it('tenant-B admin list includes B excludes A', async () => {
    const listB = await payload.find({ collection: 'media', limit: 200, overrideAccess: false, user: fx.adminBUser as never })
    expect(listB.docs.some((m) => m.id === mediaBId)).toBe(true)
    expect(listB.docs.some((m) => m.id === mediaAId)).toBe(false)
  })

  it('tenant-B admin cannot read A media by id', async () => {
    let blocked = false; let doc = null
    try { doc = await payload.findByID({ collection: 'media', id: mediaAId, overrideAccess: false, user: fx.adminBUser as never }) }
    catch { blocked = true }
    expect(blocked || doc === null || doc.id !== mediaAId).toBe(true)
  })
})
```

===

Output findings as Markdown list. Each finding: one-line title, which AC/constraint violated, and evidence from code.
