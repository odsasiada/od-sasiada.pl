import type { ComponentProps, ReactNode } from 'react'

import { useId } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/**
 * Labelled text input with optional hint and inline error — the default control
 * for every od-sąsiada.pl form (checkout, account, address book).
 */
export const Field = ({
  className,
  error,
  hint,
  id,
  label,
  optional = false,
  ...props
}: ComponentProps<'input'> & {
  error?: ReactNode
  hint?: ReactNode
  label?: ReactNode
  optional?: boolean
}) => {
  const reactId = useId()
  const fieldId = id ?? reactId
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined

  return (
    <div className={cn('mb-3 flex flex-col gap-1.5', className)}>
      {label ? (
        <Label className='text-text-muted' htmlFor={fieldId}>
          {label}
          {optional ? <span className='font-normal text-text-faint'> (opcjonalnie)</span> : null}
        </Label>
      ) : null}
      <Input aria-describedby={describedBy} aria-invalid={Boolean(error)} id={fieldId} {...props} />
      {error ? (
        <span className='text-xs text-[color:var(--state-error)]' id={`${fieldId}-error`}>
          {error}
        </span>
      ) : hint ? (
        <span className='text-xs text-text-faint' id={`${fieldId}-hint`}>
          {hint}
        </span>
      ) : null}
    </div>
  )
}
