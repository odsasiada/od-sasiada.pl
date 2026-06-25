import type { Payload } from 'payload'

import { afterAll, beforeAll, expect, it } from 'vitest'

import { getCatalog, getCategories } from '@/lib/shop'
import { describeIntegration } from '../setup/integration'
import { requireTestPayload } from '../setup/payload'

/**
 * catalog-category-filter regression (S3.6) — proves the server-side category filter in getCatalog
 * is tenant-scoped (R-S3.5): a foreign/unknown slug never leaks cross-tenant products, and a
 * multi-category product appears under EACH of its categories (D4).
 *
 * Contract:
 *  - filter K1 → only product in K1; filter K2 → both products (K2 shared) — multi-category (D4).
 *  - no slug → all published products of the tenant (current behaviour preserved).
 *  - cross-tenant slug (tenant B's category given for tenant A) → empty (never B's, never all A's).
 *  - unknown slug → empty.
 *  - getCategories returns only THIS tenant's categories (AC4).
 */
describeIntegration('catalog-category-filter', () => {
  let payload: Payload
  let tenantAId: number
  let categoryBSlug: string
  let productA1Id: number
  let productA2Id: number
  const created: { collection: string; id: number }[] = []

  const track = <T extends { id: number }>(collection: string, doc: T): T => {
    created.push({ collection, id: doc.id })
    return doc
  }

  beforeAll(async () => {
    payload = await requireTestPayload()

    const tenantA = track(
      'tenants',
      await payload.create({
        collection: 'tenants',
        data: { name: 'Tenant A S3.6', settings: { isActive: true }, slug: 'tenant-a-s36' },
        overrideAccess: true,
      }),
    )
    const tenantB = track(
      'tenants',
      await payload.create({
        collection: 'tenants',
        data: { name: 'Tenant B S3.6', settings: { isActive: true }, slug: 'tenant-b-s36' },
        overrideAccess: true,
      }),
    )
    tenantAId = tenantA.id

    const categoryK1 = track(
      'categories',
      await payload.create({
        collection: 'categories',
        data: { name: 'Warzywa', slug: 'warzywa-s36', tenant: tenantA.id },
        overrideAccess: true,
      }),
    )
    const categoryK2 = track(
      'categories',
      await payload.create({
        collection: 'categories',
        data: { name: 'Owoce', slug: 'owoce-s36', tenant: tenantA.id },
        overrideAccess: true,
      }),
    )
    // Tenant B category — its slug must NEVER resolve for tenant A (R-S3.5).
    const categoryB = track(
      'categories',
      await payload.create({
        collection: 'categories',
        data: { name: 'Nabiał', slug: 'nabial-s36', tenant: tenantB.id },
        overrideAccess: true,
      }),
    )
    categoryBSlug = categoryB.slug

    // A1 ∈ {K1, K2}; A2 ∈ {K2}. Both published, tenant A.
    const productA1 = track(
      'products',
      await payload.create({
        collection: 'products',
        data: {
          _status: 'published',
          categories: [categoryK1.id, categoryK2.id],
          priceInPLN: 500,
          priceInPLNEnabled: true,
          tenant: tenantA.id,
          title: 'Produkt A1 S3.6',
        },
        overrideAccess: true,
      }),
    )
    const productA2 = track(
      'products',
      await payload.create({
        collection: 'products',
        data: {
          _status: 'published',
          categories: [categoryK2.id],
          priceInPLN: 700,
          priceInPLNEnabled: true,
          tenant: tenantA.id,
          title: 'Produkt A2 S3.6',
        },
        overrideAccess: true,
      }),
    )
    productA1Id = productA1.id
    productA2Id = productA2.id
  })

  afterAll(async () => {
    for (const { collection, id } of [...created].reverse()) {
      try {
        await payload.delete({ collection: collection as never, id, overrideAccess: true })
      } catch {
        // best-effort cleanup
      }
    }
  }, 60000)

  // --- AC4: getCategories tenant-scoped ---

  it('AC4: getCategories returns only this tenant categories', async () => {
    const cats = await getCategories(tenantAId)
    const slugs = cats.map((c) => c.slug)
    expect(slugs).toContain('warzywa-s36')
    expect(slugs).toContain('owoce-s36')
    expect(slugs).not.toContain(categoryBSlug)
  })

  // --- AC3: no slug → all published of the tenant ---

  it('AC3: no slug returns all published products of the tenant', async () => {
    const all = await getCatalog(tenantAId)
    const ids = all.map((p) => p.id)
    expect(ids).toContain(productA1Id)
    expect(ids).toContain(productA2Id)
  })

  // --- AC1 + AC2: category filter, multi-category appears in each ---

  it('AC1: filter K1 returns only the product in K1', async () => {
    const filtered = await getCatalog(tenantAId, 'warzywa-s36')
    expect(filtered.map((p) => p.id)).toEqual([productA1Id])
  })

  it('AC2: filter K2 returns BOTH products (multi-category product appears in each)', async () => {
    const filtered = await getCatalog(tenantAId, 'owoce-s36')
    const ids = filtered.map((p) => p.id).sort((a, b) => a - b)
    expect(ids).toEqual([productA1Id, productA2Id].sort((a, b) => a - b))
  })

  // --- AC5 / R-S3.5: cross-tenant + unknown slug → empty ---

  it('AC5: tenant B category slug given for tenant A returns empty (no cross-tenant leak)', async () => {
    const filtered = await getCatalog(tenantAId, categoryBSlug)
    expect(filtered).toEqual([])
  })

  it('AC5: unknown slug returns empty', async () => {
    const filtered = await getCatalog(tenantAId, 'nieistniejaca-kategoria-xyz')
    expect(filtered).toEqual([])
  })
})
