// Pure delivery-slot availability math — the SINGLE SOURCE OF TRUTH for "which delivery
// slots can the customer still pick, given the wall-clock time in Poland". Imported by BOTH
// the checkout read path (slot list in `CartView`, S2.2) and the server validation path
// (`placeOrder` cutoff re-check, S2.3).
//
// HARD RULE: NO 'use server', NO `next/headers`, NO `@/lib/auth`, NO React, NO I/O here.
// This module is import-safe from server components and from 'use server' action files alike
// (see [[use-server-turbopack-gotcha]] / R-S2.5). It NEVER calls `Date.now()` — the caller
// injects `now`, which makes the timezone/DST behaviour fully testable.
//
// TIMEZONE: all wall-clock reasoning is done in Europe/Warsaw via `Intl.DateTimeFormat`
// (NO date library — see SPIKE-S2 decision note). The trick that makes DST correct for free
// is that we never do millisecond offset arithmetic; we read the *calendar fields* of `now`
// in the Warsaw zone and compare them against the slot's wall-clock schedule. The OS/Intl
// tz database resolves the spring-forward / fall-back hour, so a cutoff at "18:00 Warsaw"
// stays 18:00 Warsaw on both sides of a DST switch.

/**
 * Day of week, 0 = Sunday .. 6 = Saturday (matches JS `Date.getDay()` / `Intl` weekday order).
 * Stored as an integer on the slot (see decision note: enum-of-numbers, not a string).
 */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

/**
 * A recurring weekly delivery window for one tenant. Hours are wall-clock "HH:mm" strings in
 * Europe/Warsaw. The pure function does NOT read the DB — `reservedCount` is supplied by the
 * caller (recomputed from active orders; see decision note on counter consistency).
 */
export type DeliverySlot = {
  /** Recurring weekday this window repeats on. */
  weekday: Weekday
  /** Window start, wall-clock "HH:mm" in Europe/Warsaw (e.g. "08:00"). */
  windowStart: string
  /** Window end, wall-clock "HH:mm" in Europe/Warsaw (e.g. "12:00"); must be > windowStart. */
  windowEnd: string
  /**
   * Cutoff expressed as: how many calendar days BEFORE the delivery day the order must be in,
   * and at what wall-clock time on that earlier day. O2 "order for tomorrow by 18:00 today"
   * is `{ cutoffDaysBefore: 1, cutoffTime: "18:00" }`. Same-day-by-time is `cutoffDaysBefore: 0`.
   */
  cutoffDaysBefore: number
  cutoffTime: string
  /** Max active (non-cancelled) orders for one occurrence of this slot. Integer >= 0. */
  capacity: number
  /** Active-order count for the resolved occurrence, supplied by the caller (DB-derived). */
  reservedCount: number
  /** Stable id used to identify/select the slot downstream. */
  id: number | string
}

/**
 * A date the tenant has marked unavailable (O7), overriding the recurring schedule.
 * `date` is a calendar day in Europe/Warsaw as "YYYY-MM-DD" (no time component).
 */
export type DateException = {
  date: string
}

/**
 * One concrete, bookable occurrence of a recurring slot on a specific calendar date.
 * This is what the UI renders and what `placeOrder` re-validates against.
 */
export type AvailableSlot = {
  id: number | string
  /** The concrete delivery day in Europe/Warsaw, "YYYY-MM-DD". */
  date: string
  weekday: Weekday
  windowStart: string
  windowEnd: string
  /** Remaining seats = capacity - reservedCount (always > 0 for an available slot). */
  remaining: number
}

/** How many future days the recurring schedule is projected forward into concrete occurrences. */
const DEFAULT_HORIZON_DAYS = 14

/** Intl formatter that yields the calendar fields of an instant in Europe/Warsaw. */
const warsawParts = (
  instant: Date,
): { year: number; month: number; day: number; weekday: Weekday; minutes: number } => {
  const fmt = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    month: '2-digit',
    timeZone: 'Europe/Warsaw',
    weekday: 'short',
    year: 'numeric',
  })
  const parts = Object.fromEntries(fmt.formatToParts(instant).map((p) => [p.type, p.value]))
  const weekdayMap: Record<string, Weekday> = {
    Fri: 5,
    Mon: 1,
    Sat: 6,
    Sun: 0,
    Thu: 4,
    Tue: 2,
    Wed: 3,
  }
  const hour = Number(parts.hour)
  return {
    day: Number(parts.day),
    minutes: hour * 60 + Number(parts.minute),
    month: Number(parts.month),
    weekday: weekdayMap[parts.weekday as string],
    year: Number(parts.year),
  }
}

/** "HH:mm" -> minutes since local midnight. Returns NaN for malformed input. */
const minutesOfHHmm = (hhmm: string): number => {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm)
  if (!m) {
    return NaN
  }
  return Number(m[1]) * 60 + Number(m[2])
}

/** "YYYY-MM-DD" for a {year,month,day} triple. */
const ymd = (year: number, month: number, day: number): string =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

/** Days since the Unix epoch for a proleptic-Gregorian calendar date (timezone-agnostic). */
const dayNumber = (year: number, month: number, day: number): number =>
  Math.floor(Date.UTC(year, month - 1, day) / 86_400_000)

/** Inverse of dayNumber: an epoch-day index back to {year,month,day,weekday}. */
const fromDayNumber = (n: number): { year: number; month: number; day: number; weekday: Weekday } => {
  const d = new Date(n * 86_400_000)
  return {
    day: d.getUTCDate(),
    month: d.getUTCMonth() + 1,
    // getUTCDay on a midnight-UTC instant gives the calendar weekday correctly.
    weekday: d.getUTCDay() as Weekday,
    year: d.getUTCFullYear(),
  }
}

/**
 * Computes the concrete, bookable delivery occurrences from a tenant's recurring slots.
 *
 * Excludes any occurrence that is:
 *   - on an excluded date (O7),
 *   - in the past or whose window has already started (the window-start moment is <= now),
 *   - past its cutoff (cutoffDaysBefore / cutoffTime, measured in Europe/Warsaw),
 *   - full (reservedCount >= capacity, O4) — or capacity <= 0.
 *
 * Deterministic in `now` (no Date.now()). Returns occurrences sorted by date then window start.
 * An empty `slots` array yields `[]` — the "feature off for this tenant" case (O8).
 */
export const computeAvailableSlots = (
  slots: DeliverySlot[],
  exceptions: DateException[],
  now: Date,
  horizonDays: number = DEFAULT_HORIZON_DAYS,
  /**
   * Reserved-order count PER OCCURRENCE (slot + date), supplied by the caller from active orders
   * (S2.7). When omitted, falls back to the slot-level `reservedCount` (backwards compatible with
   * the S2.2 read path and the existing unit tests). Capacity (O4) is per occurrence, so two
   * different dates of the same recurring slot each get their own seat budget.
   */
  reservedFor?: (slotId: DeliverySlot['id'], date: string) => number,
): AvailableSlot[] => {
  if (!slots.length) {
    return []
  }

  const nowParts = warsawParts(now)
  const nowDayNum = dayNumber(nowParts.year, nowParts.month, nowParts.day)
  const nowMinutes = nowParts.minutes
  const excluded = new Set(exceptions.map((e) => e.date))

  const result: AvailableSlot[] = []

  // Walk every candidate delivery day from today (inclusive) to the horizon.
  for (let offset = 0; offset <= horizonDays; offset++) {
    const dayNum = nowDayNum + offset
    const cal = fromDayNumber(dayNum)
    const dateStr = ymd(cal.year, cal.month, cal.day)

    if (excluded.has(dateStr)) {
      continue
    }

    for (const slot of slots) {
      if (slot.weekday !== cal.weekday) {
        continue
      }

      const startMin = minutesOfHHmm(slot.windowStart)
      const endMin = minutesOfHHmm(slot.windowEnd)
      const cutoffMin = minutesOfHHmm(slot.cutoffTime)
      if (Number.isNaN(startMin) || Number.isNaN(endMin) || Number.isNaN(cutoffMin) || endMin <= startMin) {
        continue // malformed/illogical slot — drop it (S2.1 validates these at write time)
      }

      // Capacity (O4): full or non-positive capacity -> unavailable. Reserved count is per
      // occurrence (slot + date) when the caller supplies `reservedFor`; else slot-level fallback.
      const capacity = Math.floor(slot.capacity)
      const reserved = Math.floor(reservedFor ? reservedFor(slot.id, dateStr) : slot.reservedCount)
      const remaining = capacity - reserved
      if (!Number.isFinite(remaining) || remaining <= 0) {
        continue
      }

      // Window must not have started yet on the delivery day (no past/in-progress slots).
      // Compare day-by-day in the Warsaw calendar so DST never shifts the comparison.
      if (dayNum < nowDayNum || (dayNum === nowDayNum && startMin <= nowMinutes)) {
        continue
      }

      // Cutoff: the order must be placed by `cutoffTime` on the day `cutoffDaysBefore`
      // calendar days before the delivery day (Europe/Warsaw wall clock).
      const cutoffDayNum = dayNum - Math.max(0, Math.floor(slot.cutoffDaysBefore))
      const cutoffPassed = nowDayNum > cutoffDayNum || (nowDayNum === cutoffDayNum && nowMinutes >= cutoffMin)
      if (cutoffPassed) {
        continue
      }

      result.push({
        date: dateStr,
        id: slot.id,
        remaining,
        weekday: slot.weekday,
        windowEnd: slot.windowEnd,
        windowStart: slot.windowStart,
      })
    }
  }

  result.sort((a, b) =>
    a.date === b.date ? minutesOfHHmm(a.windowStart) - minutesOfHHmm(b.windowStart) : a.date < b.date ? -1 : 1,
  )

  return result
}
