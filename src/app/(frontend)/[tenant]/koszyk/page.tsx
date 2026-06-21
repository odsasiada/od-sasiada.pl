import { notFound } from 'next/navigation'

import { CartView } from '@/components/shop/CartView'
import { getCustomerAddresses } from '@/lib/addresses'
import { getTenantBySlug } from '@/lib/shop'

export default async function CartPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params
  const tenant = await getTenantBySlug(slug)

  if (!tenant) {
    notFound()
  }

  const addresses = await getCustomerAddresses(tenant.id)

  return <CartView addresses={addresses} minOrderValue={tenant.minOrderValue} slug={tenant.slug} tenantId={tenant.id} />
}
