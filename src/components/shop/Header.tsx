'use client'

import Link from 'next/link'

import { useCart } from '@/components/shop/cart-store'

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
    <header className='shop-header'>
      <Link className='shop-brand' href={`/${slug}`}>
        {tenantName}
      </Link>
      <nav className='shop-nav'>
        {customerName ? (
          <Link className='shop-nav-link' href={`/${slug}/moje-zamowienia`}>
            👤 {customerName}
          </Link>
        ) : (
          <Link className='shop-nav-link' href={`/${slug}/konto`}>
            Log in
          </Link>
        )}
        <Link className='shop-cart-link' href={`/${slug}/koszyk`}>
          🛒 Cart
          {count > 0 && (
            <span className='shop-cart-badge'>
              {count} · {(total / 100).toFixed(2).replace('.', ',')} zł
            </span>
          )}
        </Link>
      </nav>
    </header>
  )
}
