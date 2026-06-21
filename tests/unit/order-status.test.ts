import { describe, expect, it } from 'vitest'

import { isAllowedTransition, type OrderStatusValue } from '@/ecommerce/order-status'

/**
 * Order status state machine (S1.5) — pure logic, no DB.
 * Ports `src/spike-status-machine.ts`, asserting `isAllowedTransition` directly
 * (the spike drove this through `payload.update`, which calls the same predicate in
 * the `validateStatusTransition` beforeChange hook — see orders.integration.test.ts).
 *
 * Sequence: new → confirmed → preparing → out_for_delivery → delivered; cancelled is off-sequence.
 */
describe('order status machine — isAllowedTransition', () => {
  it('allows a no-op (same status)', () => {
    const all: OrderStatusValue[] = ['new', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled']
    for (const s of all) {
      expect(isAllowedTransition(s, s)).toBe(true)
    }
  })

  it('allows a single step forward', () => {
    expect(isAllowedTransition('new', 'confirmed')).toBe(true)
    expect(isAllowedTransition('confirmed', 'preparing')).toBe(true)
    expect(isAllowedTransition('preparing', 'out_for_delivery')).toBe(true)
    expect(isAllowedTransition('out_for_delivery', 'delivered')).toBe(true)
  })

  it('forbids skipping forward more than one step', () => {
    expect(isAllowedTransition('new', 'preparing')).toBe(false)
    expect(isAllowedTransition('confirmed', 'out_for_delivery')).toBe(false)
    expect(isAllowedTransition('new', 'delivered')).toBe(false)
  })

  it('allows rolling back any number of steps', () => {
    expect(isAllowedTransition('preparing', 'new')).toBe(true)
    expect(isAllowedTransition('delivered', 'new')).toBe(true)
    expect(isAllowedTransition('out_for_delivery', 'confirmed')).toBe(true)
    expect(isAllowedTransition('preparing', 'confirmed')).toBe(true)
  })

  it('allows cancelling from any non-delivered state, but not from delivered', () => {
    expect(isAllowedTransition('new', 'cancelled')).toBe(true)
    expect(isAllowedTransition('confirmed', 'cancelled')).toBe(true)
    expect(isAllowedTransition('preparing', 'cancelled')).toBe(true)
    expect(isAllowedTransition('out_for_delivery', 'cancelled')).toBe(true)
    expect(isAllowedTransition('delivered', 'cancelled')).toBe(false)
  })

  it('allows reactivating cancelled → new only', () => {
    expect(isAllowedTransition('cancelled', 'new')).toBe(true)
    expect(isAllowedTransition('cancelled', 'confirmed')).toBe(false)
    expect(isAllowedTransition('cancelled', 'preparing')).toBe(false)
    expect(isAllowedTransition('cancelled', 'delivered')).toBe(false)
  })
})
