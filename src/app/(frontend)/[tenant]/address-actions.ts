'use server'

import { headers as nextHeaders } from 'next/headers'
import { getPayload } from 'payload'

import config from '@/payload.config'

// NOTE: this 'use server' file is imported by the client component (AddressBook).
// It imports `next/headers` DIRECTLY (like account-actions) — NOT via @/lib/auth.
// Indirect import of next/headers through a regular module breaks Turbopack action proxy
// and disables client component hydration. Types are INLINED for the same reason.
type AddressActionResult = { error: string; ok: false } | { ok: true }

type AddressInput = {
  addressLine1: string
  city: string
  firstName: string
  lastName: string
  phone: string
  postalCode: string
  title: null | string
}

/** Logged-in customer belonging to this supplier (inline — no @/lib/auth import). */
const resolveCustomer = async (tenantId: number) => {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await nextHeaders() })

  if (user?.collection !== 'customers') {
    return null
  }

  const c = user as unknown as { id: number; tenant?: number | { id: number } | null }
  const tenant = typeof c.tenant === 'object' ? c.tenant?.id : c.tenant

  return tenant === tenantId ? { id: c.id } : null
}

export const saveAddress = async (tenantId: number, data: AddressInput): Promise<AddressActionResult> => {
  const customer = await resolveCustomer(tenantId)

  if (!customer) {
    return { error: 'You must be logged in.', ok: false }
  }

  if (data.postalCode && !/^\d{2}-\d{3}$/.test(data.postalCode)) {
    return { error: 'Postal code must be in NN-NNN format.', ok: false }
  }

  const payload = await getPayload({ config })

  await payload.create({
    collection: 'addresses',
    data: {
      addressLine1: data.addressLine1,
      city: data.city,
      country: 'PL',
      customer: customer.id,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      postalCode: data.postalCode,
      tenant: tenantId,
      title: data.title || undefined,
    },
    overrideAccess: true,
  })

  return {
    ok: true,
  }
}

export const deleteAddress = async (tenantId: number, addressId: number): Promise<AddressActionResult> => {
  const customer = await resolveCustomer(tenantId)

  if (!customer) {
    return { error: 'You must be logged in.', ok: false }
  }

  const payload = await getPayload({ config })
  // Verify owner before deletion.
  const addr = await payload.findByID({ collection: 'addresses', depth: 0, disableErrors: true, id: addressId })
  const owner = addr && (typeof addr.customer === 'object' ? addr.customer?.id : addr.customer)

  if (!addr || owner !== customer.id) {
    return { error: 'Address not found.', ok: false }
  }

  await payload.delete({
    collection: 'addresses',
    id: addressId,
    overrideAccess: true,
  })

  return { ok: true }
}
