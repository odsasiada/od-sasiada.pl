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
} from '@/ecommerce/order-status'

/**
 * Orders collection override from the ecommerce plugin:
 *  - adds readable `orderNumber` (ZAM-RRRR-NNNNN), generated on creation,
 *  - adds snapshot fields for line items (name, variant, unit price in grosze),
 *    copied at order placement — immune to later price changes,
 *  - overrides `status` field with delivery state machine + validates transitions,
 *  - afterChange: notification stub on status change (for future email/SMS).
 */

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

// S1.7: emails. Confirmation on create, notification on status change.
// Sending doesn't block the operation — SMTP errors are only logged.
const notifyOnOrderChange: CollectionAfterChangeHook = ({ doc, operation, previousDoc, req }) => {
  if (operation === 'create') {
    sendOrderConfirmation(req.payload, doc).catch((err) =>
      req.payload.logger.error(`Order confirmation email ${doc.orderNumber} not sent: ${err}`),
    )
  } else if (operation === 'update' && previousDoc?.status && doc.status !== previousDoc.status) {
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
      ...withOverrides(defaultCollection.fields),
    ],
    hooks: {
      ...defaultCollection.hooks,
      afterChange: [...(defaultCollection.hooks?.afterChange ?? []), notifyOnOrderChange],
      beforeChange: [...(defaultCollection.hooks?.beforeChange ?? []), validateStatusTransition],
      beforeValidate: [...(defaultCollection.hooks?.beforeValidate ?? []), populateSnapshotAndNumber],
    },
  }
}
