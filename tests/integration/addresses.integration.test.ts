import type { Payload } from 'payload'

import { afterAll, beforeAll, expect, it } from 'vitest'

import { createFixtures, type TenantFixtures } from '../setup/fixtures'
import { describeIntegration } from '../setup/integration'
import { requireTestPayload } from '../setup/payload'

/**
 * Saved addresses isolation (S1.3) — ports `src/spike-addresses.ts`.
 *
 * Asserts: valid address created; bad postal code (12345) rejected by the field validation;
 * owner (customer 1) sees their own address; customer 2 does NOT (isDocumentOwner access).
 * DB-backed; skipped if no Postgres is reachable.
 */
describeIntegration('saved addresses isolation (S1.3)', () => {
  let payload: Payload
  let fx: TenantFixtures
  let addressId: number

  beforeAll(async () => {
    payload = await requireTestPayload()
    fx = await createFixtures(payload)
    const addr = await payload.create({
      collection: 'addresses',
      data: {
        addressLine1: 'ul. Kwiatowa 7',
        city: 'Kartuzy',
        country: 'PL',
        customer: fx.customerA1.id,
        firstName: 'Ewa',
        lastName: 'L',
        phone: '605 111 222',
        postalCode: '83-300',
        tenant: fx.tenantA.id,
        title: 'Dom',
      },
      overrideAccess: true,
    })
    addressId = addr.id
  })

  afterAll(async () => {
    try {
      await payload.delete({ collection: 'addresses', id: addressId, overrideAccess: true })
    } catch {
      // best-effort
    }
    await fx?.cleanup()
  })

  it('creates a valid address', () => {
    expect(addressId).toBeGreaterThan(0)
  })

  it('rejects a bad postal code (12345) at create time', async () => {
    await expect(
      payload.create({
        collection: 'addresses',
        data: {
          city: 'X',
          country: 'PL',
          customer: fx.customerA1.id,
          postalCode: '12345',
          tenant: fx.tenantA.id,
        },
        overrideAccess: true,
      }),
    ).rejects.toBeTruthy()
  })

  it('owner (customer 1) sees their own address; customer 2 does not', async () => {
    const c1User = await payload.findByID({ collection: 'customers', id: fx.customerA1.id, overrideAccess: true })
    const c2User = await payload.findByID({ collection: 'customers', id: fx.customerA2.id, overrideAccess: true })

    const listC1 = await payload.find({
      collection: 'addresses',
      overrideAccess: false,
      user: { ...c1User, collection: 'customers' } as never,
    })
    const listC2 = await payload.find({
      collection: 'addresses',
      overrideAccess: false,
      user: { ...c2User, collection: 'customers' } as never,
    })

    expect(listC1.docs.some((a) => a.id === addressId)).toBe(true)
    expect(listC2.docs.some((a) => a.id === addressId)).toBe(false)
  })
})
