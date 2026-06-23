import { describe, expect, it } from 'vitest'

import { computeAvailableSlots, type DateException, type DeliverySlot, type Weekday } from '@/lib/delivery-slots'

/**
 * SPIKE-S2 — pure cutoff/availability math for delivery slots (R-S2.1: timezone + DST).
 *
 * All reasoning is wall-clock Europe/Warsaw. Tests inject `now` as a UTC instant (Z) and rely
 * on the documented Warsaw offsets:
 *   - winter (CET):  UTC+1     - summer (CEST): UTC+2
 *   - spring forward 2026-03-29, fall back 2026-10-25
 *
 * Weekday convention: 0=Sun, 1=Mon, ... 6=Sat (JS getDay order).
 */

const MON: Weekday = 1
const SUN: Weekday = 0

// A roomy, well-formed Monday slot: deliver 08:00–12:00, cutoff 18:00 the day before.
const monSlot = (over: Partial<DeliverySlot> = {}): DeliverySlot => ({
  capacity: 5,
  cutoffDaysBefore: 1,
  cutoffTime: '18:00',
  id: 'mon-8-12',
  reservedCount: 0,
  weekday: MON,
  windowEnd: '12:00',
  windowStart: '08:00',
  ...over,
})

const NO_EXCEPTIONS: DateException[] = []

describe('computeAvailableSlots — feature-off (O8)', () => {
  it('returns [] when the tenant has no slots configured', () => {
    // Summer Monday 10:00 Warsaw.
    const now = new Date('2026-06-15T08:00:00Z')
    expect(computeAvailableSlots([], NO_EXCEPTIONS, now)).toEqual([])
  })
})

describe('computeAvailableSlots — ordinary week (Europe/Warsaw)', () => {
  it('offers the next matching weekday occurrence on a quiet summer day', () => {
    // Mon 15.06.2026 08:00 Warsaw (== 06:00Z, CEST). Cutoff for next Mon (22.06) is Sun 21.06 18:00 — far off.
    const now = new Date('2026-06-15T06:00:00Z')
    const out = computeAvailableSlots([monSlot()], NO_EXCEPTIONS, now)

    // Today's window (08:00) starts exactly at `now` -> excluded (startMin <= nowMinutes).
    // First available is next Monday 22.06; the 14-day horizon also reaches 29.06.
    expect(out.map((s) => s.date)).toEqual(['2026-06-22', '2026-06-29'])
    expect(out[0]).toMatchObject({
      date: '2026-06-22',
      remaining: 5,
      weekday: MON,
      windowStart: '08:00',
    })
  })

  it('still offers today’s window if now is before window start AND before cutoff', () => {
    // Use cutoff same-day so "today" can qualify: deliver Mon 08:00–12:00, cutoff 0 days before at 07:00.
    const slot = monSlot({ cutoffDaysBefore: 0, cutoffTime: '07:00' })
    // Mon 15.06 06:30 Warsaw (== 04:30Z CEST): before 07:00 cutoff and before 08:00 window.
    const now = new Date('2026-06-15T04:30:00Z')
    const out = computeAvailableSlots([slot], NO_EXCEPTIONS, now)
    expect(out[0]?.date).toBe('2026-06-15')
  })

  it('sorts occurrences by date then window start', () => {
    const early = monSlot({ id: 'a', windowEnd: '10:00', windowStart: '08:00' })
    const late = monSlot({ cutoffTime: '18:00', id: 'b', windowEnd: '16:00', windowStart: '14:00' })
    const now = new Date('2026-06-15T06:00:00Z')
    const out = computeAvailableSlots([late, early], NO_EXCEPTIONS, now)
    const firstDay = out.filter((s) => s.date === '2026-06-22')
    expect(firstDay.map((s) => s.id)).toEqual(['a', 'b'])
  })
})

describe('computeAvailableSlots — cutoff boundary (before / on / after)', () => {
  // Delivery Mon 22.06.2026; cutoff = Sun 21.06 18:00 Warsaw (summer CEST == 16:00Z).
  it('shows the slot one minute BEFORE cutoff', () => {
    const now = new Date('2026-06-21T15:59:00Z') // Sun 21.06 17:59 Warsaw
    const out = computeAvailableSlots([monSlot()], NO_EXCEPTIONS, now)
    expect(out.some((s) => s.date === '2026-06-22')).toBe(true)
  })

  it('hides the slot exactly AT cutoff (>= is closed)', () => {
    const now = new Date('2026-06-21T16:00:00Z') // Sun 21.06 18:00 Warsaw
    const out = computeAvailableSlots([monSlot()], NO_EXCEPTIONS, now)
    expect(out.some((s) => s.date === '2026-06-22')).toBe(false)
    // ... but the FOLLOWING Monday (29.06) is still open.
    expect(out.some((s) => s.date === '2026-06-29')).toBe(true)
  })

  it('hides a slot whose window already started today (past slot)', () => {
    const slot = monSlot({ cutoffDaysBefore: 0, cutoffTime: '23:59' })
    const now = new Date('2026-06-15T08:00:00Z') // Mon 15.06 10:00 Warsaw, after 08:00 window start
    const out = computeAvailableSlots([slot], NO_EXCEPTIONS, now)
    expect(out.some((s) => s.date === '2026-06-15')).toBe(false)
  })
})

describe('computeAvailableSlots — DST correctness (no hour drift, R-S2.1)', () => {
  // Spring forward: 2026-03-29. Delivery Mon 30.03; cutoff Sun 29.03 18:00 Warsaw (CEST == 16:00Z).
  it('spring: cutoff stays 18:00 Warsaw across the spring-forward switch', () => {
    const before = new Date('2026-03-29T15:59:00Z') // Sun 29.03 17:59 CEST -> open
    const after = new Date('2026-03-29T16:01:00Z') // Sun 29.03 18:01 CEST -> closed
    const beforeOut = computeAvailableSlots([monSlot()], NO_EXCEPTIONS, before)
    const afterOut = computeAvailableSlots([monSlot()], NO_EXCEPTIONS, after)
    expect(beforeOut.some((s) => s.date === '2026-03-30')).toBe(true)
    expect(afterOut.some((s) => s.date === '2026-03-30')).toBe(false)
  })

  // Fall back: 2026-10-25. Delivery Sun 25.10; cutoff Sat 24.10 18:00 Warsaw (still CEST == 16:00Z).
  it('autumn: cutoff stays 18:00 Warsaw across the fall-back switch', () => {
    const sundaySlot = monSlot({ id: 'sun', weekday: SUN })
    const before = new Date('2026-10-24T15:59:00Z') // Sat 24.10 17:59 CEST -> open
    const after = new Date('2026-10-24T16:01:00Z') // Sat 24.10 18:01 CEST -> closed
    const beforeOut = computeAvailableSlots([sundaySlot], NO_EXCEPTIONS, before)
    const afterOut = computeAvailableSlots([sundaySlot], NO_EXCEPTIONS, after)
    expect(beforeOut.some((s) => s.date === '2026-10-25')).toBe(true)
    expect(afterOut.some((s) => s.date === '2026-10-25')).toBe(false)
  })

  it('winter delivery day maps "tomorrow" correctly under CET (+1)', () => {
    // Mon 12.01.2026 08:00 Warsaw (== 07:00Z CET). Next Mon 19.01 must be offered.
    const now = new Date('2026-01-12T07:00:00Z')
    const out = computeAvailableSlots([monSlot()], NO_EXCEPTIONS, now)
    expect(out.some((s) => s.date === '2026-01-19')).toBe(true)
  })
})

describe('computeAvailableSlots — excluded dates (O7)', () => {
  it('drops occurrences that fall on an excluded date', () => {
    const now = new Date('2026-06-15T06:00:00Z') // Mon 15.06 08:00 Warsaw
    const exceptions: DateException[] = [{ date: '2026-06-22' }]
    const out = computeAvailableSlots([monSlot()], exceptions, now)
    expect(out.some((s) => s.date === '2026-06-22')).toBe(false)
    // The Monday after the excluded one is still offered.
    expect(out.some((s) => s.date === '2026-06-29')).toBe(true)
  })
})

describe('computeAvailableSlots — capacity (O4)', () => {
  it('hides a slot whose reservedCount has reached capacity (full)', () => {
    const now = new Date('2026-06-15T06:00:00Z')
    const full = monSlot({ capacity: 3, reservedCount: 3 })
    const out = computeAvailableSlots([full], NO_EXCEPTIONS, now)
    expect(out).toEqual([])
  })

  it('shows a slot with one seat left and reports remaining', () => {
    const now = new Date('2026-06-15T06:00:00Z')
    const nearlyFull = monSlot({ capacity: 3, reservedCount: 2 })
    const out = computeAvailableSlots([nearlyFull], NO_EXCEPTIONS, now)
    expect(out[0]?.remaining).toBe(1)
  })

  it('hides a slot configured with zero capacity', () => {
    const now = new Date('2026-06-15T06:00:00Z')
    const out = computeAvailableSlots([monSlot({ capacity: 0 })], NO_EXCEPTIONS, now)
    expect(out).toEqual([])
  })
})

describe('computeAvailableSlots — malformed/illogical slots are dropped', () => {
  it('drops a slot whose window end is not after its start', () => {
    const now = new Date('2026-06-15T06:00:00Z')
    const bad = monSlot({ windowEnd: '08:00', windowStart: '12:00' })
    expect(computeAvailableSlots([bad], NO_EXCEPTIONS, now)).toEqual([])
  })
})
