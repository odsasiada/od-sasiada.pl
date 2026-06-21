'use client'

import { useState } from 'react'

import { useCart } from '@/components/shop/cart-store'
import { type CatalogProduct, formatPLN } from '@/lib/money'

const ProductCard = ({ product }: { product: CatalogProduct }) => {
  const { add } = useCart()
  const hasVariants = product.variants.length > 0
  const [variantId, setVariantId] = useState<number>(hasVariants ? product.variants[0].id : 0)
  const [added, setAdded] = useState(false)

  const selectedVariant = product.variants.find((v) => v.id === variantId) ?? null
  const price = hasVariants ? (selectedVariant?.priceInPLN ?? null) : product.priceInPLN

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
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  )
}
