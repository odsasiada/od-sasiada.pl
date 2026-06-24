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

/** Resolve a tenant id whether `tenant` is an id, a populated object, or absent. */
const tenantOf = (doc: TenantHolder): null | number => {
  const t = doc?.tenant
  return t && typeof t === 'object' ? t.id : (t ?? null)
}

/** Resolve the referenced media id whether the upload value is an id, a populated object, or absent. */
const idOf = (value: unknown): null | number => {
  if (typeof value === 'number') {
    return value
  }
  if (value && typeof value === 'object' && 'id' in value && typeof (value as { id: unknown }).id === 'number') {
    return (value as { id: number }).id
  }
  return null
}

/** A single, optional hero image (`upload → media`); picker scoped to the doc's tenant (UX). */
export const heroImageField = (label: string): Field => ({
  filterOptions: ({ data }) => {
    const tenant = tenantOf(data as TenantHolder)
    return tenant === null ? true : { tenant: { equals: tenant } }
  },
  label,
  name: 'heroImage',
  relationTo: 'media',
  required: false,
  type: 'upload',
})

export const heroTenantMatch: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
  const heroImageId = idOf(data?.heroImage)
  // No hero, or cleared → optional (D6); nothing to validate.
  if (heroImageId === null) {
    return data
  }

  const docTenant = tenantOf(data as TenantHolder) ?? tenantOf(originalDoc as TenantHolder)
  const media = await req.payload.findByID({
    collection: 'media',
    depth: 0,
    disableErrors: true,
    id: heroImageId,
    overrideAccess: true,
  })

  // Reject a missing media or one belonging to a different tenant (R-S3.4).
  if (!media) {
    throw new APIError('Nie znaleziono zdjęcia.', 404, undefined)
  }
  if (tenantOf(media) === null) {
    throw new APIError('Zdjęcie nie ma przypisanego dostawcy — skontaktuj się z administratorem.', 400, undefined)
  }
  if (tenantOf(media) !== docTenant) {
    throw new APIError('Zdjęcie musi należeć do tego samego dostawcy.', 400, undefined)
  }

  return data
}
