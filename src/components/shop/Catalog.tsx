'use client'

import Image from 'next/image'
import { useState } from 'react'

import { useCart } from '@/components/shop/cart-store'
import { type CatalogProduct, formatPLN } from '@/lib/money'
import { resolveProductImage } from '@/lib/product-image'

// Grid is 50vw on mobile, 25vw on desktop — let next/image pick the right sharp variant (NFR8).
const CARD_SIZES = '(max-width: 768px) 50vw, 25vw'

const ProductCard = ({ priority, product }: { priority?: boolean; product: CatalogProduct }) => {
  const { add } = useCart()
  const hasVariants = product.variants.length > 0
  const [variantId, setVariantId] = useState<number>(hasVariants ? product.variants[0].id : 0)
  const [added, setAdded] = useState(false)

  const selectedVariant = product.variants.find((v) => v.id === variantId) ?? null
  const price = hasVariants ? (selectedVariant?.priceInPLN ?? null) : product.priceInPLN
  // D3 fallback (variant → product → placeholder) via the shared pure helper (R-S3.6).
  const image = resolveProductImage(selectedVariant?.image ?? null, product.image)

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
    <div className='product-card'>
      {image ? (
        <Image
          alt={image.alt}
          className='product-image'
          height={image.height ?? 768}
          priority={priority}
          sizes={CARD_SIZES}
          src={image.url}
          width={image.width ?? 768}
        />
      ) : (
        <div aria-hidden='true' className='product-image-placeholder' />
      )}
      <h3 className='product-title'>{product.title}</h3>
      {product.description && <p className='product-desc'>{product.description}</p>}

      {hasVariants ? (
        <select className='variant-select' onChange={(e) => setVariantId(Number(e.target.value))} value={variantId}>
          {product.variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label.replace(`${product.title} — `, '')} — {formatPLN(v.priceInPLN)}
            </option>
          ))}
        </select>
      ) : (
        <p className='product-price'>{price === null ? 'Seasonal price' : formatPLN(price)}</p>
      )}

      <button className='btn-add' disabled={price === null} onClick={onAdd} type='button'>
        {added ? '✓ Added' : 'Add to cart'}
      </button>
    </div>
  )
}

export const Catalog = ({ products }: { products: CatalogProduct[] }) => {
  if (products.length === 0) {
    return <p className='empty'>This supplier has no products for sale yet.</p>
  }

  return (
    <div className='product-grid'>
      {products.map((p, idx) => (
        <ProductCard key={p.id} priority={idx < 4} product={p} />
      ))}
    </div>
  )
}
