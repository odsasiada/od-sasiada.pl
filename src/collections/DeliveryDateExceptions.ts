import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access'

/**
 * EPIC-2 (SPIKE-S2 (b) / S2.8): per-tenant unavailable delivery dates (O7).
 *
 * A single exception marks a WHOLE calendar day unavailable for the tenant ("24 grudnia nie
 * dowozimy" hides every window that day) — which is why it lives in its own collection rather
 * than as an array field on `DeliverySlots`. The pure `computeAvailableSlots` already consumes
 * these as a flat `DateException[]` → `Set<string>` and excludes matching days (tested:
 * "excluded dates (O7)" in tests/unit/delivery-slots.test.ts). This story is the DATA layer
 * only — no exclusion logic here. The storefront read path (`getAvailableDelivery`, S2.2) maps
 * documents 1:1 onto `DateException`.
 *
 * Date is stored as a "YYYY-MM-DD" TEXT (Europe/Warsaw wall-clock day), NOT a Payload `date`
 * field: a `date` field persists a full ISO timestamp, and converting that back to a Warsaw
 * calendar day needs timezone math that risks an off-by-one at midnight/DST — exactly the trap
 * SPIKE-S2 avoids by keeping wall-clock values as strings. `computeAvailableSlots` compares a
 * `Set<YYYY-MM-DD>` against the candidate day string, so `text` maps with zero conversion.
 *
 * Tenant isolation comes from `multiTenantPlugin.collections` (stamps `tenant`, scopes panel
 * rows); `access` is panel-only and no tenant-scoped `access` is needed (SPIKE-A).
 */

/** Calendar day "YYYY-MM-DD". */
const YMD = /^(\d{4})-(\d{2})-(\d{2})$/

/** True only for a real calendar date (rejects 2026-13-40, 2026-02-30, …). */
const isRealCalendarDate = (value: string): boolean => {
  const m = YMD.exec(value)
  if (!m) {
    return false
  }
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const d = new Date(Date.UTC(year, month - 1, day))
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day
}

export const DeliveryDateExceptions: CollectionConfig = {
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },

  admin: {
    defaultColumns: ['date', 'note'],
    group: 'Shop',
    useAsTitle: 'date',
  },

  fields: [
    {
      admin: { description: 'Dzień niedostępny — wszystkie sloty tego dnia zostaną ukryte (strefa Europe/Warsaw).' },
      label: 'Data (RRRR-MM-DD)',
      name: 'date',
      required: true,
      type: 'text',
      validate: (value: unknown): string | true =>
        (typeof value === 'string' && isRealCalendarDate(value)) ||
        'Podaj poprawną datę w formacie RRRR-MM-DD (np. 2026-12-24).',
    },
    {
      admin: { description: 'Opcjonalny powód (np. „Boże Narodzenie") — tylko informacyjnie.' },
      label: 'Powód',
      name: 'note',
      type: 'text',
    },
  ],

  labels: {
    plural: 'Wyłączone daty dostaw',
    singular: 'Wyłączona data dostawy',
  },

  slug: 'delivery-date-exceptions',
}
