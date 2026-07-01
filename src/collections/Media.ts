import type { CollectionConfig } from 'payload'

import { isAdmin, mediaRead } from '@/access'

/**
 * EPIC-3 (SPIKE-S3 / S3.1): per-tenant media library (Upload collection).
 *
 * Tenant isolation: `media` is wired into `multiTenantPlugin.collections` in
 * payload.config.ts, which stamps a `tenant` field and scopes panel rows to the
 * admin's tenant (platform-admin sees all). create/update/delete stay admin-only.
 *
 * S4.6: `read` uses `mediaRead` — PUBLIC for static file serving only. The storefront serves
 * product images through Payload's `/api/media/file/<filename>` route (Vercel Blob behind it),
 * which enforces this collection's `read` access with `isReadingStaticFile` set, so anonymous
 * shop visitors can fetch files. The metadata list/find endpoint (`GET /api/media`) stays
 * admin-only, so anonymous callers cannot enumerate cross-tenant media (R-S3.2 / NFR1). Admin
 * panel rows remain tenant-scoped via the multi-tenant plugin.
 *
 * Storage: defaults to local disk in dev. Vercel Blob adapter (D1) is configured
 * separately on this collection in payload.config.ts (BLOB_READ_WRITE_TOKEN).
 */
export const Media: CollectionConfig = {
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: mediaRead,
    update: isAdmin,
  },

  admin: {
    group: 'Shop',
    useAsTitle: 'alt',
  },

  fields: [
    {
      label: 'Tekst alternatywny',
      name: 'alt',
      required: true,
      type: 'text',
    },
  ],

  slug: 'media',

  upload: {
    // sharp (already a dependency) generates these responsive variants.
    imageSizes: [
      { height: 400, name: 'thumbnail', width: 400 },
      { name: 'card', width: 768 },
      { name: 'hero', width: 1200 },
    ],
    // image/svg+xml excluded deliberately — SVG can carry script content (XSS vector).
    // Only raster-safe types allowed.
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  },
}
