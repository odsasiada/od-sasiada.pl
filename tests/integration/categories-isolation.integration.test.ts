import type { Payload } from 'payload'

import { afterAll, beforeAll, expect, it } from 'vitest'

import { describeIntegration } from '../setup/integration'
import { requireTestPayload } from '../setup/payload'

/**
 * categories-tenant-isolation regression (S3.5) — proves that the multiTenantPlugin
 * provides out-of-the-box isolation for the Categories collection (like products/orders/media).
 *
 * Contract: a tenant-B admin (overrideAccess:false) can neither LIST, READ-BY-ID, UPDATE,
 * nor DELETE tenant A's categories. platform-admin sees ALL categories.
 */
describeIntegration('categories-isolation', () => {
  let payload: Payload
  let adminBUser: Record<string, unknown>
  let categoryAId: number
  let categoryBId: number
  let tenantAId: number
  let productAId: number
  let createdProductId: number | null = null
  let platformAdminUser: { id: number; roles: string[] } | null = null
  const created: { collection: string; id: number }[] = []

  const track = <T extends { id: number }>(collection: string, doc: T): T => {
    created.push({ collection, id: doc.id })
    return doc
  }

  const categoryIdOf = (value: unknown): number | null => {
    if (typeof value === 'number') {
      return value
    }
    if (value && typeof value === 'object' && 'id' in value && typeof (value as { id: unknown }).id === 'number') {
      return (value as { id: number }).id
    }
    return null
  }

  beforeAll(async () => {
    payload = await requireTestPayload()

    const tenantA = track(
      'tenants',
      await payload.create({
        collection: 'tenants',
        data: { name: 'Tenant A S3.4', settings: { isActive: true }, slug: 'tenant-a-s34' },
        overrideAccess: true,
      }),
    )
    const tenantB = track(
      'tenants',
      await payload.create({
        collection: 'tenants',
        data: { name: 'Tenant B S3.4', settings: { isActive: true }, slug: 'tenant-b-s34' },
        overrideAccess: true,
      }),
    )

    tenantAId = tenantA.id
    const adminB = track(
      'users',
      await payload.create({
        collection: 'users',
        data: {
          email: 'admin-b-s34@example.com',
          password: 'adminbpass12345',
          roles: ['tenant-admin'],
          tenants: [{ tenant: tenantB.id }],
        },
        overrideAccess: true,
      }),
    )
    adminBUser = await payload.findByID({ collection: 'users', id: adminB.id, overrideAccess: true })

    const categoryA = track(
      'categories',
      await payload.create({
        collection: 'categories',
        data: {
          name: 'Warzywa Łąkowe',
          tenant: tenantA.id,
        },
        overrideAccess: true,
      }),
    )
    const categoryB = track(
      'categories',
      await payload.create({
        collection: 'categories',
        data: {
          name: 'Owoce',
          slug: 'owoce',
          tenant: tenantB.id,
        },
        overrideAccess: true,
      }),
    )

    categoryAId = categoryA.id
    categoryBId = categoryB.id

    const productA = track(
      'products',
      await payload.create({
        collection: 'products',
        data: {
          _status: 'published',
          priceInPLN: 500,
          priceInPLNEnabled: true,
          tenant: tenantA.id,
          title: 'Produkt A S3.4',
        },
        overrideAccess: true,
      }),
    )
    productAId = productA.id

    // Platform-admin user (sees all tenants via userHasAccessToAllTenants)
    platformAdminUser = (await payload.create({
      collection: 'users',
      data: {
        email: `platform-admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@od-sasiada.pl`,
        password: 'platformadminpass12345',
        roles: ['platform-admin'],
      },
      overrideAccess: true,
    })) as { id: number; roles: string[] }
  })

  afterAll(async () => {
    if (createdProductId !== null) {
      await payload
        .delete({ collection: 'products', id: createdProductId, overrideAccess: true })
        .catch(() => undefined)
    }

    // Cleanup platform-admin user
    if (platformAdminUser?.id) {
      try {
        await payload.delete({ collection: 'users', id: platformAdminUser.id, overrideAccess: true })
      } catch {
        // already gone
      }
    }

    for (const { collection, id } of [...created].reverse()) {
      try {
        await payload.delete({ collection: collection as never, id, overrideAccess: true })
      } catch {
        // best-effort cleanup
      }
    }
  }, 60000)

  // --- AC1: LIST isolation ---

  it('AC1: tenant-scoped category queries only return the matching tenant', async () => {
    const listA = await payload.find({
      collection: 'categories',
      limit: 50,
      overrideAccess: true,
      where: { tenant: { equals: tenantAId } },
    })

    expect(listA.totalDocs).toBe(1)
    expect(listA.docs.map((category) => category.id)).toEqual([categoryAId])

    const listB = await payload.find({
      collection: 'categories',
      limit: 50,
      overrideAccess: false,
      user: adminBUser as never,
    })

    expect(listB.totalDocs).toBe(1)
    expect(listB.docs.map((category) => category.id)).toEqual([categoryBId])
  })

  // --- AC2: findByID isolation ---

  it('AC2: tenant-B admin cannot read tenant A category by ID (blocked or empty)', async () => {
    let blocked = false
    try {
      const result = await payload.findByID({
        collection: 'categories',
        id: categoryAId,
        overrideAccess: false,
        user: adminBUser as never,
      })
      // If no error, verify the result is empty/null (not A's category)
      if (!result || result.id !== categoryAId) {
        blocked = true
      }
    } catch {
      blocked = true
    }
    expect(blocked).toBe(true)
  })

  // --- AC2: UPDATE isolation ---

  it('AC2: tenant-B admin cannot update tenant A category (blocked or unchanged)', async () => {
    let blocked = false
    try {
      await payload.update({
        collection: 'categories',
        data: { name: 'HACKED' },
        id: categoryAId,
        overrideAccess: false,
        user: adminBUser as never,
      })
    } catch {
      blocked = true
    }
    const after = await payload.findByID({ collection: 'categories', id: categoryAId, overrideAccess: true })
    // Isolation holds if the update was blocked OR the name did not change.
    expect(blocked).toBe(true)
  })

  // --- AC2: DELETE isolation ---

  it('AC2: tenant-B admin cannot delete tenant A category', async () => {
    let blocked = false
    try {
      await payload.delete({
        collection: 'categories',
        id: categoryAId,
        overrideAccess: false,
        user: adminBUser as never,
      })
    } catch {
      blocked = true
    }
    const after = await payload.findByID({ collection: 'categories', id: categoryAId, overrideAccess: true })
    // Isolation holds if the delete was blocked OR the category still exists.
    expect(blocked).toBe(true)
  })

  // --- AC3: platform-admin sees all ---

  it('AC3: platform-admin sees all categories from all tenants', async () => {
    const listAdmin = await payload.find({
      collection: 'categories',
      limit: 200,
      overrideAccess: false,
      user: platformAdminUser as never,
    })
    expect(listAdmin.docs.some((c) => c.id === categoryAId)).toBe(true)
    expect(listAdmin.docs.some((c) => c.id === categoryBId)).toBe(true)
  })

  // --- AC4: product-category tenant validation (existing test) ---

  it('AC4 + D7: product accepts same-tenant categories, rejects cross-tenant ones, and stays optional', async () => {
    const productWithCategory = await payload.update({
      collection: 'products',
      data: { categories: [categoryAId] },
      id: productAId,
      overrideAccess: true,
    })

    expect((productWithCategory.categories ?? []).map(categoryIdOf)).toEqual([categoryAId])

    await expect(
      payload.update({
        collection: 'products',
        data: { categories: [categoryAId, categoryBId] },
        id: productAId,
        overrideAccess: true,
      }),
    ).rejects.toThrow('Kategoria musi należeć do tego samego dostawcy.')

    const createdProduct = track(
      'products',
      await payload.create({
        collection: 'products',
        data: {
          _status: 'published',
          priceInPLN: 990,
          priceInPLNEnabled: true,
          tenant: tenantAId,
          title: 'Produkt bez kategorii',
        },
        overrideAccess: true,
      }),
    )
    createdProductId = createdProduct.id

    expect(createdProduct.categories ?? []).toEqual([])
  })
})
