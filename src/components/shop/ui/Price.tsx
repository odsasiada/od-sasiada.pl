import type { HTMLAttributes } from 'react'

import { formatPLN } from '@/lib/money'
import { cn } from '@/lib/utils'

type PriceSize = 'lg' | 'md' | 'sm'

const SIZE: Record<PriceSize, string> = {
  lg: 'text-[length:var(--text-price-lg)]',
  md: 'text-[length:var(--text-price-md)]',
  sm: 'text-[length:var(--text-price-sm)]',
}

/**
 * Trust-critical price. Formats grosze → "40,00 zł" with tabular lining numerals.
 * Reuses formatPLN from @/lib/money (single source of truth). `seasonal`/null → "Cena sezonowa".
 */
export const Price = ({
  className,
  seasonal = false,
  size = 'md',
  unit,
  value,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & {
  seasonal?: boolean
  size?: PriceSize
  unit?: string
  value?: null | number
}) => {
  if (seasonal || value == null) {
    return (
      <span className={cn('text-base font-semibold text-text-muted italic', className)} {...rest}>
        Cena sezonowa
      </span>
    )
  }
  return (
    <span
      className={cn(
        'inline-flex items-baseline gap-1.5 font-bold whitespace-nowrap text-[color:var(--text-price)] tabular-nums lining-nums',
        SIZE[size],
        className,
      )}
      {...rest}
    >
      {formatPLN(value)}
      {unit ? <span className='text-sm font-medium text-text-muted'>/ {unit}</span> : null}
    </span>
  )
}
