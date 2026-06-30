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
    <main className='shop-main'>
      <section className='mb-6 rounded-[var(--radius-xl)] border border-border-hairline bg-surface-card p-5'>
        <h1 className='mb-2 font-display text-[length:var(--text-xl)] font-extrabold tracking-tight text-text-body'>
          {tenant.name}
        </h1>
        <p className='text-sm text-text-muted'>
          Minimalne zamówienie: {formatPLN(tenant.minOrderValue)} · Dostawa w piątki · Płatność gotówką przy odbiorze
          {tenant.contactPhone ? ` · tel. ${tenant.contactPhone}` : ''}
        </p>
        {tenant.priceNotice ? <p className='mt-2 text-xs text-text-faint italic'>{tenant.priceNotice}</p> : null}
      </section>

      <CategoryFilter activeSlug={kategoria} categories={categories} tenantSlug={slug} />

      <Catalog products={products} seller={tenant.name} />
    </main>
  )
}
