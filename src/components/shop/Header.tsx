'use client'

import Link from 'next/link'

import { useCart } from '@/components/shop/cart-store'
import { BrandMark } from '@/components/shop/ui/BrandMark'
import { formatPLN } from '@/lib/money'

const LINK =
  'inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-2 text-sm font-semibold whitespace-nowrap text-text-muted transition-colors hover:bg-[var(--stone-200)] hover:text-text-body'

/**
 * Sticky brand header. Global od-sąsiada.pl mark + the seller's shop name, plus
 * account and cart entry points with a live cart count/total.
 */
export const Header = ({
  customerName,
  slug,
  tenantName,
}: {
  customerName: null | string
  slug: string
  tenantName: string
}) => {
  const { count, total } = useCart()

  return (
    <header className='sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border-hairline bg-[color-mix(in_srgb,var(--surface-page)_86%,transparent)] px-6 py-4 backdrop-blur-md backdrop-saturate-150 max-[560px]:px-[18px]'>
      <Link className='inline-flex min-w-0 items-center gap-3' href={`/${slug}`}>
        <BrandMark />
        <span className='flex min-w-0 flex-col leading-[1.05]'>
          <span className='text-[10px] font-bold tracking-[var(--tracking-caps)] text-text-faint uppercase'>
            od-sąsiada.pl
          </span>
          <span className='truncate font-display text-[length:var(--text-md)] font-bold tracking-[var(--tracking-snug)] text-text-body'>
            {tenantName}
          </span>
        </span>
      </Link>

      <nav className='flex items-center gap-1.5'>
        <Link className={LINK} href={customerName ? `/${slug}/moje-zamowienia` : `/${slug}/konto`}>
          <svg
            aria-hidden='true'
            fill='none'
            height='18'
            stroke='currentColor'
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            viewBox='0 0 24 24'
            width='18'
          >
            <circle cx='12' cy='8' r='4' />
            <path d='M5.5 21a8.38 8.38 0 0 1 13 0' />
          </svg>
          <span className='max-[560px]:hidden'>{customerName ?? 'Zaloguj się'}</span>
        </Link>

        <Link
          className={`${LINK} bg-[var(--text-body)] text-surface-card hover:bg-black hover:text-surface-card`}
          href={`/${slug}/koszyk`}
        >
          <svg
            aria-hidden='true'
            fill='none'
            height='18'
            stroke='currentColor'
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            viewBox='0 0 24 24'
            width='18'
          >
            <circle cx='9' cy='20' r='1.4' />
            <circle cx='18' cy='20' r='1.4' />
            <path d='M2 2h2.2l2.3 13a1.6 1.6 0 0 0 1.6 1.3h8.7a1.6 1.6 0 0 0 1.6-1.3L21 6H5.3' />
          </svg>
          <span className='max-[560px]:hidden'>Koszyk</span>
          {count > 0 ? (
            <span className='ml-0.5 inline-flex items-center rounded-[var(--radius-pill)] bg-accent-cta px-2 py-px text-xs font-bold text-white tabular-nums'>
              {count} · {formatPLN(total)}
            </span>
          ) : null}
        </Link>
      </nav>
    </header>
  )
}
