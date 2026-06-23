import type { Payload } from 'payload'
import type { TenantFixtures } from './fixtures'

/**
 * Shared delivery-slot test scaffolding for EPIC-2 suites (S2.2 read path, S2.3 validation, and
 * future S2.4/S2.7). Builds, on top of the two-tenant `TenantFixtures`:
 *   - tenant A: one slot per weekday (0–6) with same-day cutoff at 23:59 → guaranteed available
 *     occurrences within the 14-day horizon regardless of the wall-clock `now`,
 *   - tenant B: a single slot (to prove A never sees it),
 *   - a throwaway tenant with NO slots (the O8 feature-off case).
 *
 * Everything is created with `overrideAccess` and torn down by `cleanup()` (call it before
 * `TenantFixtures.cleanup()` so slots/exceptions are removed before their tenant).
 */
export type DeliveryFixtures = {
  /** Slot ids belonging to tenant A. */
  aSlotIds: Set<number>
  /** The single slot id belonging to tenant B. */
  bSlotId: number
  /** Removes every slot/exception/throwaway-tenant created here (best-effort). */
  cleanup: () => Promise<void>
  /** Id of the throwaway tenant that has no slots (O8 off). */
  tenantNoSlotsId: number
  /** Register an exception id created by a test so cleanup deletes it first. */
  trackException: (id: number) => void
}

export const createDeliveryFixtures = async (payload: Payload, fx: TenantFixtures): Promise<DeliveryFixtures> => {
  const slotIds: number[] = []
  const exceptionIds: number[] = []
  const aSlotIds = new Set<number>()

  const makeSlot = async (tenantId: number, weekday: number): Promise<number> => {
    const slot = await payload.create({
      collection: 'delivery-slots',
      data: {
        capacity: 10,
        cutoffDaysBefore: 0,
        cutoffTime: '23:59',
        tenant: tenantId,
        weekday,
        windowEnd: '12:00',
        windowStart: '08:00',
      } as never,
      overrideAccess: true,
    })
    slotIds.push(slot.id)
    return slot.id
  }

  for (let weekday = 0; weekday <= 6; weekday++) {
    aSlotIds.add(await makeSlot(fx.tenantA.id, weekday))
  }
  const bSlotId = await makeSlot(fx.tenantB.id, 3)

  const stamp = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`
  const tenantNoSlots = await payload.create({
    collection: 'tenants',
    data: { name: `Test NoSlots ${stamp}`, settings: { isActive: true }, slug: `test-noslots-${stamp}` },
    overrideAccess: true,
  })

  const cleanup = async () => {
    for (const id of [...exceptionIds].reverse()) {
      try {
        await payload.delete({ collection: 'delivery-date-exceptions', id, overrideAccess: true })
      } catch {
        /* best-effort */
      }
    }
    for (const id of [...slotIds].reverse()) {
      try {
        await payload.delete({ collection: 'delivery-slots', id, overrideAccess: true })
      } catch {
        /* best-effort */
      }
    }
    try {
      await payload.delete({ collection: 'tenants', id: tenantNoSlots.id, overrideAccess: true })
    } catch {
      /* best-effort */
    }
  }

  return {
    aSlotIds,
    bSlotId,
    cleanup,
    tenantNoSlotsId: tenantNoSlots.id,
    trackException: (id) => exceptionIds.push(id),
  }
}
