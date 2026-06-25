# Edge Case Hunter Review — S3.1 Media

**Skill:** `bmad-review-edge-case-hunter`

**Review code with project read access.**

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

=== src/payload.config.ts (relevant) ===
- collections: [Users, Tenants, Customers, Media, DeliverySlots, DeliveryDateExceptions]
- multiTenantPlugin({ collections: { media: {}, addresses: {}, carts: {}, customers: {}, 'delivery-date-exceptions': {}, 'delivery-slots': {}, orders: {}, products: {}, transactions: {}, variantOptions: {}, variants: {}, variantTypes: {} } })
- ...(env.BLOB_READ_WRITE_TOKEN ? [vercelBlobStorage({ collections: { media: true }, token: env.BLOB_READ_WRITE_TOKEN })] : [])

=== src/env.ts ===
```typescript
import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  client: {},
  runtimeEnv: {
    APP_URL: process.env.APP_URL,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    DATABASE_URL: process.env.DATABASE_URL,
    EMAIL_FROM: process.env.EMAIL_FROM,
    EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
    EMAIL_SECURE: process.env.EMAIL_SECURE,
    EMAIL_SKIP_VERIFY: process.env.EMAIL_SKIP_VERIFY,
    EMAIL_SMTP_HOST: process.env.EMAIL_SMTP_HOST,
    EMAIL_SMTP_PASSWORD: process.env.EMAIL_SMTP_PASSWORD,
    EMAIL_SMTP_PORT: process.env.EMAIL_SMTP_PORT,
    EMAIL_SMTP_USER: process.env.EMAIL_SMTP_USER,
    EMAIL_TLS_REJECT_UNAUTHORIZED: process.env.EMAIL_TLS_REJECT_UNAUTHORIZED,
    PAYLOAD_SECRET: process.env.PAYLOAD_SECRET,
    SERVER_URL: process.env.SERVER_URL,
  },
  server: {
    APP_URL: z.url().default('http://localhost:3000'),
    BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),
    DATABASE_URL: z.url({ protocol: /^postgres/ }),
    EMAIL_FROM: z.email(),
    EMAIL_FROM_NAME: z.string().min(1),
    EMAIL_SECURE: z.stringbool().default(false),
    EMAIL_SKIP_VERIFY: z.stringbool().default(false),
    EMAIL_SMTP_HOST: z.string().min(1),
    EMAIL_SMTP_PASSWORD: z.string().min(1),
    EMAIL_SMTP_PORT: z.coerce.number().min(1).max(65535),
    EMAIL_SMTP_USER: z.email(),
    EMAIL_TLS_REJECT_UNAUTHORIZED: z.stringbool().default(true),
    PAYLOAD_SECRET: z.string().min(32),
    SERVER_URL: z.url().default('http://localhost:3000'),
  },
})
```

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

=== tests/setup/fixtures.ts (createMedia helper) ===
```typescript
const createMedia = async (tenantId: number, alt: string): Promise<{ id: number }> => {
  const data = await sharp({ create: { background: { b: 0, g: 0, r: 0 }, channels: 3, height: 1200, width: 1200 } }).png().toBuffer()
  return track('media', await payload.create({ collection: 'media', data: { alt, tenant: tenantId }, file: { data, mimetype: 'image/png', name: `${alt}.png`, size: data.length }, overrideAccess: true }))
}
```
