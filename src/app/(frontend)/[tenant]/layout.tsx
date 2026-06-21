import type { ReactNode } from 'react'

import { notFound } from 'next/navigation'

import { CartProvider } from '@/components/shop/cart-store'
import { Header } from '@/components/shop/Header'
import { getCurrentCustomer } from '@/lib/auth'
import { getCartSnapshot } from '@/lib/cart'
import { getTenantBySlug } from '@/lib/shop'

export default async function TenantLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ tenant: string }>
}) {
  const { tenant: slug } = await params
  const tenant = await getTenantBySlug(slug)

  if (!tenant) {
    notFound()
  }

  const customer = await getCurrentCustomer(tenant.id)
  const customerName = customer ? (customer.firstName ?? customer.email) : null
  const cart = await getCartSnapshot(tenant.id)

  return (
    <CartProvider initial={cart} isLoggedIn={Boolean(customer)} slug={tenant.slug} tenantId={tenant.id}>
      <Header customerName={customerName} slug={tenant.slug} tenantName={tenant.name} />
      {children}
    </CartProvider>
  )
}
