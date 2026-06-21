// Pure types + formatting — no server-only imports (client-safe).

export type CatalogVariant = {
  id: number
  label: string
  priceInPLN: number
}

export type CatalogProduct = {
  description: null | string
  id: number
  priceInPLN: null | number
  title: string
  variants: CatalogVariant[]
}

export type ShopTenant = {
  contactPhone: null | string
  id: number
  minOrderValue: number
  name: string
  priceNotice: null | string
  slug: string
}

// Addresses — shared client/server types (NOT in a 'use server' file, because importing types
// from a 'use server' module into a client component breaks island hydration).
export type SavedAddress = {
  addressLine1: string
  city: string
  firstName: string
  id: number
  lastName: string
  phone: string
  postalCode: string
  title: null | string
}

export type AddressInput = Omit<SavedAddress, 'id'>

// Cart — shared client/server shapes. Kept here (pure, no server-only imports) so both the
// server cart reader (@/lib/cart) and the client store (cart-store) reference one definition.
export type CartLine = {
  key: string
  priceInPLN: number
  productId: number
  quantity: number
  title: string
  variantId: null | number
  variantLabel: null | string
}

export type CartSnapshot = {
  count: number
  items: CartLine[]
  total: number
}

export const EMPTY_CART: CartSnapshot = { count: 0, items: [], total: 0 }

/** 1.30 PLN — from grosze. */
export const formatPLN = (grosze: number): string => `${(grosze / 100).toFixed(2).replace('.', ',')} zł`
