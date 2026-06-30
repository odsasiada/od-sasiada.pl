import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

/**
 * Styled native <select>. Kept native (not the Radix shadcn Select) so existing
 * form handlers (onChange/value) work unchanged across cart, account, address.
 */
export const Select = ({ className, ...props }: ComponentProps<'select'>) => (
  <select
    className={cn(
      'h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow]',
      'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    data-slot='select'
    {...props}
  />
)
