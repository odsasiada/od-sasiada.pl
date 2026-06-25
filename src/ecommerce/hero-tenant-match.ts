import { APIError, type CollectionBeforeValidateHook, type Field } from 'payload'

/**
 * S3.2 — single optional hero image (D2/D3/D6) on products AND variants, with authoritative
 * tenant isolation (R-S3.4). Shared by both `productsCollectionOverride` and
 * `variantsCollectionOverride` so the rule lives in one place.
 *
 * TWO layers, per project-context (NFR1, "never trust input — read from DB"):
 *  - `filterOptions` scopes the panel picker to the doc's tenant. UX ONLY — Local API or a
 *    forged value can still point heroImage at another tenant's media.
 *  - `heroTenantMatch` (collection beforeValidate) is the authoritative guard: it reads the
 *    referenced media from the DB and rejects when its tenant differs from the doc's tenant.
 *    It runs AFTER the multi-tenant field defaultValue has stamped `data.tenant` (Payload
 *    applies field defaultValues in the beforeValidate-fields phase, before collection
 *    beforeValidate hooks), so `data.tenant` is populated on create and `originalDoc.tenant`
 *    covers updates.
 */

type TenantHolder = { tenant?: null | number | { id: number } } | null | undefined
type TenantRelationValue = unknown | unknown[] | null | undefined

/** Resolve a tenant id whether `tenant` is an id, a populated object, or absent. */
const tenantOf = (doc: TenantHolder): null | number => {
  const t = doc?.tenant
  return t && typeof t === 'object' ? t.id : (t ?? null)
}

/** Resolve the referenced media id whether the upload value is an id, a populated object, or absent. */
const idOf = (value: unknown): null | number => {
  // DB ids are positive integers — reject NaN/Infinity/fractional and any non-integer string
  // (incl. '' which `Number('')` would coerce to 0, turning a cleared optional field into a
  // phantom id-0 lookup → spurious 404). Only `^\d+$` strings and integer numbers are real ids.
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value : null
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return /^\d+$/.test(trimmed) ? Number(trimmed) : null
  }
  if (value && typeof value === 'object' && 'id' in value && typeof (value as { id: unknown }).id === 'number') {
    return (value as { id: number }).id
  }
  return null
}

const idsOf = (value: TenantRelationValue): number[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      const id = idOf(item)
      return id === null ? [] : [id]
    })
  }

  const id = idOf(value)
  return id === null ? [] : [id]
}

const tenantScopedFilterOptions = ({ data }: { data?: unknown }) => {
  const tenant = tenantOf(data as TenantHolder)
  return tenant === null ? true : { tenant: { equals: tenant } }
}

const validateTenantRelation = async ({
  collection,
  docTenant,
  ids,
  req,
  missingMessage,
  mismatchMessage,
}: {
  collection: 'categories' | 'media'
  docTenant: null | number
  ids: number[]
  missingMessage: string
  mismatchMessage: string
  req: Parameters<CollectionBeforeValidateHook>[0]['req']
}) => {
  if (ids.length === 0) return

  if (docTenant === null) {
    throw new APIError('Zapisany dokument nie ma przypisanego dostawcy — najpierw wybierz dostawcę.', 400, undefined)
  }

  const relations = await req.payload.find({
    collection,
    depth: 0,
    limit: ids.length,
    overrideAccess: true,
    where: { id: { in: ids } },
  })

  const found = new Set(relations.docs.map((r) => r.id))
  const missing = ids.filter((id) => !found.has(id))
  if (missing.length > 0) {
    throw new APIError(missingMessage, 404, undefined)
  }

  for (const relation of relations.docs) {
    if (tenantOf(relation) === null) {
      throw new APIError(
        'Powiązany rekord nie ma przypisanego dostawcy — skontaktuj się z administratorem.',
        400,
        undefined,
      )
    }

    if (tenantOf(relation) !== docTenant) {
      throw new APIError(mismatchMessage, 400, undefined)
    }
  }
}

/** A single, optional hero image (`upload → media`); picker scoped to the doc's tenant (UX). */
export const heroImageField = (label: string): Field => ({
  filterOptions: tenantScopedFilterOptions,
  label,
  name: 'heroImage',
  relationTo: 'media',
  required: false,
  type: 'upload',
})

/** Optional product categories (`relationship → categories`, hasMany) scoped to the doc's tenant (UX). */
export const categoriesField = (label: string): Field => ({
  filterOptions: tenantScopedFilterOptions,
  hasMany: true,
  label,
  name: 'categories',
  relationTo: 'categories',
  required: false,
  type: 'relationship',
})

export const heroTenantMatch: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
  const docTenant = tenantOf(data as TenantHolder) ?? tenantOf(originalDoc as TenantHolder)
  const heroImageIds = idsOf(data?.heroImage)
  const categoryIds = idsOf(data?.categories)

  if (heroImageIds.length > 0) {
    // No hero, or cleared → optional (D6); nothing to validate.
    await validateTenantRelation({
      collection: 'media',
      docTenant,
      ids: heroImageIds,
      mismatchMessage: 'Zdjęcie musi należeć do tego samego dostawcy.',
      missingMessage: 'Nie znaleziono zdjęcia.',
      req,
    })
  }

  if (categoryIds.length > 0) {
    await validateTenantRelation({
      collection: 'categories',
      docTenant,
      ids: categoryIds,
      mismatchMessage: 'Kategoria musi należeć do tego samego dostawcy.',
      missingMessage: 'Nie znaleziono kategorii.',
      req,
    })
  }

  return data
}
