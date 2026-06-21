import type { SavedAddress } from '@/lib/money'
import type { Address } from '@/payload-types'

import { getPayload } from 'payload'

import { getCurrentCustomer } from '@/lib/auth'
import config from '@/payload.config'

const toSaved = (doc: Address): SavedAddress => ({
  addressLine1: doc.addressLine1 ?? '',
  city: doc.city ?? '',
  firstName: doc.firstName ?? '',
  id: doc.id,
  lastName: doc.lastName ?? '',
  phone: doc.phone ?? '',
  postalCode: doc.postalCode ?? '',
  title: doc.title ?? null,
})

/**
 * Addresses of the logged-in customer for this supplier. Plain server util (NOT 'use server'),
 * used by server-components — to avoid importing a 'use server' action module
 * on both server and client sides (which breaks client action proxying).
 */
export const getCustomerAddresses = async (tenantId: number): Promise<SavedAddress[]> => {
  const customer = await getCurrentCustomer(tenantId)
  if (!customer) {
    return []
  }
  const payload = await getPayload({ config })
  const res = await payload.find({
    collection: 'addresses',
    depth: 0,
    limit: 50,
    overrideAccess: true,
    where: { customer: { equals: customer.id }, tenant: { equals: tenantId } },
  })
  return res.docs.map(toSaved)
}
