import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access'

/**
 * EPIC-3 (SPIKE-S3 / S3.1): per-tenant media library (Upload collection).
 *
 * Tenant isolation: `media` is wired into `multiTenantPlugin.collections` in
 * payload.config.ts, which stamps a `tenant` field and scopes panel rows to the
 * admin's tenant (platform-admin sees all). Access below is panel-only (collection
 * `users`); the public storefront reads images via `overrideAccess: true` + a manual
 * `where { tenant }` (architektura §3, S3.3) — so `read` is intentionally NOT public,
 * avoiding cross-tenant leakage (R-S3.2).
 *
 * Storage: defaults to local disk in dev. Vercel Blob adapter (D1) is configured
 * separately on this collection in payload.config.ts once @payloadcms/storage-vercel-blob
 * is installable and BLOB_READ_WRITE_TOKEN is provisioned — see SPIKE-S3 decision note.
 */
export const Media: CollectionConfig = {
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: isAdmin,
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
    mimeTypes: ['image/*'],
  },
}
