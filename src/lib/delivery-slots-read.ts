import { getPayload } from 'payload'

import {
  type AvailableSlot,
  computeAvailableSlots,
  type DateException,
  type DeliverySlot,
  type Weekday,
} from '@/lib/delivery-slots'
import config from '@/payload.config'

/**
 * Server-component reader for a tenant's available delivery occurrences (S2.2). Plain server
 * util (NOT 'use server') — used by the cart page (server component) so we never pull a
 * 'use server' module into the client boundary (see memory `use-server-turbopack-gotcha`).
 *
 * NFR1 (tenant isolation): the multi-tenant plugin does NOT scope public/overrideAccess reads,
 * so both `find`s use `overrideAccess: true` WITH a manual `where { tenant }`. Missing that
 * filter would leak another tenant's slots/exceptions.
 *
 * The availability math lives entirely in the pure `computeAvailableSlots` (cutoff, past, O7
 * excluded dates, O4 capacity, DST) — we only read, map, and inject `now`. `reservedCount` is
 * `0` here on purpose: orders don't carry a `deliverySlot` relation yet (S2.4), so the real
 * recount + capacity enforcement is S2.7. With `reservedCount: 0`, capacity only excludes slots
 * configured with `capacity <= 0`.
 */
export const getAvailableDelivery = async (
  tenantId: number,
): Promise<{ deliveryEnabled: boolean; slots: AvailableSlot[] }> => {
  const payload = await getPayload({ config })

  const slotsRes = await payload.find({
    collection: 'delivery-slots',
    depth: 0,
    limit: 500,
    overrideAccess: true,
    where: { tenant: { equals: tenantId } },
  })

  const deliveryEnabled = slotsRes.totalDocs > 0
  if (!deliveryEnabled) {
    return { deliveryEnabled: false, slots: [] }
  }

  const exceptionsRes = await payload.find({
    collection: 'delivery-date-exceptions',
    depth: 0,
    limit: 500,
    overrideAccess: true,
    where: { tenant: { equals: tenantId } },
  })

  const mapped: DeliverySlot[] = slotsRes.docs.map((doc) => ({
    capacity: doc.capacity ?? 0,
    cutoffDaysBefore: doc.cutoffDaysBefore,
    cutoffTime: doc.cutoffTime,
    id: doc.id,
    // reservedCount is the caller's input — real recount from orders is S2.7.
    reservedCount: 0,
    weekday: doc.weekday as Weekday,
    windowEnd: doc.windowEnd,
    windowStart: doc.windowStart,
  }))

  const exceptions: DateException[] = exceptionsRes.docs.map((doc) => ({ date: doc.date }))

  const slots = computeAvailableSlots(mapped, exceptions, new Date())
  return { deliveryEnabled, slots }
}
