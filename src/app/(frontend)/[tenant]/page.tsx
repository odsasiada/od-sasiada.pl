import { notFound } from 'next/navigation'

import { Catalog } from '@/components/shop/Catalog'
import { CategoryFilter } from '@/components/shop/CategoryFilter'
import { formatPLN, getCatalog, getCategories, getTenantBySlug } from '@/lib/shop'

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>
  searchParams: Promise<{ kategoria?: string | string[] }>
}) {
  const { tenant: slug } = await params
  const tenant = await getTenantBySlug(slug)

  if (!tenant) {
    notFound()
  }

  const { kategoria: kategoriaParam } = await searchParams
  // Next delivers `string[]` for a repeated query key (`?kategoria=a&kategoria=b`) — take the first.
  const kategoria = Array.isArray(kategoriaParam) ? kategoriaParam[0] : kategoriaParam
  const [categories, products] = await Promise.all([getCategories(tenant.id), getCatalog(tenant.id, kategoria)])

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

      <CategoryFilter activeSlug={kategoria} categories={categories} tenantSlug={slug} />

      <Catalog products={products} />
    </main>
  )
}
