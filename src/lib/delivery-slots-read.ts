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
    // reservedCount is unused here — we pass a per-occurrence `reservedFor` lookup instead (S2.7).
    reservedCount: 0,
    weekday: doc.weekday as Weekday,
    windowEnd: doc.windowEnd,
    windowStart: doc.windowStart,
  }))

  const exceptions: DateException[] = exceptionsRes.docs.map((doc) => ({ date: doc.date }))

  // S2.7: real reservedCount per occurrence (slot + date) from active orders — one source of
  // truth, no incremental counter. Display path only (no transaction); placeOrder is authoritative.
  const slotIds = slotsRes.docs.map((doc) => doc.id)
  const ordersRes = await payload.find({
    collection: 'orders',
    depth: 0,
    limit: 10_000,
    overrideAccess: true,
    where: { and: [{ 'deliverySlot.slot': { in: slotIds } }, { status: { not_in: ['cancelled'] } }] },
  })
  const reservedByOccurrence = new Map<string, number>()
  for (const order of ordersRes.docs) {
    const ds = order.deliverySlot
    const slotId = ds && (typeof ds.slot === 'object' ? ds.slot?.id : ds.slot)
    if (slotId && ds?.date) {
      const key = `${slotId}|${ds.date}`
      reservedByOccurrence.set(key, (reservedByOccurrence.get(key) ?? 0) + 1)
    }
  }
  const reservedFor = (slotId: DeliverySlot['id'], date: string) => reservedByOccurrence.get(`${slotId}|${date}`) ?? 0

  const slots = computeAvailableSlots(mapped, exceptions, new Date(), undefined, reservedFor)
  return { deliveryEnabled, slots }
}

/**
 * Server-side re-validation of a customer-chosen delivery slot (S2.3). The chosen `{ id, date }`
 * comes from the request body and is NOT trusted — we recompute the tenant's available slots on
 * a fresh server `now` (inside `getAvailableDelivery`) and confirm the choice is a member. This
 * reuses the SAME pure `computeAvailableSlots` as the read path (S2.2), so cutoff / past-day /
 * O7-excluded-date rules can never drift between what the UI offered and what checkout accepts.
 *
 * Out of scope (other stories): capacity/race enforcement (S2.7, `reservedCount` still 0).
 *
 * Returns the MATCHED `AvailableSlot` on success (S2.4): it carries `windowStart/windowEnd/date/
 * weekday`, which is the single source `placeOrder` uses to build the order's slot snapshot — so
 * the snapshot is never re-read from the DB (no race/drift; the validated set already has it).
 */
export const validateChosenSlot = async (
  tenantId: number,
  chosen?: { date: string; id: number | string },
): Promise<{ error: string; ok: false } | { ok: true; slot?: AvailableSlot }> => {
  const { deliveryEnabled, slots } = await getAvailableDelivery(tenantId)

  // O8 off: tenant has no windows → nothing to validate; ignore any passed slot (no snapshot).
  if (!deliveryEnabled) {
    return { ok: true }
  }

  // O8 on: a slot is required.
  if (!chosen) {
    return { error: 'Wybierz termin dostawy.', ok: false }
  }

  // Membership check covers cutoff/past/excluded-date/foreign-tenant/capacity<=0 in one go.
  // id may come back as string via the <select> value → compare as strings.
  const matched = slots.find((s) => String(s.id) === String(chosen.id) && s.date === chosen.date)
  if (!matched) {
    return { error: 'Wybrany termin dostawy jest już niedostępny. Odśwież koszyk i wybierz inny termin.', ok: false }
  }

  return { ok: true, slot: matched }
}
