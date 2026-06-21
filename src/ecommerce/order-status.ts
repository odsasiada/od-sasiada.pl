import type { Field } from 'payload'

/**
 * Order state machine for fresh food delivery — linear with rollback.
 *
 * Sequence: new → confirmed → preparing → out_for_delivery → delivered
 * `cancelled` is outside the sequence (cancellation from any state except delivered).
 *
 * Allowed transitions:
 *  - no change (no-op),
 *  - one step forward,
 *  - rollback any number of steps,
 *  - cancel from any state except `delivered`,
 *  - reactivate `cancelled → new`.
 */

const ORDER_STATUS_SEQUENCE = ['new', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'] as const

export type OrderStatusValue = (typeof ORDER_STATUS_SEQUENCE)[number] | 'cancelled'

export const ORDER_STATUS_LABELS: Record<OrderStatusValue, string> = {
  cancelled: 'Cancelled',
  confirmed: 'Confirmed',
  delivered: 'Delivered',
  new: 'New',
  out_for_delivery: 'Out for delivery',
  preparing: 'Preparing',
}

const orderStatusOptions: { label: string; value: OrderStatusValue }[] = (
  Object.keys(ORDER_STATUS_LABELS) as OrderStatusValue[]
)
  .sort((a, b) => {
    const ia = a === 'cancelled' ? 99 : ORDER_STATUS_SEQUENCE.indexOf(a)
    const ib = b === 'cancelled' ? 99 : ORDER_STATUS_SEQUENCE.indexOf(b)
    return ia - ib
  })
  .map((value) => ({ label: ORDER_STATUS_LABELS[value], value }))

/** Whether the `from → to` transition is allowed in the state machine. */
export const isAllowedTransition = (from: OrderStatusValue, to: OrderStatusValue): boolean => {
  if (from === to) {
    return true
  }
  if (to === 'cancelled') {
    return from !== 'delivered'
  }
  if (from === 'cancelled') {
    return to === 'new' // reactivate
  }
  const fromIdx = ORDER_STATUS_SEQUENCE.indexOf(from as (typeof ORDER_STATUS_SEQUENCE)[number])
  const toIdx = ORDER_STATUS_SEQUENCE.indexOf(to as (typeof ORDER_STATUS_SEQUENCE)[number])
  if (fromIdx === -1 || toIdx === -1) {
    return false
  }
  // one step forward or rollback any number of steps
  return toIdx === fromIdx + 1 || toIdx < fromIdx
}

/** `status` field with our values (overrides the plugin field). */
export const orderStatusField: Field = {
  admin: { position: 'sidebar' },
  defaultValue: 'new',
  label: 'Status',
  name: 'status',
  options: orderStatusOptions,
  required: true,
  type: 'select',
}
