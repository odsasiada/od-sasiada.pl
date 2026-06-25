import type { ShopCategory } from '@/lib/shop'

import Link from 'next/link'

/**
 * Server-rendered category filter (S3.6) — a row of query-param links (`?kategoria=<slug>`) plus
 * an "Wszystkie" reset. No client state: selecting a category is navigation + server re-render.
 * The active link is highlighted (`is-active` + `aria-current`).
 */
export const CategoryFilter = ({
  activeSlug,
  categories,
  tenantSlug,
}: {
  activeSlug?: string
  categories: ShopCategory[]
  tenantSlug: string
}) => {
  if (categories.length === 0) {
    return null
  }

  return (
    <nav aria-label='Filtr kategorii' className='category-filter'>
      <Link
        aria-current={activeSlug ? undefined : 'page'}
        className={activeSlug ? '' : 'is-active'}
        href={`/${tenantSlug}`}
      >
        Wszystkie
      </Link>
      {categories.map((c) => {
        const active = c.slug === activeSlug
        return (
          <Link
            aria-current={active ? 'page' : undefined}
            className={active ? 'is-active' : ''}
            href={`/${tenantSlug}?kategoria=${encodeURIComponent(c.slug)}`}
            key={c.id}
          >
            {c.name}
          </Link>
        )
      })}
    </nav>
  )
}
