import type { ProductImage } from '@/lib/money'

import { describe, expect, it } from 'vitest'

import { resolveProductImage } from '@/lib/product-image'

const variantImg: ProductImage = { alt: 'wariant', height: 768, url: '/api/media/variant.png', width: 768 }
const productImg: ProductImage = { alt: 'produkt', height: 768, url: '/api/media/product.png', width: 768 }

describe('resolveProductImage (D3: wariant → produkt → placeholder)', () => {
  it('zwraca zdjęcie wariantu, gdy istnieje (wariant wygrywa)', () => {
    expect(resolveProductImage(variantImg, productImg)).toBe(variantImg)
  })

  it('robi fallback do zdjęcia produktu, gdy brak zdjęcia wariantu', () => {
    expect(resolveProductImage(null, productImg)).toBe(productImg)
  })

  it('zwraca null, gdy brak zdjęcia na obu poziomach (placeholder)', () => {
    expect(resolveProductImage(null, null)).toBeNull()
  })

  it('preferuje wariant nawet gdy oba pozioma mają zdjęcie', () => {
    const result = resolveProductImage(variantImg, productImg)
    expect(result?.url).toBe('/api/media/variant.png')
  })
})
