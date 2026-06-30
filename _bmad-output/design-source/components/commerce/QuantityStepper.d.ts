import * as React from 'react'

/** −/value/+ quantity control (cart, product card). 44px targets. */
export interface QuantityStepperProps {
  value: number
  onChange?: (next: number) => void
  /** @default 1 */
  min?: number
  /** @default 99 */
  max?: number
  /** @default 'md' */
  size?: 'sm' | 'md'
  className?: string
}

export declare function QuantityStepper(props: QuantityStepperProps): React.JSX.Element
