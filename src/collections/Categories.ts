import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import { isAdmin } from '@/access'

const SLUG_PATTERN = /^[a-z0-9-]+$/

const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')

const fillSlugFromName: CollectionBeforeValidateHook = async ({ data }) => {
  if (!data || typeof data !== 'object') {
    return data
  }

  const typedData = data as { name?: unknown; slug?: unknown }
  const name = typeof typedData.name === 'string' ? typedData.name : ''
  const slug = typeof typedData.slug === 'string' ? typedData.slug : ''

  if (!slug && name) {
    const slugified = slugify(name)
    if (!slugified) {
      throw new Error('Nazwa musi zawierać przynajmniej jeden znak, który może być użyty w identyfikatorze URL (literę lub cyfrę).')
    }
    typedData.slug = slugified
  }

  return data
}

export const Categories: CollectionConfig = {
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },

  admin: {
    defaultColumns: ['name', 'slug'],
    group: 'Shop',
    useAsTitle: 'name',
  },

  fields: [
    {
      label: 'Nazwa',
      name: 'name',
      required: true,
      type: 'text',
    },
    {
      admin: { description: 'Używany w adresie filtra, np. `?kategoria=warzywa`.' },
      label: 'Identyfikator URL',
      name: 'slug',
      required: true,
      type: 'text',
      validate: (value: unknown): string | true =>
        (typeof value === 'string' && SLUG_PATTERN.test(value)) ||
        'Identyfikator URL może zawierać tylko małe litery, cyfry i myślniki.',
    },
  ],

  hooks: {
    beforeValidate: [fillSlugFromName],
  },

  labels: {
    plural: 'Kategorie',
    singular: 'Kategoria',
  },

  slug: 'categories',
}
