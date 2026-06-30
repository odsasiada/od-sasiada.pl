'use client'

import Image from 'next/image'
import { useState } from 'react'

import { useCart } from '@/components/shop/cart-store'
import { Badge } from '@/components/shop/ui/Badge'
import { Price } from '@/components/shop/ui/Price'
import { Select } from '@/components/shop/ui/Select'
import { type CatalogProduct, formatPLN } from '@/lib/money'
import { resolveProductImage } from '@/lib/product-image'

// Grid is 50vw on mobile, 25vw on desktop — let next/image pick the right sharp variant (NFR8).
const CARD_SIZES = '(max-width: 768px) 50vw, 25vw'

const ProductCard = ({
  priority,
  product,
  seller,
}: {
  priority?: boolean
  product: CatalogProduct
  seller?: string
}) => {
  const { add } = useCart()
  const hasVariants = product.variants.length > 0
  const [variantId, setVariantId] = useState<number>(hasVariants ? product.variants[0].id : 0)
  const [added, setAdded] = useState(false)

  const selectedVariant = product.variants.find((v) => v.id === variantId) ?? null
  const price = hasVariants ? (selectedVariant?.priceInPLN ?? null) : product.priceInPLN
  const seasonal = price === null
  // D3 fallback (variant → product → placeholder) via the shared pure helper (R-S3.6).
  const image = resolveProductImage(selectedVariant?.image ?? null, product.image)
  const initial = seller ? seller.trim().charAt(0).toUpperCase() : '🌱'

  const onAdd = () => {
    if (price === null) {
      return
    }
    add({
      priceInPLN: price,
      productId: product.id,
      title: product.title,
      variantId: hasVariants ? variantId : null,
      variantLabel: hasVariants ? (selectedVariant?.label ?? null) : null,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  return (
    <div className='group flex flex-col gap-3.5'>
      <div
        className='relative flex aspect-[4/5] w-full flex-col justify-end overflow-hidden rounded-[var(--radius-xl)] p-[18px] transition-transform group-hover:-translate-y-[3px]'
        style={{ background: image ? 'var(--stone-200)' : 'var(--tint-stone)' }}
      >
        {image ? (
          <Image alt={image.alt} className='object-cover' fill priority={priority} sizes={CARD_SIZES} src={image.url} />
        ) : null}
        {seasonal ? (
          <span className='absolute top-3 right-3'>
            <Badge size='sm' tone='accent'>
              Sezonowe
            </Badge>
          </span>
        ) : null}
        {!image ? (
          <span className='relative font-display text-[length:var(--text-xl)] leading-[1.04] font-bold tracking-tight text-balance text-[color:var(--green-900)]'>
            {product.title}
          </span>
        ) : null}
      </div>

      {image ? (
        <h3 className='font-display text-[length:var(--text-lg)] leading-tight font-bold tracking-tight text-text-body'>
          {product.title}
        </h3>
      ) : null}

      {product.description ? <p className='text-xs text-text-muted'>{product.description}</p> : null}

      {seller ? (
        <span className='inline-flex items-center gap-[7px] text-xs font-semibold text-text-muted'>
          <b
            aria-hidden='true'
            className='inline-flex size-[18px] flex-shrink-0 items-center justify-center rounded-full bg-brand text-[10px] font-normal text-white'
          >
            {initial}
          </b>
          {seller}
        </span>
      ) : null}

      {hasVariants ? (
        <Select
          aria-label={`Wariant — ${product.title}`}
          onChange={(e) => setVariantId(Number(e.target.value))}
          value={variantId}
        >
          {product.variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label.replace(`${product.title} — `, '')} — {formatPLN(v.priceInPLN)}
            </option>
          ))}
        </Select>
      ) : null}

      <div className='mt-auto flex items-center justify-between gap-3'>
        <Price seasonal={seasonal} size='lg' value={price} />
        <button
          aria-label={`Dodaj ${product.title} do koszyka`}
          className='inline-flex size-[46px] flex-shrink-0 items-center justify-center rounded-full bg-accent-cta text-white transition-[background,transform] hover:bg-accent-cta-strong focus-visible:[box-shadow:var(--ring-focus)] focus-visible:outline-none active:scale-[0.93] disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-text-faint data-[added=true]:bg-brand'
          data-added={added ? 'true' : undefined}
          disabled={seasonal}
          onClick={onAdd}
          type='button'
        >
          {added ? (
            <svg
              aria-hidden='true'
              fill='none'
              height='20'
              stroke='currentColor'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2.4'
              viewBox='0 0 24 24'
              width='20'
            >
              <path d='M20 6 9 17l-5-5' />
            </svg>
          ) : (
            <svg
              aria-hidden='true'
              fill='none'
              height='22'
              stroke='currentColor'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              viewBox='0 0 24 24'
              width='22'
            >
              <path d='M12 5v14' />
              <path d='M5 12h14' />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

export const Catalog = ({ products, seller }: { products: CatalogProduct[]; seller?: string }) => {
  if (products.length === 0) {
    return <p className='text-text-muted'>Ten sprzedawca nie ma jeszcze produktów w sprzedaży.</p>
  }

  return (
    <div className='grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5'>
      {products.map((p, idx) => (
        <ProductCard key={p.id} priority={idx < 4} product={p} seller={seller} />
      ))}
    </div>
  )
}
