import type { Payload, Where } from 'payload'

/**
 * S2.7 — capacity is counted from active orders (one source of truth, no incremental counter),
 * keyed per OCCURRENCE: slot + date. `cancelled` orders are excluded, so a cancellation frees the
 * seat for free. This `where` and the recount below are shared by every capacity site (the
 * `placeOrder` reservation, the read-path display count, and the reactivation hook) so the rule
 * can never drift between them.
 */
const activeOrdersForOccurrence = (slotId: number | string, date: string): Where => ({
  and: [
    { 'deliverySlot.slot': { equals: slotId } },
    { 'deliverySlot.date': { equals: date } },
    { status: { not_in: ['cancelled'] } },
  ],
})

/** The booked occurrence (slot id + date) of an order, or null if it has no delivery slot (O8). */
export const occurrenceOf = (order: {
  deliverySlot?: { date?: null | string; slot?: null | number | { id: number } } | null
}): null | { date: string; slotId: number } => {
  const ds = order.deliverySlot
  const slotId = ds && (typeof ds.slot === 'object' ? ds.slot?.id : ds.slot)
  return slotId && ds?.date ? { date: ds.date, slotId } : null
}

/** Count of active (non-cancelled) orders booking a single occurrence. Pass `req` to stay in a tx. */
export const countActiveOrdersForOccurrence = async (
  payload: Payload,
  slotId: number | string,
  date: string,
  req?: { transactionID: number | string },
): Promise<number> => {
  const { totalDocs } = await payload.count({
    collection: 'orders',
    overrideAccess: true,
    ...(req ? { req } : {}),
    where: activeOrdersForOccurrence(slotId, date),
  })
  return totalDocs
}
