import * as React from 'react'

/**
 * Sticky brand header. Shows the global od-sąsiada.pl mark + the seller's shop
 * name, plus account and cart entry points with a live cart count/total.
 */
export interface ShopHeaderProps {
  /** Seller / tenant shop name. */
  tenantName?: string
  /** Logged-in customer name, or null for "Zaloguj się". */
  customerName?: string | null
  /** Items in cart. */
  cartCount?: number
  /** Cart total in grosze. */
  cartTotal?: number
  onCart?: () => void
  onAccount?: () => void
  className?: string
}

export declare function ShopHeader(props: ShopHeaderProps): React.JSX.Element
