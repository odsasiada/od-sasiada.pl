import type { Field } from 'payload'

import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { ecommercePlugin } from '@payloadcms/plugin-ecommerce'
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { pl } from '@payloadcms/translations/languages/pl'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import {
  adminOnlyFieldAccess,
  adminOrPublishedStatus,
  isAdmin,
  isAuthenticated,
  isCustomer,
  isDocumentOwner,
  publicAccess,
} from '@/access'
import { Categories } from '@/collections/Categories'
import { Customers } from '@/collections/Customers'
import { DeliveryDateExceptions } from '@/collections/DeliveryDateExceptions'
import { DeliverySlots } from '@/collections/DeliverySlots'
import { Media } from '@/collections/Media'
import { Tenants } from '@/collections/Tenants'
import { Users } from '@/collections/Users'
import { categoriesField, heroImageField, heroTenantMatch } from '@/ecommerce/hero-tenant-match'
import { ordersOverride } from '@/ecommerce/orders'
import { env } from '@/env'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const PLN = {
  code: 'PLN',
  decimals: 2,
  label: 'Polish złoty',
  symbol: 'zł',
  symbolDisplay: 'symbol' as const,
}

export default buildConfig({
  admin: {
    importMap: {
      baseDir: dirname,
      importMapFile: path.resolve(dirname, 'importMap.js'),
    },
    user: Users.slug,
  },

  collections: [Users, Tenants, Customers, Media, DeliverySlots, DeliveryDateExceptions, Categories],

  db: postgresAdapter({
    pool: {
      connectionString: env.DATABASE_URL,
    },
  }),

  editor: lexicalEditor({}),

  // S1.7: email via SMTP (Apple). Config from env (.env.local).
  email: nodemailerAdapter({
    defaultFromAddress: env.EMAIL_FROM,
    defaultFromName: env.EMAIL_FROM_NAME,
    skipVerify: env.EMAIL_SKIP_VERIFY,
    transportOptions: {
      auth: {
        pass: env.EMAIL_SMTP_PASSWORD,
        user: env.EMAIL_SMTP_USER,
      },
      host: env.EMAIL_SMTP_HOST,
      port: env.EMAIL_SMTP_PORT,
      // Secure flag inferred from port: 465 = implicit TLS, 587/25 = STARTTLS (secure:false).
      // Apple (smtp.mail.me.com:587) requires STARTTLS — hence we don't trust EMAIL_SECURE directly.
      secure: env.EMAIL_SMTP_PORT === 465,
      tls: {
        rejectUnauthorized: env.EMAIL_TLS_REJECT_UNAUTHORIZED,
      },
    },
  }),

  i18n: {
    fallbackLanguage: 'pl',
    supportedLanguages: { pl },
  },

  plugins: [
    ecommercePlugin({
      access: {
        adminOnlyFieldAccess,
        adminOrPublishedStatus,
        isAdmin,
        isAuthenticated,
        isCustomer,
        isDocumentOwner,
        publicAccess,
      },

      // S1.3: saved customer addresses. Default plugin fields (customer relation + access
      // isDocumentOwner out of the box); we add Polish postal code validation NN-NNN.
      addresses: {
        addressFields: ({ defaultFields }) =>
          defaultFields.map((field): Field => {
            if (field.type === 'text' && field.name === 'postalCode') {
              return {
                ...field,
                validate: (value: unknown) =>
                  !value ||
                  /^\d{2}-\d{3}$/.test(String(value)) ||
                  'Postal code must be in NN-NNN format (e.g. 83-300).',
              }
            }
            return field
          }),
      },

      currencies: {
        defaultCurrency: 'PLN',
        supportedCurrencies: [PLN],
      },

      customers: {
        slug: 'customers',
      },

      // S1.1: inventory disabled — fresh/seasonal goods, no point tracking warehouse stock.
      inventory: false,

      // Line item snapshot + order number (override + hook) — see src/ecommerce/orders.ts
      orders: {
        ordersCollectionOverride: ordersOverride,
      },

      // NOTE: despite docs saying "defaults to true", without an explicit `products` plugin
      // it does NOT create products/variants/carts collections → crash on 'products' relation.
      // Plugin product lacks name/description fields — we add them via official override.
      products: {
        productsCollectionOverride: ({ defaultCollection }) => ({
          ...defaultCollection,
          admin: {
            ...defaultCollection.admin,
            defaultColumns: ['title', 'priceInPLN', '_status'],
            useAsTitle: 'title',
          },
          fields: [
            {
              label: 'Name',
              name: 'title',
              required: true,
              type: 'text',
            },
            {
              label: 'Description',
              name: 'description',
              type: 'textarea',
            },
            categoriesField('Kategorie'),
            // S3.2: optional hero image (D6), tenant-scoped picker + authoritative tenant-match (R-S3.4).
            heroImageField('Zdjęcie główne'),
            ...defaultCollection.fields,
          ],
          hooks: {
            ...defaultCollection.hooks,
            beforeValidate: [...(defaultCollection.hooks?.beforeValidate ?? []), heroTenantMatch],
          },
        }),

        // S3.2: variant-level hero image (D3) — mirrors the products override. `variants` is
        // nested under `products` per the plugin's ProductsConfig type. Keep all default
        // variant fields/admin; add the same tenant-match guard (R-S3.4).
        variants: {
          variantsCollectionOverride: ({ defaultCollection }) => ({
            ...defaultCollection,
            fields: [heroImageField('Zdjęcie wariantu'), ...defaultCollection.fields],
            hooks: {
              ...defaultCollection.hooks,
              beforeValidate: [...(defaultCollection.hooks?.beforeValidate ?? []), heroTenantMatch],
            },
          }),
        },
      },
    }),

    multiTenantPlugin({
      cleanupAfterTenantDelete: false,
      collections: {
        addresses: {},
        carts: {},
        categories: {},
        customers: {},
        // EPIC-2 (S2.8): per-tenant unavailable delivery dates — tenant stamp + panel isolation.
        'delivery-date-exceptions': {},
        // EPIC-2 (S2.1): per-tenant delivery windows — tenant stamp + panel isolation.
        'delivery-slots': {},
        // EPIC-3 (SPIKE-S3): per-tenant media library — tenant stamp + panel isolation.
        media: {},
        orders: {},
        products: {},
        transactions: {},
        variantOptions: {},
        variants: {},
        variantTypes: {},
      },
      debug: true,
      tenantsSlug: 'tenants',
      userHasAccessToAllTenants: (user) => Boolean((user as { roles?: string[] })?.roles?.includes('platform-admin')),
    }),

    // EPIC-3 (SPIKE-S3 / D1): Vercel Blob storage for the Media collection.
    // Conditional on the token (provisioned via Vercel Marketplace) so dev/CI without it
    // fall back to local-disk storage and the app still boots. Verify cross-tenant blob
    // serving isolation (R-S3.2) once a real token is present — see SPIKE-S3 decision note.
    ...(env.BLOB_READ_WRITE_TOKEN
      ? [
          vercelBlobStorage({
            // S4.6: addRandomSuffix MUST be false here. With `true`, the adapter appends a random
            // suffix to the uploaded blob keys — including the resized `imageSizes` variants —
            // but does NOT record that suffix in the `sizes_*_filename` fields. The catalog serves
            // the `card` (768) variant, so `/api/media/file/<name>-768x768.jpg` (no suffix) 404s
            // against the suffixed blob. False keeps blob keys == filenames → variants resolve.
            // Trade-off: predictable `<store>/<filename>` urls. Acceptable for a PUBLIC catalog;
            // future multi-tenant filename collisions to be handled via a per-tenant `prefix`.
            addRandomSuffix: false,
            // Serve via Payload's `/api/media/file/...` route; anonymous access works through
            // Media.read = public (see Media.ts) + a correct SERVER_URL on Vercel (not localhost).
            collections: { media: true },
            token: env.BLOB_READ_WRITE_TOKEN,
          }),
        ]
      : (() => {
          if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'test') {
            console.warn(
              '[media] BLOB_READ_WRITE_TOKEN not set — Media uploads use local disk. Set it via Vercel Marketplace integration for production blob storage.',
            )
          }
          return []
        })()),
  ],

  secret: env.PAYLOAD_SECRET,

  serverURL: env.SERVER_URL,

  // sharp ^0.35 ships a broader constructor signature than Payload's bundled `SharpDependency`
  // type (pinned to sharp 0.32). Runtime is fully compatible; cast to the type buildConfig expects.
  sharp: sharp as Parameters<typeof buildConfig>[0]['sharp'],

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
