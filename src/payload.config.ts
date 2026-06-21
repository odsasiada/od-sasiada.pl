import type { Field } from 'payload'

import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { ecommercePlugin } from '@payloadcms/plugin-ecommerce'
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
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
import { Customers } from '@/collections/Customers'
import { Tenants } from '@/collections/Tenants'
import { Users } from '@/collections/Users'
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

  collections: [Users, Tenants, Customers],

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
            ...defaultCollection.fields,
          ],
        }),
      },
    }),

    multiTenantPlugin({
      collections: {
        addresses: {},
        carts: {},
        customers: {},
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
  ],

  secret: env.PAYLOAD_SECRET,

  sharp,

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
