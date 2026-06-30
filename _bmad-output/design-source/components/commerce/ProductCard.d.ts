import * as React from 'react'

export interface ProductVariant {
  value: string | number
  label: string
}

/**
 * Catalog product card — exposed photo, prominent seller chip (trust), price,
 * optional variant select, and the terracotta "Dodaj do koszyka" CTA. Inside a
 * [data-tenant] scope the CTA adopts the seller's accent.
 */
export interface ProductCardProps {
  title: string
  description?: string
  /** Price in grosze. */
  price?: number | null
  unit?: string
  /** Seller / tenant display name — shown as a chip over the photo. */
  seller?: string
  /** Image URL; omit for the brand hatch placeholder. */
  image?: string
  imageAlt?: string
  /** Tiny uppercase category label on the tile (e.g. "Miody"). */
  category?: string
  /** Warm tint for the photo-less tile. @default 'stone' */
  tone?: 'honey' | 'leaf' | 'pickle' | 'bee' | 'stone'
  /** Draft / no fixed price → "Cena sezonowa" + "Zapytaj o cenę". */
  seasonal?: boolean
  /** Low-stock count → soft amber "Zostało N" badge. */
  lowStock?: number | null
  /** Variant options; when present a Select sits above the price row. */
  variants?: ProductVariant[]
  variantValue?: string | number
  onVariantChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  /** Add to cart (circular terracotta button). For seasonal items this is "Zapytaj o cenę". */
  onAdd?: () => void
  /** Shows the "✓ Dodano" confirmation state. */
  added?: boolean
  className?: string
}

export declare function ProductCard(props: ProductCardProps): React.JSX.Element
