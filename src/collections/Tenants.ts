import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access'

/** Suppliers (platform tenants) with shop settings. */
export const Tenants: CollectionConfig = {
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: () => true,
    update: isAdmin,
  },

  admin: {
    useAsTitle: 'name',
  },

  fields: [
    {
      name: 'name',
      required: true,
      type: 'text',
    },
    {
      index: true,
      name: 'slug',
      required: true,
      type: 'text',
      unique: true,
    },
    {
      fields: [
        {
          admin: { description: 'In grosze (3000 = 30.00 PLN)' },
          defaultValue: 3000,
          name: 'minOrderValue',
          type: 'number',
        },
        {
          name: 'contactPhone',
          type: 'text',
        },
        {
          name: 'priceNotice',
          type: 'textarea',
        },
        {
          defaultValue: true,
          name: 'isActive',
          type: 'checkbox',
        },
      ],
      name: 'settings',
      type: 'group',
    },
  ],

  slug: 'tenants',
}
