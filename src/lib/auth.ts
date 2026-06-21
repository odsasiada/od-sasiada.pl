import { headers as nextHeaders } from 'next/headers'
import { getPayload } from 'payload'

import config from '@/payload.config'

export type CurrentCustomer = {
  email: string
  firstName: null | string
  id: number
  lastName: null | string
} | null

/**
 * Returns the logged-in customer — but ONLY if they belong to the specified supplier.
 * A customer logged in with supplier A is treated as unauthenticated on supplier B's page.
 */
export const getCurrentCustomer = async (tenantId: number): Promise<CurrentCustomer> => {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await nextHeaders() })

  if (!user || user.collection !== 'customers') {
    return null
  }

  const customer = user as unknown as {
    email: string
    firstName?: null | string
    id: number
    lastName?: null | string
    tenant?: number | { id: number } | null
  }
  const tenant = typeof customer.tenant === 'object' ? customer.tenant?.id : customer.tenant
  if (tenant !== tenantId) {
    return null
  }

  return {
    email: customer.email,
    firstName: customer.firstName ?? null,
    id: customer.id,
    lastName: customer.lastName ?? null,
  }
}
