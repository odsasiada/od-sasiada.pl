import * as React from 'react'

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'error' | 'accent'

/** Small tonal pill for status & stock signals. */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** @default 'neutral' */
  tone?: BadgeTone
  /** @default 'md' */
  size?: 'sm' | 'md'
  /** Leading status dot. @default false */
  dot?: boolean
  children?: React.ReactNode
}

export type OrderStatus = 'new' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled'

/** value → { label (PL), tone } map mirroring ecommerce/order-status.ts */
export declare const ORDER_STATUS: Record<OrderStatus, { label: string; tone: BadgeTone }>

export declare function Badge(props: BadgeProps): React.JSX.Element

/** Renders an order status as a dotted Badge with its Polish label. */
export declare function StatusBadge(props: { status: OrderStatus; size?: 'sm' | 'md' }): React.JSX.Element
