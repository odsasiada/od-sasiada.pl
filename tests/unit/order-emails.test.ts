import type { BasePayload } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import { sendOrderConfirmation, sendStatusChange } from '@/ecommerce/order-emails'

/**
 * Order email builders (S1.7) — ports `src/spike-email.ts`, but WITHOUT live SMTP.
 *
 * The old spike sent a real email to prove SMTP credentials worked; that cannot be asserted
 * in CI. Instead we capture `payload.sendEmail(...)` with a stub and assert the builders
 * produce the right subject / recipient / content. A live-SMTP smoke test is intentionally
 * skipped below (see the `describe.skip`).
 */

const stubPayload = () => {
  const sendEmail = vi.fn(async () => undefined)
  return { payload: { sendEmail } as unknown as BasePayload, sendEmail }
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
}

describe('sendOrderConfirmation builder', () => {
  it('sends to the customer with order number in subject and a formatted PLN total', async () => {
    const { payload, sendEmail } = stubPayload()
    await sendOrderConfirmation(payload, baseOrder)

    expect(sendEmail).toHaveBeenCalledTimes(1)
    const arg = sendEmail.mock.calls[0][0] as { html: string; subject: string; to: string }
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

  it('does not send when there is no customer email', async () => {
    const { payload, sendEmail } = stubPayload()
    await sendOrderConfirmation(payload, { ...baseOrder, customerEmail: null })
    expect(sendEmail).not.toHaveBeenCalled()
  })
})

describe('sendStatusChange builder', () => {
  it('sends a status email with the human label in subject', async () => {
    const { payload, sendEmail } = stubPayload()
    await sendStatusChange(payload, { ...baseOrder, status: 'confirmed' })

    expect(sendEmail).toHaveBeenCalledTimes(1)
    const arg = sendEmail.mock.calls[0][0] as { html: string; subject: string; to: string }
    expect(arg.to).toBe('klient@example.com')
    expect(arg.subject).toContain('Confirmed')
    expect(arg.html).toContain('Confirmed')
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
