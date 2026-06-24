// Pure image-fallback helper — no server-only imports, no I/O, no React (client-safe).
// Safe to import from client islands (Catalog.tsx) and server components alike.

import type { ProductImage } from '@/lib/money'

/**
 * S3.3 / D3 — image fallback: variant → product → placeholder.
 *
 * Single source of truth for the "which image do we show" decision so the catalog card and
 * the order-detail thumbnail can never drift (R-S3.6). Components call this on already-resolved
 * `ProductImage` data (image lookup/tenant-scoping happens server-side, not here).
 *
 * @returns the variant image if present, else the product image, else `null` (caller renders a placeholder).
 */
export const resolveProductImage = (
  variantImage: ProductImage | null,
  productImage: ProductImage | null,
): ProductImage | null => variantImage ?? productImage ?? null
