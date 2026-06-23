import { notFound } from 'next/navigation'

import { CartView } from '@/components/shop/CartView'
import { getCustomerAddresses } from '@/lib/addresses'
import { getAvailableDelivery } from '@/lib/delivery-slots-read'
import { getTenantBySlug } from '@/lib/shop'

export default async function CartPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params
  const tenant = await getTenantBySlug(slug)

  if (!tenant) {
    notFound()
  }

  const addresses = await getCustomerAddresses(tenant.id)
  const { deliveryEnabled, slots } = await getAvailableDelivery(tenant.id)

  return (
    <CartView
      addresses={addresses}
      availableSlots={slots}
      deliveryEnabled={deliveryEnabled}
      minOrderValue={tenant.minOrderValue}
      slug={tenant.slug}
      tenantId={tenant.id}
    />
  )
}
