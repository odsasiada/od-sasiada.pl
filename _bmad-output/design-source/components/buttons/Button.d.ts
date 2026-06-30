import * as React from 'react'

export type ButtonVariant = 'primary' | 'cta' | 'secondary' | 'ghost' | 'danger' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg'

/**
 * Primary action control for od-sąsiada.pl.
 *
 * `primary` is brand green; `cta` is the terracotta "Kup / Dodaj do koszyka"
 * action that adopts the per-tenant accent; `secondary`/`ghost` are quieter;
 * `danger` for destructive; `link` for inline text actions.
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. @default 'primary' */
  variant?: ButtonVariant
  /** Size / touch target. @default 'md' */
  size?: ButtonSize
  /** Stretch to container width (common on mobile). @default false */
  fullWidth?: boolean
  /** Render as a different element, e.g. 'a' for links. @default 'button' */
  as?: 'button' | 'a'
  /** Icon node placed before the label. */
  leadingIcon?: React.ReactNode
  /** Icon node placed after the label. */
  trailingIcon?: React.ReactNode
  children?: React.ReactNode
}

export declare function Button(props: ButtonProps): React.JSX.Element
