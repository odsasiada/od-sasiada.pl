'use client'

import type { AddressInput, SavedAddress } from '@/lib/money'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { deleteAddress, saveAddress } from '@/app/(frontend)/[tenant]/address-actions'

const EMPTY: AddressInput = {
  addressLine1: '',
  city: '',
  firstName: '',
  lastName: '',
  phone: '',
  postalCode: '',
  title: '',
}

export const AddressBook = ({ addresses, tenantId }: { addresses: SavedAddress[]; tenantId: number }) => {
  const router = useRouter()
  const [form, setForm] = useState<AddressInput>(EMPTY)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<null | string>(null)
  const [pending, startTransition] = useTransition()

  const set = (key: keyof AddressInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value })

  const onSave = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await saveAddress(tenantId, form)
      if (res.ok) {
        setForm(EMPTY)
        setAdding(false)
        router.refresh()
      } else {
        setError(res.error)
      }
    })
  }

  const onDelete = (id: number) =>
    startTransition(async () => {
      await deleteAddress(tenantId, id)
      router.refresh()
    })

  return (
    <section className='address-book'>
      <h2>My delivery addresses</h2>

      {addresses.length === 0 && !adding && <p className='empty'>No saved addresses yet.</p>}

      {addresses.map((a) => (
        <div className='address-card' key={a.id}>
          <div>
            {a.title && <div className='cart-name'>{a.title}</div>}
            <div>
              {a.firstName} {a.lastName}, tel. {a.phone}
            </div>
            <div className='cart-variant'>
              {a.addressLine1}, {a.postalCode} {a.city}
            </div>
          </div>
          <button className='link-button' disabled={pending} onClick={() => onDelete(a.id)} type='button'>
            Delete
          </button>
        </div>
      ))}

      {adding ? (
        <form className='address-form' onSubmit={onSave}>
          {error && <div className='alert alert-error'>{error}</div>}
          <div className='field'>
            <label htmlFor='a-title'>Address label (e.g. Home)</label>
            <input id='a-title' onChange={set('title')} value={form.title ?? ''} />
          </div>
          <div className='field'>
            <label htmlFor='a-firstName'>First name</label>
            <input id='a-firstName' onChange={set('firstName')} required value={form.firstName} />
          </div>
          <div className='field'>
            <label htmlFor='a-lastName'>Last name</label>
            <input id='a-lastName' onChange={set('lastName')} required value={form.lastName} />
          </div>
          <div className='field'>
            <label htmlFor='a-phone'>Phone</label>
            <input id='a-phone' onChange={set('phone')} required value={form.phone} />
          </div>
          <div className='field'>
            <label htmlFor='a-line1'>Address (street & number)</label>
            <input id='a-line1' onChange={set('addressLine1')} required value={form.addressLine1} />
          </div>
          <div className='field'>
            <label htmlFor='a-postal'>Postal code</label>
            <input id='a-postal' onChange={set('postalCode')} placeholder='83-300' required value={form.postalCode} />
          </div>
          <div className='field'>
            <label htmlFor='a-city'>City</label>
            <input id='a-city' onChange={set('city')} required value={form.city} />
          </div>
          <div className='reorder'>
            <button className='btn-primary' disabled={pending} type='submit'>
              {pending ? 'Saving…' : 'Save address'}
            </button>
            <button className='link-button' onClick={() => setAdding(false)} type='button'>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button className='btn-primary' onClick={() => setAdding(true)} type='button'>
          + Add address
        </button>
      )}
    </section>
  )
}
