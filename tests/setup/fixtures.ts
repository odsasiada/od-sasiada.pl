import type { Payload } from 'payload'

/**
 * Minimal, self-contained fixtures for integration tests — a tiny reconstruction of what
 * `seed.ts` + the old `second-tenant.ts` spike produced, but scoped to a unique run id so
 * tests never collide with real seed data or each other.
 *
 * Two tenants (A, B), each with one published priced product; tenant A also has a
 * product-with-variant. A tenant-admin user is created for tenant B (for isolation tests).
 * Everything is created with overrideAccess so setup never depends on access rules.
 *
 * Call `cleanup()` (returned) in afterAll to remove everything created.
 */

export type TenantFixtures = {
  adminBUser: Record<string, unknown>
  cleanup: () => Promise<void>
  /** Create an order AND register it for cleanup (deleted before its tenant). */
  createOrder: (data: Record<string, unknown>) => Promise<{ id: number }>
  customerA1: { id: number }
  customerA2: { id: number }
  customerB1: { id: number }
  productA: { id: number; priceInPLN: number }
  productB: { id: number; priceInPLN: number }
  tenantA: { id: number }
  tenantB: { id: number }
  variantA: { id: number; priceInPLN: number; productId: number }
}

export const createFixtures = async (payload: Payload): Promise<TenantFixtures> => {
  const stamp = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`

  const created: { collection: string; id: number }[] = []
  const track = <T extends { id: number }>(collection: string, doc: T): T => {
    created.push({ collection, id: doc.id })
    return doc
  }

  const tenantA = track(
    'tenants',
    await payload.create({
      collection: 'tenants',
      data: { name: `Test A ${stamp}`, settings: { isActive: true, minOrderValue: 3000 }, slug: `test-a-${stamp}` },
      overrideAccess: true,
    }),
  )
  const tenantB = track(
    'tenants',
    await payload.create({
      collection: 'tenants',
      data: { name: `Test B ${stamp}`, settings: { isActive: true, minOrderValue: 4000 }, slug: `test-b-${stamp}` },
      overrideAccess: true,
    }),
  )

  const productA = track(
    'products',
    await payload.create({
      collection: 'products',
      data: {
        _status: 'published',
        priceInPLN: 500,
        priceInPLNEnabled: true,
        tenant: tenantA.id,
        title: `Prod A ${stamp}`,
      },
      overrideAccess: true,
    }),
  ) as { id: number; priceInPLN: number }

  const productB = track(
    'products',
    await payload.create({
      collection: 'products',
      data: {
        _status: 'published',
        priceInPLN: 250,
        priceInPLNEnabled: true,
        tenant: tenantB.id,
        title: `Prod B ${stamp}`,
      },
      overrideAccess: true,
    }),
  ) as { id: number; priceInPLN: number }

  // Product-with-variant in tenant A (mirrors the seed's variant products).
  const variantType = track(
    'variantTypes',
    await payload.create({
      collection: 'variantTypes',
      data: { label: 'Porcja', name: `porcja-${stamp}`, tenant: tenantA.id },
      overrideAccess: true,
    }),
  )
  const variantOption = track(
    'variantOptions',
    await payload.create({
      collection: 'variantOptions',
      data: { label: 'worek 15 kg', tenant: tenantA.id, value: `worek-15-${stamp}`, variantType: variantType.id },
      overrideAccess: true,
    }),
  )
  const variantParent = track(
    'products',
    await payload.create({
      collection: 'products',
      data: {
        _status: 'published',
        enableVariants: true,
        tenant: tenantA.id,
        title: `Prod A variant ${stamp}`,
        variantTypes: [variantType.id],
      },
      overrideAccess: true,
    }),
  )
  const variant = track(
    'variants',
    await payload.create({
      collection: 'variants',
      data: {
        _status: 'published',
        options: [variantOption.id],
        priceInPLN: 2500,
        priceInPLNEnabled: true,
        product: variantParent.id,
        tenant: tenantA.id,
        title: 'worek 15 kg',
      },
      overrideAccess: true,
    }),
  ) as { id: number; priceInPLN: number }

  const makeCustomer = async (suffix: string, tenantId: number) =>
    track(
      'customers',
      await payload.create({
        collection: 'customers',
        data: {
          email: `test-${suffix}-${stamp}@example.com`,
          firstName: 'Test',
          lastName: suffix,
          password: 'testpass12345',
          tenant: tenantId,
        },
        overrideAccess: true,
      }),
    )

  const customerA1 = await makeCustomer('a1', tenantA.id)
  const customerA2 = await makeCustomer('a2', tenantA.id)
  const customerB1 = await makeCustomer('b1', tenantB.id)

  const adminB = track(
    'users',
    await payload.create({
      collection: 'users',
      data: {
        email: `admin-b-${stamp}@od-sasiada.pl`,
        password: 'adminbpass12345',
        roles: ['tenant-admin'],
        tenants: [{ tenant: tenantB.id }],
      },
      overrideAccess: true,
    }),
  )
  // Full user doc (with `tenants` populated) for access simulation.
  const adminBUser = await payload.findByID({ collection: 'users', id: adminB.id, overrideAccess: true })

  // Orders created by tests go through here so they're deleted BEFORE their tenant
  // (reverse-order cleanup), avoiding a tenant-cascade delete over orphaned orders.
  const createOrder = async (data: Record<string, unknown>): Promise<{ id: number }> =>
    track('orders', await payload.create({ collection: 'orders', data: data as never, overrideAccess: true }))

  const cleanup = async () => {
    // Delete in reverse creation order; ignore individual failures so cleanup is best-effort.
    for (const { collection, id } of [...created].reverse()) {
      try {
        await payload.delete({ collection: collection as never, id, overrideAccess: true })
      } catch {
        // already gone / cascade-deleted by tenant removal
      }
    }
  }

  return {
    adminBUser: adminBUser as Record<string, unknown>,
    cleanup,
    createOrder,
    customerA1,
    customerA2,
    customerB1,
    productA,
    productB,
    tenantA,
    tenantB,
    variantA: { id: variant.id, priceInPLN: variant.priceInPLN, productId: variantParent.id },
  }
}
