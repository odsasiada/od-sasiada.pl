import type { HTMLAttributes, ReactNode } from 'react'

import { cva, type VariantProps } from 'class-variance-authority'

import { ORDER_STATUS_LABELS, type OrderStatusValue } from '@/ecommerce/order-status'
import { cn } from '@/lib/utils'

// Soft tonal fills (light bg + dark text) so signals read calm — incl. order statuses & "mało sztuk".
const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] font-semibold leading-none whitespace-nowrap',
  {
    defaultVariants: { size: 'md', tone: 'neutral' },
    variants: {
      size: {
        md: 'px-2.5 py-[5px] text-xs',
        sm: 'px-2 py-[3px] text-[length:var(--text-2xs)]',
      },
      tone: {
        accent: 'bg-[var(--terracotta-50)] text-[color:var(--terracotta-700)]',
        brand: 'bg-[var(--green-50)] text-[color:var(--green-700)]',
        error: 'bg-[var(--state-error-bg)] text-[color:var(--brick-700)]',
        neutral: 'bg-[var(--stone-200)] text-[color:var(--stone-800)]',
        success: 'bg-[var(--state-success-bg)] text-[color:var(--green-700)]',
        warning: 'bg-[var(--state-warning-bg)] text-[color:var(--amber-700)]',
      },
    },
  },
)

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>['tone']>

export const Badge = ({
  children,
  className,
  dot = false,
  size,
  tone,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants> & { dot?: boolean }) => (
  <span className={cn(badgeVariants({ size, tone }), className)} {...rest}>
    {dot ? <span aria-hidden='true' className='size-[7px] rounded-full bg-current opacity-90' /> : null}
    {children}
  </span>
)

// Tone per order status (labels come from the existing PL map in @/ecommerce/order-status).
const STATUS_TONE: Record<OrderStatusValue, BadgeTone> = {
  cancelled: 'error',
  confirmed: 'brand',
  delivered: 'success',
  new: 'neutral',
  out_for_delivery: 'accent',
  preparing: 'warning',
}

/** Renders an order status as a dotted tonal Badge with its Polish label. */
export const StatusBadge = ({ size, status }: { size?: 'md' | 'sm'; status: OrderStatusValue }): ReactNode => (
  <Badge dot size={size} tone={STATUS_TONE[status]}>
    {ORDER_STATUS_LABELS[status]}
  </Badge>
)
