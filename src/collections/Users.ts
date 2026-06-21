import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access'

/** Panel users: platform operator + suppliers (tenant admin). */
export const Users: CollectionConfig = {
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },

  admin: {
    useAsTitle: 'email',
  },

  auth: true,

  fields: [
    {
      defaultValue: ['tenant-admin'],
      hasMany: true,
      name: 'roles',
      options: [
        { label: 'Platform Admin', value: 'platform-admin' },
        { label: 'Tenant Admin', value: 'tenant-admin' },
      ],
      type: 'select',
    },
  ],

  slug: 'users',
}
