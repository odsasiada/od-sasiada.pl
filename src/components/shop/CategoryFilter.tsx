import type { ShopCategory } from '@/lib/shop'

import Link from 'next/link'

import { cn } from '@/lib/utils'

const CHIP =
  'rounded-[var(--radius-pill)] border px-3 py-1.5 text-sm transition-colors border-border-hairline text-text-body hover:bg-[var(--stone-200)]'
const CHIP_ACTIVE = 'border-brand bg-brand text-white hover:bg-brand'

/**
 * Server-rendered category filter (S3.6) — a row of query-param links (`?kategoria=<slug>`) plus
 * an "Wszystkie" reset. No client state: selecting a category is navigation + server re-render.
 * The active link is highlighted (`aria-current`).
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
    <nav aria-label='Filtr kategorii' className='mb-4 flex flex-wrap gap-2'>
      <Link
        aria-current={activeSlug ? undefined : 'page'}
        className={cn(CHIP, !activeSlug && CHIP_ACTIVE)}
        href={`/${tenantSlug}`}
      >
        Wszystkie
      </Link>
      {categories.map((c) => {
        const active = c.slug === activeSlug
        return (
          <Link
            aria-current={active ? 'page' : undefined}
            className={cn(CHIP, active && CHIP_ACTIVE)}
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
