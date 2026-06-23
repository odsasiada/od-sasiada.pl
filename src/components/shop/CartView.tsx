'use client'

import type { AvailableSlot } from '@/lib/delivery-slots'

import Link from 'next/link'
import { useState } from 'react'

import { type Contact, placeOrder } from '@/app/(frontend)/[tenant]/actions'
import { useCart } from '@/components/shop/cart-store'
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
      <main className='container'>
        <div className='alert alert-ok'>
          <strong>Thank you! Order {orderNumber} has been placed.</strong>
          <p>We will call to confirm delivery. Payment by cash/bank transfer on delivery.</p>
        </div>
        <Link className='link-back' href={`/${slug}`}>
          ← Back to catalog
        </Link>
      </main>
    )
  }

  return (
    <main className='container'>
      <Link className='link-back' href={`/${slug}`}>
        ← Back to catalog
      </Link>
      <h1>Your cart</h1>

      {items.length === 0 ? (
        <p className='empty'>Cart is empty.</p>
      ) : (
        <>
          {items.map((i) => (
            <div className='cart-row' key={i.key}>
              <div>
                <div className='cart-name'>{i.title}</div>
                {i.variantLabel && <div className='cart-variant'>{i.variantLabel.replace(`${i.title} — `, '')}</div>}
                <div className='cart-variant'>{formatPLN(i.priceInPLN)} / pcs.</div>
              </div>
              <div className='qty'>
                <button onClick={() => setQuantity(i.key, i.quantity - 1)} type='button'>
                  −
                </button>
                <span>{i.quantity}</span>
                <button onClick={() => setQuantity(i.key, i.quantity + 1)} type='button'>
                  +
                </button>
              </div>
              <div>
                <strong>{formatPLN(i.priceInPLN * i.quantity)}</strong>{' '}
                <button className='qty' onClick={() => remove(i.key)} type='button'>
                  🗑
                </button>
              </div>
            </div>
          ))}

          <div className='cart-summary'>
            <span>Total</span>
            <span>{formatPLN(total)}</span>
          </div>

          {belowMin && (
            <div className='alert alert-error'>
              Minimum order value is {formatPLN(minOrderValue)}. You need {formatPLN(minOrderValue - total)} more.
            </div>
          )}

          <h2>Delivery details</h2>
          {!isLoggedIn ? (
            <div className='alert alert-error'>
              <strong>Zaloguj się, aby złożyć zamówienie.</strong>
              <p>
                <button className='btn-primary' onClick={() => requireLogin()} type='button'>
                  Zaloguj się i wróć do koszyka
                </button>
              </p>
            </div>
          ) : (
            <>
              {addresses.length > 0 && (
                <div className='field'>
                  <label htmlFor='saved-address'>Choose a saved address</label>
                  <select
                    className='variant-select'
                    defaultValue=''
                    id='saved-address'
                    onChange={(e) => applyAddress(e.target.value)}
                  >
                    <option value=''>— new address —</option>
                    {addresses.map((a) => (
                      <option key={a.id} value={String(a.id)}>
                        {a.title ? `${a.title}: ` : ''}
                        {a.addressLine1}, {a.postalCode} {a.city}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {deliveryEnabled &&
                (availableSlots.length === 0 ? (
                  <div className='alert alert-error'>Brak dostępnych terminów dostawy — skontaktuj się z dostawcą.</div>
                ) : (
                  <div className='field'>
                    <label htmlFor='delivery-slot'>Termin dostawy</label>
                    <select
                      className='variant-select'
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
                    </select>
                  </div>
                ))}
              {error && <div className='alert alert-error'>{error}</div>}
              <form onSubmit={onSubmit}>
                <div className='field'>
                  <label htmlFor='firstName'>First name</label>
                  <input
                    id='firstName'
                    onChange={(e) => setContact({ ...contact, firstName: e.target.value })}
                    required
                    value={contact.firstName}
                  />
                </div>
                <div className='field'>
                  <label htmlFor='lastName'>Last name</label>
                  <input
                    id='lastName'
                    onChange={(e) => setContact({ ...contact, lastName: e.target.value })}
                    required
                    value={contact.lastName}
                  />
                </div>
                <div className='field'>
                  <label htmlFor='phone'>Phone</label>
                  <input
                    id='phone'
                    onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                    required
                    value={contact.phone}
                  />
                </div>
                <div className='field'>
                  <label htmlFor='addressLine1'>Address (street & number)</label>
                  <input
                    id='addressLine1'
                    onChange={(e) => setContact({ ...contact, addressLine1: e.target.value })}
                    required
                    value={contact.addressLine1}
                  />
                </div>
                <div className='field'>
                  <label htmlFor='postalCode'>Postal code</label>
                  <input
                    id='postalCode'
                    onChange={(e) => setContact({ ...contact, postalCode: e.target.value })}
                    required
                    value={contact.postalCode}
                  />
                </div>
                <div className='field'>
                  <label htmlFor='city'>City</label>
                  <input
                    id='city'
                    onChange={(e) => setContact({ ...contact, city: e.target.value })}
                    required
                    value={contact.city}
                  />
                </div>
                <div className='field'>
                  <label htmlFor='email'>Email (optional)</label>
                  <input
                    id='email'
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    type='email'
                    value={contact.email}
                  />
                </div>
                <button
                  className='btn-primary'
                  disabled={belowMin || submitting || (deliveryEnabled && !selectedSlot)}
                  type='submit'
                >
                  {submitting ? 'Placing order…' : 'Place order (cash on delivery)'}
                </button>
              </form>
            </>
          )}
        </>
      )}
    </main>
  )
}
