import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access'

/**
 * EPIC-2 (SPIKE-S2 / S2.1): per-tenant recurring delivery windows.
 *
 * This collection is the WRITE-side config store only — it holds the recurring weekly
 * schedule (weekday + window + cutoff + capacity). The availability math lives in the pure
 * module `@/lib/delivery-slots` (`computeAvailableSlots`); occupancy (`reservedCount`) is
 * derived from active `orders` at read/validation time (S2.7), NOT stored here — so there is
 * a single source of truth and no counter drift.
 *
 * Field shape mirrors the `DeliverySlot` type in `@/lib/delivery-slots.ts` 1:1 (locked by
 * SPIKE-S2): `weekday` is a number 0–6 (NOT a string/select — the pure function compares it
 * directly against `Intl`/`getUTCDay`, zero mapping in the hot path); hours are wall-clock
 * "HH:mm" strings in Europe/Warsaw; cutoff is expressed as (cutoffDaysBefore, cutoffTime).
 *
 * Tenant isolation: `delivery-slots` is wired into `multiTenantPlugin.collections` in
 * payload.config.ts, which stamps a `tenant` field and scopes panel rows to the admin's
 * tenant (platform-admin sees all). `access` below is panel-only (collection `users`); a
 * dedicated tenant-scoped `access` is unnecessary (confirmed by SPIKE-A — the plugin guards
 * writes). The storefront read path (S2.2) goes through `overrideAccess: true` + a manual
 * `where { tenant }`.
 */

/** Wall-clock "HH:mm" with a valid range (00–23:00–59). Stricter than the pure function's guard. */
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/

/** "HH:mm" -> minutes since midnight (assumes the regex already passed). */
const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':')
  return Number(h) * 60 + Number(m)
}

const validateHHmm = (value: unknown): string | true =>
  (typeof value === 'string' && HHMM.test(value)) || 'Podaj godzinę w formacie GG:MM (np. 08:00).'

const validateNonNegativeInt = (value: unknown): string | true =>
  (typeof value === 'number' && Number.isInteger(value) && value >= 0) || 'Podaj liczbę całkowitą nie mniejszą niż 0.'

export const DeliverySlots: CollectionConfig = {
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },

  admin: {
    defaultColumns: ['weekday', 'windowStart', 'windowEnd', 'capacity'],
    group: 'Shop',
    // No natural title field (just numbers/HH:mm); window start is the simplest readable handle.
    useAsTitle: 'windowStart',
  },

  fields: [
    {
      admin: { description: '0 = niedziela, 1 = poniedziałek, 2 = wtorek … 6 = sobota.' },
      label: 'Dzień tygodnia',
      max: 6,
      min: 0,
      name: 'weekday',
      required: true,
      type: 'number',
      validate: (value: unknown): string | true =>
        (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 6) ||
        'Dzień tygodnia musi być liczbą całkowitą od 0 (niedziela) do 6 (sobota).',
    },
    {
      admin: { description: 'Początek okna dostawy, czas lokalny (Europe/Warsaw), format GG:MM.' },
      label: 'Początek okna',
      name: 'windowStart',
      required: true,
      type: 'text',
      validate: validateHHmm,
    },
    {
      admin: { description: 'Koniec okna dostawy (musi być późniejszy niż początek), format GG:MM.' },
      label: 'Koniec okna',
      name: 'windowEnd',
      required: true,
      type: 'text',
      validate: (value: unknown, { siblingData }: { siblingData: Partial<{ windowStart: string }> }): string | true => {
        if (typeof value !== 'string' || !HHMM.test(value)) {
          return 'Podaj godzinę w formacie GG:MM (np. 12:00).'
        }
        const start = siblingData?.windowStart
        if (typeof start === 'string' && HHMM.test(start) && toMinutes(value) <= toMinutes(start)) {
          return 'Koniec okna musi być późniejszy niż początek.'
        }
        return true
      },
    },
    {
      admin: { description: 'Ile dni kalendarzowych przed dniem dostawy. „Na jutro" = 1, tego samego dnia = 0.' },
      label: 'Cutoff — dni wcześniej',
      min: 0,
      name: 'cutoffDaysBefore',
      required: true,
      type: 'number',
      validate: validateNonNegativeInt,
    },
    {
      admin: {
        description:
          'Godzina graniczna zamówień (Europe/Warsaw) na dniu „dzień dostawy − dni wcześniej", format GG:MM.',
      },
      label: 'Cutoff — godzina',
      name: 'cutoffTime',
      required: true,
      type: 'text',
      validate: validateHHmm,
    },
    {
      admin: { description: 'Limit aktywnych zamówień na jedno wystąpienie slotu (liczba całkowita ≥ 0).' },
      label: 'Limit miejsc',
      min: 0,
      name: 'capacity',
      required: true,
      type: 'number',
      validate: validateNonNegativeInt,
    },
  ],

  labels: {
    plural: 'Okna dostawy',
    singular: 'Okno dostawy',
  },

  slug: 'delivery-slots',
}
