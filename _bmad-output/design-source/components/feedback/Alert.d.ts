import * as React from 'react'

/** Inline tonal message block for checkout & account flows. */
export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  /** @default 'info' */
  tone?: 'success' | 'warning' | 'error' | 'info'
  /** Bold first line. */
  title?: React.ReactNode
  /** Show the leading icon. @default true */
  icon?: boolean
  children?: React.ReactNode
}

export declare function Alert(props: AlertProps): React.JSX.Element
