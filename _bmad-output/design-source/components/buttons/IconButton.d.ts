import * as React from 'react'

export type IconButtonVariant = 'ghost' | 'outline' | 'danger'
export type IconButtonSize = 'sm' | 'md' | 'lg'

/**
 * Square, icon-only button (cart remove, close, menu). Always provide
 * `aria-label` — there is no visible text.
 */
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** @default 'ghost' */
  variant?: IconButtonVariant
  /** @default 'md' (44px touch target) */
  size?: IconButtonSize
  /** Accessible name — required. */
  'aria-label': string
  children?: React.ReactNode
}

export declare function IconButton(props: IconButtonProps): React.JSX.Element
