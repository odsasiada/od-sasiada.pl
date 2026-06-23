import type { BasePayload } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import { sendOrderConfirmation, sendStatusChange } from '@/ecommerce/order-emails'

/**
 * Order email builders (S1.7, treść PL-izowana w S2.6) — portuje `src/spike-email.ts`, ale BEZ
 * żywego SMTP.
 *
 * Stary spike wysyłał prawdziwego maila, by udowodnić poprawność danych SMTP; tego nie da się
 * asertować w CI. Zamiast tego przechwytujemy `payload.sendEmail(...)` stubem i sprawdzamy, że
 * buildery produkują właściwy temat / odbiorcę / treść (po polsku, z terminem dostawy i kontaktem
 * dostawcy). Żywy smoke-test SMTP jest celowo pominięty poniżej (`describe.skip`).
 */

// Stub payloada: `sendEmail` (przechwytuje maila) + `findByID` (S2.6: odczyt telefonu dostawcy
// `tenant.settings.contactPhone`). Domyślnie tenant bez telefonu → blok kontaktu pominięty; w
// testach kontaktu podstawiamy `contactPhone`.
const stubPayload = (tenant?: { settings?: { contactPhone?: null | string } } | null) => {
  const sendEmail = vi.fn(async (_message: { html: string; subject: string; to: string }) => undefined)
  const findByID = vi.fn(async (_args: { collection: string; id: number }) => tenant ?? null)
  return { findByID, payload: { findByID, sendEmail } as unknown as BasePayload, sendEmail }
}

const baseOrder = {
  amount: 5260, // 12 × 130 (jaja) + 2 × 1850 placeholder; value-irrelevant, asserted as formatted total
  customerEmail: 'klient@example.com',
  items: [
    { productNameSnapshot: 'Jaja wiejskie', quantity: 12, unitPriceSnapshot: 130, variantLabelSnapshot: null },
    { productNameSnapshot: 'Ziemniaki', quantity: 1, unitPriceSnapshot: 2500, variantLabelSnapshot: 'worek 15 kg' },
  ],
  orderNumber: 'ZAM-2026-00001',
  shippingAddress: {
    addressLine1: 'ul. Kaszubska 12',
    city: 'Kartuzy',
    firstName: 'Anna',
    lastName: 'Kowalska',
    phone: '600 100 200',
    postalCode: '83-300',
  },
  status: 'new',
  tenant: 7,
}

/** Pobiera argument jedynego wywołania `sendEmail` (typowane przez stub). */
const capturedEmail = (sendEmail: ReturnType<typeof stubPayload>['sendEmail']) => {
  expect(sendEmail).toHaveBeenCalledTimes(1)
  return sendEmail.mock.calls[0][0]
}

describe('sendOrderConfirmation builder', () => {
  it('sends to the customer with order number in subject and a formatted PLN total', async () => {
    const { payload, sendEmail } = stubPayload()
    await sendOrderConfirmation(payload, baseOrder)

    const arg = capturedEmail(sendEmail)
    expect(arg.to).toBe('klient@example.com')
    expect(arg.subject).toContain('ZAM-2026-00001')
    expect(arg.html).toContain('ZAM-2026-00001')
    // grosze → "52,60 zł" formatting (comma decimal, zł suffix)
    expect(arg.html).toContain('52,60 zł')
    // line items rendered (variant label wins over product name when present)
    expect(arg.html).toContain('Jaja wiejskie')
    expect(arg.html).toContain('worek 15 kg')
    // shipping address block
    expect(arg.html).toContain('Anna')
    expect(arg.html).toContain('83-300')
  })

  it('uses Polish copy in subject and body (S2.6)', async () => {
    const { payload, sendEmail } = stubPayload()
    await sendOrderConfirmation(payload, baseOrder)

    const arg = capturedEmail(sendEmail)
    expect(arg.subject).toContain('Potwierdzenie zamówienia')
    expect(arg.html).toContain('Dziękujemy za zamówienie')
    expect(arg.html).toContain('Razem:')
    expect(arg.html).toContain('Adres dostawy:')
  })

  it('includes the delivery slot block when the order has a slot snapshot (S2.4/S2.6)', async () => {
    const { payload, sendEmail } = stubPayload()
    await sendOrderConfirmation(payload, {
      ...baseOrder,
      deliverySlot: {
        date: '2026-06-25',
        label: 'czw. 25.06.2026, 08:00–12:00',
        windowEnd: '12:00',
        windowStart: '08:00',
      },
    })

    const arg = capturedEmail(sendEmail)
    expect(arg.html).toContain('Termin dostawy:')
    expect(arg.html).toContain('czw. 25.06.2026, 08:00–12:00')
  })

  it('omits the delivery slot block when there is no slot snapshot (O8)', async () => {
    const { payload, sendEmail } = stubPayload()
    await sendOrderConfirmation(payload, baseOrder)
    expect(capturedEmail(sendEmail).html).not.toContain('Termin dostawy:')
  })

  it('includes the supplier contact phone when the tenant has one (S2.6)', async () => {
    const { payload, sendEmail } = stubPayload({ settings: { contactPhone: '58 123 45 67' } })
    await sendOrderConfirmation(payload, baseOrder)

    const arg = capturedEmail(sendEmail)
    expect(arg.html).toContain('Kontakt do dostawcy:')
    expect(arg.html).toContain('58 123 45 67')
  })

  it('omits the contact block when the tenant has no phone', async () => {
    const { payload, sendEmail } = stubPayload({ settings: { contactPhone: null } })
    await sendOrderConfirmation(payload, baseOrder)
    expect(capturedEmail(sendEmail).html).not.toContain('Kontakt do dostawcy:')
  })

  it('does not send when there is no customer email', async () => {
    const { payload, sendEmail } = stubPayload()
    await sendOrderConfirmation(payload, { ...baseOrder, customerEmail: null })
    expect(sendEmail).not.toHaveBeenCalled()
  })
})

describe('sendStatusChange builder', () => {
  it('sends a status email with the Polish status label in subject and body (S2.6)', async () => {
    const { payload, sendEmail } = stubPayload()
    await sendStatusChange(payload, { ...baseOrder, status: 'confirmed' })

    const arg = capturedEmail(sendEmail)
    expect(arg.to).toBe('klient@example.com')
    expect(arg.subject).toContain('Potwierdzone')
    expect(arg.html).toContain('Potwierdzone')
    expect(arg.html).toContain('Status Twojego zamówienia')
  })
})

// Live SMTP smoke test — cannot be asserted in CI (needs real credentials + network +
// an inbox to verify delivery). Kept as a documented, skipped placeholder. Run manually
// by un-skipping with valid EMAIL_* env vars if you need to verify the transport.
describe.skip('live SMTP smoke test (manual only)', () => {
  it('actually delivers an email via the configured transport', () => {
    // intentionally empty — see comment above
  })
})
