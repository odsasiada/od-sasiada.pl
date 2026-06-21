import { notFound } from 'next/navigation'

import { Catalog } from '@/components/shop/Catalog'
import { formatPLN, getCatalog, getTenantBySlug } from '@/lib/shop'

export default async function CatalogPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params
  const tenant = await getTenantBySlug(slug)

  if (!tenant) {
    notFound()
  }

  const products = await getCatalog(tenant.id)

  return (
    <main className='container'>
      <section className='tenant-intro'>
        <h1>{tenant.name}</h1>
        <p className='tenant-meta'>
          Minimum order: {formatPLN(tenant.minOrderValue)} · Delivery on Fridays
          {tenant.contactPhone ? ` · tel. ${tenant.contactPhone}` : ''}
        </p>
        {tenant.priceNotice && <p className='price-notice'>{tenant.priceNotice}</p>}
      </section>

      <Catalog products={products} />
    </main>
  )
}
