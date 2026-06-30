import * as React from 'react'

/**
 * Labelled text input with optional hint and inline error. The default control
 * for every od-sąsiada.pl form (checkout, account, address book).
 */
export interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Visible label above the control. */
  label?: React.ReactNode
  /** Helper text shown below when there is no error. */
  hint?: React.ReactNode
  /** Error message — switches the field to its invalid (brick) state. */
  error?: React.ReactNode
  /** Appends a muted "(opcjonalnie)" note to the label. @default false */
  optional?: boolean
}

export declare function Field(props: FieldProps): React.JSX.Element
