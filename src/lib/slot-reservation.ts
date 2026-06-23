import type { Payload } from 'payload'

import { sql } from '@payloadcms/db-postgres'

import { countActiveOrdersForOccurrence } from '@/lib/slot-capacity'

/**
 * S2.7 — race-safe capacity reservation. Creates an order that books a delivery occurrence
 * (slot + date) inside a SINGLE Payload transaction, serialized against concurrent reservations
 * of the SAME occurrence by a per-occurrence Postgres advisory lock.
 *
 * Why this is its own plain server util (no 'use server', no next/headers): `placeOrder` resolves
 * the customer via `next/headers` and then delegates here, while integration tests call this
 * directly with fixture customers — that's the only way to prove the anti-overbooking gate (AC#2)
 * without a Next request context.
 *
 * Reservation model (SPIKE-S2): the count is ALWAYS recomputed from active orders (one source of
 * truth, no incremental counter, no drift). `cancelled` orders are excluded → a cancellation frees
 * the seat for free. Capacity is per OCCURRENCE (slot + date), not per recurring slot.
 */

/**
 * The delivery occurrence being booked. `slot` + `date` drive the per-occurrence capacity recount
 * and advisory lock; the optional presentational fields (`windowStart/windowEnd/label`, S2.4) are
 * snapshotted onto the order verbatim from the validated `AvailableSlot` — a COPY at create time,
 * immune to later config changes (B1). All of it lands in the order's `deliverySlot` group.
 */
type DeliveryOccurrence = {
  date: string
  id: number | string
  label?: string
  windowEnd?: string
  windowStart?: string
}

type AdapterWithSessions = {
  sessions: Record<string, { db: { execute: (query: unknown) => Promise<unknown> } }>
}

/** The order's `deliverySlot` group value built from the booked occurrence (snapshot, S2.4). */
const deliverySlotSnapshot = (occurrence: DeliveryOccurrence) => ({
  date: occurrence.date,
  label: occurrence.label,
  slot: Number(occurrence.id),
  windowEnd: occurrence.windowEnd,
  windowStart: occurrence.windowStart,
})

export const reserveSlotAndCreateOrder = async (
  payload: Payload,
  orderData: Record<string, unknown>,
  occurrence: DeliveryOccurrence,
): Promise<{ error: string; ok: false } | { ok: true; order: { id: number; orderNumber?: string } }> => {
  const transactionID = await payload.db.beginTransaction()

  // Postgres adapter always supports transactions; null would mean an adapter that doesn't.
  if (transactionID == null) {
    payload.logger.warn('reserveSlotAndCreateOrder: no transaction support — capacity check is NOT race-safe')
    const order = await payload.create({
      collection: 'orders',
      data: { ...orderData, deliverySlot: deliverySlotSnapshot(occurrence) } as never,
    })
    return { ok: true, order: order as { id: number; orderNumber?: string } }
  }

  try {
    // Serialize concurrent reservations of the SAME occurrence. The lock is held until the
    // transaction commits/rolls back, so the recount→create below is atomic per (slot|date).
    // hashtext() returns int4, which widens to the bigint advisory-lock key.
    const session = (payload.db as unknown as AdapterWithSessions).sessions[transactionID]
    await session.db.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`${occurrence.id}|${occurrence.date}`}))`)

    const slot = await payload.findByID({
      collection: 'delivery-slots',
      depth: 0,
      disableErrors: true,
      id: Number(occurrence.id),
      overrideAccess: true,
      req: { transactionID },
    })
    const capacity = typeof slot?.capacity === 'number' ? slot.capacity : 0

    const reserved = await countActiveOrdersForOccurrence(payload, occurrence.id, occurrence.date, { transactionID })

    if (reserved >= capacity) {
      await payload.db.rollbackTransaction(transactionID)
      return { error: 'Wybrany termin właśnie się zapełnił. Wybierz inny.', ok: false }
    }

    const order = await payload.create({
      collection: 'orders',
      data: { ...orderData, deliverySlot: deliverySlotSnapshot(occurrence) } as never,
      req: { transactionID },
    })

    await payload.db.commitTransaction(transactionID)
    return { ok: true, order: order as { id: number; orderNumber?: string } }
  } catch (err) {
    await payload.db.rollbackTransaction(transactionID)
    throw err
  }
}
