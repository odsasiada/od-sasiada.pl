'use client'

import type { AvailableSlot } from '@/lib/delivery-slots'

import Link from 'next/link'
import { useState } from 'react'

import { type Contact, placeOrder } from '@/app/(frontend)/[tenant]/actions'
import { useCart } from '@/components/shop/cart-store'
import { Field } from '@/components/shop/ui/Field'
import { QuantityStepper } from '@/components/shop/ui/QuantityStepper'
import { Select } from '@/components/shop/ui/Select'
import { Button } from '@/components/ui/button'
import { formatSlotLabel } from '@/lib/delivery-slots'
import { formatPLN, type SavedAddress } from '@/lib/money'

const EMPTY_CONTACT: Contact = {
  addressLine1: '',
  city: '',
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  postalCode: '',
}

/** Encodes a slot occurrence as "id__date" so the <select> value carries BOTH (S2.4 needs date). */
const slotValue = (slot: AvailableSlot): string => `${slot.id}__${slot.date}`

export const CartView = ({
  addresses = [],
  availableSlots = [],
  deliveryEnabled = false,
  minOrderValue,
  slug,
  tenantId,
}: {
  addresses?: SavedAddress[]
  availableSlots?: AvailableSlot[]
  deliveryEnabled?: boolean
  minOrderValue: number
  slug: string
  tenantId: number
}) => {
  const { clear, isLoggedIn, items, remove, requireLogin, setQuantity, total } = useCart()
  const [contact, setContact] = useState<Contact>(EMPTY_CONTACT)
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; id: AvailableSlot['id'] } | null>(null)

  const applyAddress = (id: string) => {
    const a = addresses.find((x) => String(x.id) === id)
    if (a) {
      setContact({
        addressLine1: a.addressLine1,
        city: a.city,
        email: contact.email,
        firstName: a.firstName,
        lastName: a.lastName,
        phone: a.phone,
        postalCode: a.postalCode,
      })
    }
  }
  const [error, setError] = useState<null | string>(null)
  const [orderNumber, setOrderNumber] = useState<null | string>(null)
  const [submitting, setSubmitting] = useState(false)

  const belowMin = total < minOrderValue

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoggedIn) {
      requireLogin()
      return
    }
    setError(null)
    setSubmitting(true)
    // Items + total come from the SERVER cart (carts row), not from this request body.
    // selectedSlot is carried to placeOrder (S2.2); server-side cutoff/capacity validation is S2.3/S2.7.
    const result = await placeOrder(
      tenantId,
      contact,
      selectedSlot ? { date: selectedSlot.date, id: Number(selectedSlot.id) } : undefined,
    )
    setSubmitting(false)
    if (result.ok) {
      setOrderNumber(result.orderNumber)
      clear()
    } else {
      setError(result.error)
    }
  }

  if (orderNumber) {
    return (
      <main className='shop-main'>
        <div className='shop-alert shop-alert-ok'>
          <strong>Dziękujemy! Zamówienie {orderNumber} zostało złożone.</strong>
          <p className='mt-1'>Zadzwonimy, aby potwierdzić dostawę. Płatność gotówką przy odbiorze.</p>
        </div>
        <Link className='shop-back' href={`/${slug}`}>
          ← Wróć do sklepu
        </Link>
      </main>
    )
  }

  return (
    <main className='shop-main'>
      <Link className='shop-back' href={`/${slug}`}>
        ← Wróć do sklepu
      </Link>
      <h1 className='shop-h1'>Twój koszyk</h1>

      {items.length === 0 ? (
        <p className='text-text-muted'>Koszyk jest pusty.</p>
      ) : (
        <>
          {items.map((i) => (
            <div className='flex items-center justify-between gap-3 border-b border-border-hairline py-3' key={i.key}>
              <div>
                <div className='font-semibold text-text-body'>{i.title}</div>
                {i.variantLabel ? (
                  <div className='text-xs text-text-muted'>{i.variantLabel.replace(`${i.title} — `, '')}</div>
                ) : null}
                <div className='text-xs text-text-muted'>{formatPLN(i.priceInPLN)} / szt.</div>
              </div>
              <QuantityStepper onChange={(next) => setQuantity(i.key, next)} value={i.quantity} />
              <div className='flex items-center gap-2'>
                <strong className='tabular-nums'>{formatPLN(i.priceInPLN * i.quantity)}</strong>
                <Button
                  aria-label='Usuń pozycję'
                  onClick={() => remove(i.key)}
                  size='icon-sm'
                  type='button'
                  variant='ghost'
                >
                  🗑
                </Button>
              </div>
            </div>
          ))}

          <div className='my-4 flex justify-between text-[length:var(--text-lg)] font-bold'>
            <span>Razem</span>
            <span className='tabular-nums'>{formatPLN(total)}</span>
          </div>

          {belowMin ? (
            <div className='shop-alert shop-alert-error'>
              Minimalna wartość zamówienia to {formatPLN(minOrderValue)}. Brakuje jeszcze{' '}
              {formatPLN(minOrderValue - total)}.
            </div>
          ) : null}

          <h2 className='shop-h2 mt-6'>Dane do dostawy</h2>
          {!isLoggedIn ? (
            <div className='shop-alert shop-alert-error'>
              <strong>Zaloguj się, aby złożyć zamówienie.</strong>
              <p className='mt-2'>
                <Button onClick={() => requireLogin()} type='button' variant='cta'>
                  Zaloguj się i wróć do koszyka
                </Button>
              </p>
            </div>
          ) : (
            <>
              {addresses.length > 0 ? (
                <div className='mb-3 flex flex-col gap-1.5'>
                  <label className='text-sm text-text-muted' htmlFor='saved-address'>
                    Wybierz zapisany adres
                  </label>
                  <Select defaultValue='' id='saved-address' onChange={(e) => applyAddress(e.target.value)}>
                    <option value=''>— nowy adres —</option>
                    {addresses.map((a) => (
                      <option key={a.id} value={String(a.id)}>
                        {a.title ? `${a.title}: ` : ''}
                        {a.addressLine1}, {a.postalCode} {a.city}
                      </option>
                    ))}
                  </Select>
                </div>
              ) : null}
              {deliveryEnabled ? (
                availableSlots.length === 0 ? (
                  <div className='shop-alert shop-alert-error'>
                    Brak dostępnych terminów dostawy — skontaktuj się z dostawcą.
                  </div>
                ) : (
                  <div className='mb-3 flex flex-col gap-1.5'>
                    <label className='text-sm text-text-muted' htmlFor='delivery-slot'>
                      Termin dostawy
                    </label>
                    <Select
                      id='delivery-slot'
                      onChange={(e) => {
                        const picked = availableSlots.find((s) => slotValue(s) === e.target.value)
                        setSelectedSlot(picked ? { date: picked.date, id: picked.id } : null)
                      }}
                      value={selectedSlot ? `${selectedSlot.id}__${selectedSlot.date}` : ''}
                    >
                      <option value=''>— wybierz termin —</option>
                      {availableSlots.map((s) => (
                        <option key={slotValue(s)} value={slotValue(s)}>
                          {formatSlotLabel(s)}
                        </option>
                      ))}
                    </Select>
                  </div>
                )
              ) : null}
              {error ? <div className='shop-alert shop-alert-error'>{error}</div> : null}
              <form onSubmit={onSubmit}>
                <Field
                  id='firstName'
                  label='Imię'
                  onChange={(e) => setContact({ ...contact, firstName: e.target.value })}
                  required
                  value={contact.firstName}
                />
                <Field
                  id='lastName'
                  label='Nazwisko'
                  onChange={(e) => setContact({ ...contact, lastName: e.target.value })}
                  required
                  value={contact.lastName}
                />
                <Field
                  id='phone'
                  label='Telefon'
                  onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                  required
                  value={contact.phone}
                />
                <Field
                  id='addressLine1'
                  label='Adres (ulica i numer)'
                  onChange={(e) => setContact({ ...contact, addressLine1: e.target.value })}
                  required
                  value={contact.addressLine1}
                />
                <Field
                  id='postalCode'
                  label='Kod pocztowy'
                  onChange={(e) => setContact({ ...contact, postalCode: e.target.value })}
                  required
                  value={contact.postalCode}
                />
                <Field
                  id='city'
                  label='Miejscowość'
                  onChange={(e) => setContact({ ...contact, city: e.target.value })}
                  required
                  value={contact.city}
                />
                <Field
                  id='email'
                  label='E-mail'
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  optional
                  type='email'
                  value={contact.email}
                />
                <Button
                  disabled={belowMin || submitting || (deliveryEnabled && !selectedSlot)}
                  type='submit'
                  variant='cta'
                >
                  {submitting ? 'Składanie zamówienia…' : 'Zamawiam (gotówka przy odbiorze)'}
                </Button>
              </form>
            </>
          )}
        </>
      )}
    </main>
  )
}
