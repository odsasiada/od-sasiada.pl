import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access'
import { env } from '@/env'

/** Shop customers (buyers from a specific supplier). Separate auth from the panel. */
export const Customers: CollectionConfig = {
  access: {
    create: () => true,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },

  admin: {
    group: 'Shop',
    useAsTitle: 'email',
  },

  auth: {
    forgotPassword: {
      generateEmailHTML: async (args) => {
        const token = args?.token ?? ''
        const user = args?.user as { tenant?: number | { id: number; slug?: string } | null } | undefined
        const req = args?.req

        // Resolve supplier slug so the reset link points to the correct shop.
        let slug = ''
        const tenant = user?.tenant
        if (tenant && typeof tenant === 'object' && tenant.slug) {
          slug = tenant.slug
        } else if (tenant && req?.payload) {
          const id = typeof tenant === 'object' ? tenant.id : tenant
          const doc = await req.payload.findByID({ collection: 'tenants', depth: 0, disableErrors: true, id })
          slug = doc?.slug ?? ''
        }

        const base = env.APP_URL.replace(/\/$/, '')
        const url = `${base}/${slug}/reset-hasla?token=${token}`
        return `
          <div style="font-family:system-ui,sans-serif;color:#1f2421">
            <h2>Password reset</h2>
            <p>We received a request to reset your account password. Click the link below (valid for 1 hour):</p>
            <p><a href="${url}" style="color:#2f7a3f;font-weight:600">Set new password</a></p>
            <p style="color:#6b716c;font-size:13px">If this wasn't you, ignore this message.</p>
          </div>`
      },
      generateEmailSubject: () => 'Password reset — od sąsiada',
    },
  },

  fields: [
    {
      name: 'firstName',
      type: 'text',
    },
    {
      name: 'lastName',
      type: 'text',
    },
    {
      name: 'phone',
      type: 'text',
    },
  ],

  slug: 'customers',
}
