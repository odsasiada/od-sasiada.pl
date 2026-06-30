import * as React from 'react'

/**
 * Labelled native <select> styled to match Field. Use for product variants
 * ("Porcja"), saved addresses, and delivery slots.
 */
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Visible label above the control. */
  label?: React.ReactNode
  children?: React.ReactNode
}

export declare function Select(props: SelectProps): React.JSX.Element
