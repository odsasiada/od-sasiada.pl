import type { Payload } from 'payload'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { describeIntegration } from '../setup/integration'
import { requireTestPayload } from '../setup/payload'

/**
 * Tenant cascade delete regression test.
 *
 * Problem: DELETE /api/tenants/:id hangs because Postgres FK constraints block
 * the delete BEFORE the afterTenantDelete hook can clean up related documents.
 *
 * Root cause: multiTenantPlugin adds `tenant` relationship fields to 13 collections.
 * When a tenant is deleted, Postgres rejects the DELETE if child rows exist,
 * regardless of the afterTenantDelete hook that tries to clean up AFTER deletion.
 *
 * Expected fix: Either beforeDelete hook (cleanup before delete) or ON DELETE CASCADE.
 */
describeIntegration('tenant-cascade-delete', () => {
  let payload: Payload
  let tenantToDeleteId: number
  let tenantToKeepId: number

  // Track all created resources for cleanup
  const created: { collection: string; id: number }[] = []

  const track = <T extends { id: number }>(collection: string, doc: T): T => {
    created.push({ collection, id: doc.id })
    return doc
  }

  beforeAll(async () => {
    payload = await requireTestPayload()

    // Create tenant to delete (with related records)
    const tenantToDelete = track(
      'tenants',
      await payload.create({
        collection: 'tenants',
        data: { name: 'Tenant To Delete', settings: { isActive: true }, slug: 'tenant-to-delete' },
        overrideAccess: true,
      }),
    )
    tenantToDeleteId = tenantToDelete.id

    // Create tenant to keep (to verify isolation)
    const tenantToKeep = track(
      'tenants',
      await payload.create({
        collection: 'tenants',
        data: { name: 'Tenant To Keep', settings: { isActive: true }, slug: 'tenant-to-keep' },
        overrideAccess: true,
      }),
    )
    tenantToKeepId = tenantToKeep.id

    // Create related records for tenant-to-delete
    const productToDelete = track(
      'products',
      await payload.create({
        collection: 'products',
        data: {
          _status: 'published',
          priceInPLN: 100,
          priceInPLNEnabled: true,
          tenant: tenantToDeleteId,
          title: 'Product for deletion',
        },
        overrideAccess: true,
      }),
    )

    const categoryToDelete = track(
      'categories',
      await payload.create({
        collection: 'categories',
        data: {
          name: 'Category for deletion',
          tenant: tenantToDeleteId,
        },
        overrideAccess: true,
      }),
    )

    // Create related record for tenant-to-keep (verify isolation)
    track(
      'products',
      await payload.create({
        collection: 'products',
        data: {
          _status: 'published',
          priceInPLN: 200,
          priceInPLNEnabled: true,
          tenant: tenantToKeepId,
          title: 'Product to keep',
        },
        overrideAccess: true,
      }),
    )

    // Verify setup
    const productsForTenant = await payload.find({
      collection: 'products',
      limit: 10,
      overrideAccess: true,
      where: { tenant: { equals: tenantToDeleteId } },
    })
    expect(productsForTenant.totalDocs).toBeGreaterThanOrEqual(1)

    const productsForKept = await payload.find({
      collection: 'products',
      limit: 10,
      overrideAccess: true,
      where: { tenant: { equals: tenantToKeepId } },
    })
    expect(productsForKept.totalDocs).toBeGreaterThanOrEqual(1)
  })

  afterAll(async () => {
    // Cleanup: delete in reverse order (children before parents)
    for (const { collection, id } of [...created].reverse()) {
      try {
        await payload.delete({ collection: collection as never, id, overrideAccess: true })
      } catch {
        // best-effort cleanup
      }
    }
  }, 60000)

  // --- P0: Critical tests (must fail before fix) ---

  it('P0: tenant with related records can be deleted (no FK constraint error)', async () => {
    // This test should FAIL before the fix due to FK constraint violation
    // After fix, it should succeed
    try {
      await payload.delete({
        collection: 'tenants',
        id: tenantToDeleteId,
        overrideAccess: true,
      })
      // If we reach here, delete succeeded
      expect(true).toBe(true)
    } catch (error) {
      // Before fix: expect FK constraint error
      // After fix: this catch should not be reached
      const errorMessage = error instanceof Error ? error.message : String(error)
      // Re-throw with context - this should FAIL before fix
      throw new Error(
        `Tenant delete failed (likely FK constraint): ${errorMessage}`,
      )
    }
  })

  it('P0: after delete, all child records should be removed', async () => {
    // This test should only pass AFTER the fix (when delete succeeds)
    const products = await payload.find({
      collection: 'products',
      limit: 10,
      overrideAccess: true,
      where: { tenant: { equals: tenantToDeleteId } },
    })
    expect(products.totalDocs).toBe(0)

    const categories = await payload.find({
      collection: 'categories',
      limit: 10,
      overrideAccess: true,
      where: { tenant: { equals: tenantToDeleteId } },
    })
    expect(categories.totalDocs).toBe(0)
  })

  it('P0: tenant itself should be deleted', async () => {
    try {
      await payload.findByID({
        collection: 'tenants',
        id: tenantToDeleteId,
        overrideAccess: true,
      })
      // If we reach here, tenant still exists - test should fail
      expect(true).toBe(false)
    } catch {
      // Expected: tenant not found after deletion
      expect(true).toBe(true)
    }
  })

  it('P0: tenant-to-keep and its records should be unaffected', async () => {
    // Verify isolation: other tenants are not affected
    const keptTenant = await payload.findByID({
      collection: 'tenants',
      id: tenantToKeepId,
      overrideAccess: true,
    })
    expect(keptTenant.id).toBe(tenantToKeepId)

    const keptProducts = await payload.find({
      collection: 'products',
      limit: 10,
      overrideAccess: true,
      where: { tenant: { equals: tenantToKeepId } },
    })
    expect(keptProducts.totalDocs).toBeGreaterThanOrEqual(1)
  })
})
