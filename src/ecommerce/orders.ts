import type {
  CollectionAfterChangeHook,
  CollectionBeforeChangeHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
  Field,
} from 'payload'

import { sendOrderConfirmation, sendStatusChange } from '@/ecommerce/order-emails'
import {
  isAllowedTransition,
  ORDER_STATUS_LABELS,
  type OrderStatusValue,
  orderStatusField,
  shouldEmailStatusChange,
} from '@/ecommerce/order-status'
import { countActiveOrdersForOccurrence, occurrenceOf } from '@/lib/slot-capacity'

/**
 * Orders collection override from the ecommerce plugin:
 *  - adds readable `orderNumber` (ZAM-RRRR-NNNNN), generated on creation,
 *  - adds snapshot fields for line items (name, variant, unit price in grosze),
 *    copied at order placement — immune to later price changes,
 *  - overrides `status` field with delivery state machine + validates transitions,
 *  - afterChange: notification stub on status change (for future email/SMS).
 */

/**
 * EPIC-2: the chosen delivery occurrence persisted on the order as a read-only SNAPSHOT.
 *
 * `slot` + `date` (S2.7) are the MINIMUM needed by the capacity recount (one source of truth =
 * active orders, keyed per occurrence: slot + date). `date` is a queryable "YYYY-MM-DD" text so
 * `payload.count` can filter `deliverySlot.date`.
 *
 * `windowStart` / `windowEnd` / `label` (S2.4) are the presentational snapshot — a COPY of the
 * validated occurrence taken at order creation, immune to later config changes (B1). They are NOT
 * a live join: editing/deleting the `delivery-slots` record never rewrites a placed order's term.
 * All fields are readOnly in the admin and optional (orders without a slot exist — O8).
 */
const DELIVERY_SLOT_FIELD: Field = {
  admin: { readOnly: true },
  fields: [
    {
      label: 'Slot dostawy',
      name: 'slot',
      relationTo: 'delivery-slots',
      type: 'relationship',
    },
    {
      admin: { description: 'Dzień wystąpienia (RRRR-MM-DD, Europe/Warsaw)' },
      label: 'Data dostawy',
      name: 'date',
      type: 'text',
    },
    {
      admin: { description: 'Początek okna (GG:MM, Europe/Warsaw)' },
      label: 'Początek okna',
      name: 'windowStart',
      type: 'text',
    },
    {
      admin: { description: 'Koniec okna (GG:MM, Europe/Warsaw)' },
      label: 'Koniec okna',
      name: 'windowEnd',
      type: 'text',
    },
    {
      admin: { description: 'Etykieta czytelna dla człowieka (np. „pon. 23.06.2026, 08:00–12:00”)' },
      label: 'Etykieta terminu',
      name: 'label',
      type: 'text',
    },
  ],
  label: 'Termin dostawy',
  name: 'deliverySlot',
  type: 'group',
}

const SNAPSHOT_FIELDS: Field[] = [
  {
    admin: { readOnly: true },
    label: 'Name (snapshot)',
    name: 'productNameSnapshot',
    type: 'text',
  },
  {
    admin: { readOnly: true },
    label: 'Variant (snapshot)',
    name: 'variantLabelSnapshot',
    type: 'text',
  },
  {
    admin: { description: 'In grosze (130 = 1.30 PLN)', readOnly: true },
    label: 'Unit price (snapshot)',
    name: 'unitPriceSnapshot',
    type: 'number',
  },
]

const populateSnapshotAndNumber: CollectionBeforeValidateHook = async ({ data, operation, req }) => {
  if (!data || operation !== 'create') {
    return data
  }

  // Order number (simple, per-year; sufficient for MVP/dev).
  if (!data.orderNumber) {
    const year = new Date().getFullYear()
    const { totalDocs } = await req.payload.count({ collection: 'orders' })
    data.orderNumber = `ZAM-${year}-${String(totalDocs + 1).padStart(5, '0')}`
  }

  // Line item snapshot — copy product name, variant label, and unit price.
  // Items (and the product/variant lookups within each) are independent reads → fan them out.
  if (Array.isArray(data.items)) {
    await Promise.all(
      data.items.map(async (item) => {
        if (!item?.product) {
          return
        }

        const [product, variant] = await Promise.all([
          req.payload.findByID({ collection: 'products', depth: 0, disableErrors: true, id: item.product }),
          item.variant
            ? req.payload.findByID({ collection: 'variants', depth: 0, disableErrors: true, id: item.variant })
            : Promise.resolve(null),
        ])

        item.productNameSnapshot = product?.title ?? null
        item.unitPriceSnapshot = product?.priceInPLN ?? null

        if (item.variant) {
          item.variantLabelSnapshot = variant?.title ?? null
          item.unitPriceSnapshot = variant?.priceInPLN ?? item.unitPriceSnapshot
        }
      }),
    )
  }

  return data
}

// Validates status transitions per state machine (only on update of existing order).
const validateStatusTransition: CollectionBeforeChangeHook = ({ data, operation, originalDoc }) => {
  if (operation !== 'update' || !data?.status || !originalDoc?.status) {
    return data
  }
  const from = originalDoc.status as OrderStatusValue
  const to = data.status as OrderStatusValue
  if (!isAllowedTransition(from, to)) {
    throw new Error(
      `Invalid status change: "${ORDER_STATUS_LABELS[from] ?? from}" → "${ORDER_STATUS_LABELS[to] ?? to}".`,
    )
  }
  return data
}

// S2.7: re-validate capacity when reactivating a cancelled order (`cancelled → new`). The seat
// was freed while cancelled (recount excludes `cancelled`); reactivation must not overbook the
// occurrence. The current order is still `cancelled` in the DB during beforeChange, so it does not
// count itself. Runs in the update's `req` (transaction context); orders without a slot are skipped.
const revalidateCapacityOnReactivation: CollectionBeforeChangeHook = async ({ data, operation, originalDoc, req }) => {
  if (operation !== 'update' || data?.status !== 'new' || originalDoc?.status !== 'cancelled') {
    return data
  }
  const occ = occurrenceOf(originalDoc)
  if (!occ) {
    return data // O8 / order without a slot — nothing to re-validate.
  }

  const slot = await req.payload.findByID({
    collection: 'delivery-slots',
    depth: 0,
    disableErrors: true,
    id: occ.slotId,
    req,
  })
  const capacity = typeof slot?.capacity === 'number' ? slot.capacity : 0

  // Current order is still `cancelled` in the DB here, so it doesn't count itself.
  const active = await countActiveOrdersForOccurrence(
    req.payload,
    occ.slotId,
    occ.date,
    req as { transactionID: number | string },
  )

  if (active >= capacity) {
    throw new Error('Nie można przywrócić zamówienia — wybrany termin jest pełny.')
  }
  return data
}

// S1.7: emails. Confirmation on create, notification on status change.
// Sending doesn't block the operation — SMTP errors are only logged.
const notifyOnOrderChange: CollectionAfterChangeHook = ({ doc, operation, previousDoc, req }) => {
  if (operation === 'create') {
    sendOrderConfirmation(req.payload, doc).catch((err) =>
      req.payload.logger.error(`Order confirmation email ${doc.orderNumber} not sent: ${err}`),
    )
  } else if (
    operation === 'update' &&
    previousDoc?.status &&
    shouldEmailStatusChange(previousDoc.status as OrderStatusValue, doc.status as OrderStatusValue)
  ) {
    // S2.5: mail tylko na milestone'ach „do przodu" (O5) + cisza przy cofnięciu (O6/R-S2.3).
    sendStatusChange(req.payload, doc).catch((err) =>
      req.payload.logger.error(`Order status email ${doc.orderNumber} not sent: ${err}`),
    )
  }
  return doc
}

// The `items` field is nested inside `tabs`; `status` is top-level. Recursively replace both.
const withOverrides = (fields: Field[]): Field[] =>
  fields.map((field) => {
    if ('name' in field && field.name === 'items' && field.type === 'array') {
      return { ...field, fields: [...field.fields, ...SNAPSHOT_FIELDS] }
    }
    if ('name' in field && field.name === 'status') {
      return orderStatusField
    }
    if (field.type === 'tabs') {
      return {
        ...field,
        tabs: field.tabs.map((tab) => ('fields' in tab ? { ...tab, fields: withOverrides(tab.fields) } : tab)),
      }
    }
    if ('fields' in field && Array.isArray(field.fields)) {
      return { ...field, fields: withOverrides(field.fields) }
    }
    return field
  })

export const ordersOverride = ({ defaultCollection }: { defaultCollection: CollectionConfig }): CollectionConfig => {
  return {
    ...defaultCollection,
    admin: {
      ...defaultCollection.admin,
      defaultColumns: ['orderNumber', 'customerEmail', 'status', 'amount'],
      useAsTitle: 'orderNumber',
    },
    fields: [
      {
        admin: { position: 'sidebar', readOnly: true },
        index: true,
        label: 'Order number',
        name: 'orderNumber',
        type: 'text',
        unique: true,
      },
      DELIVERY_SLOT_FIELD,
      ...withOverrides(defaultCollection.fields),
    ],
    hooks: {
      ...defaultCollection.hooks,
      afterChange: [...(defaultCollection.hooks?.afterChange ?? []), notifyOnOrderChange],
      beforeChange: [
        ...(defaultCollection.hooks?.beforeChange ?? []),
        validateStatusTransition,
        revalidateCapacityOnReactivation,
      ],
      beforeValidate: [...(defaultCollection.hooks?.beforeValidate ?? []), populateSnapshotAndNumber],
    },
  }
}
