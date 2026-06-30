'use client'

import type { AddressInput, SavedAddress } from '@/lib/money'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { deleteAddress, saveAddress } from '@/app/(frontend)/[tenant]/address-actions'
import { Field } from '@/components/shop/ui/Field'
import { Button } from '@/components/ui/button'

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
    <section className='mt-6'>
      <h2 className='shop-h2'>Moje adresy dostawy</h2>

      {addresses.length === 0 && !adding ? <p className='text-text-muted'>Brak zapisanych adresów.</p> : null}

      {addresses.map((a) => (
        <div
          className='mb-3 flex items-start justify-between gap-3 rounded-[var(--radius-lg)] border border-border-hairline bg-surface-card px-4 py-3'
          key={a.id}
        >
          <div>
            {a.title ? <div className='font-semibold text-text-body'>{a.title}</div> : null}
            <div>
              {a.firstName} {a.lastName}, tel. {a.phone}
            </div>
            <div className='text-xs text-text-muted'>
              {a.addressLine1}, {a.postalCode} {a.city}
            </div>
          </div>
          <Button
            className='px-0 text-brand-strong'
            disabled={pending}
            onClick={() => onDelete(a.id)}
            type='button'
            variant='link'
          >
            Usuń
          </Button>
        </div>
      ))}

      {adding ? (
        <form
          className='max-w-[420px] rounded-[var(--radius-lg)] border border-border-hairline bg-surface-card p-4'
          onSubmit={onSave}
        >
          {error ? <div className='shop-alert shop-alert-error'>{error}</div> : null}
          <Field id='a-title' label='Etykieta adresu (np. Dom)' onChange={set('title')} value={form.title ?? ''} />
          <Field id='a-firstName' label='Imię' onChange={set('firstName')} required value={form.firstName} />
          <Field id='a-lastName' label='Nazwisko' onChange={set('lastName')} required value={form.lastName} />
          <Field id='a-phone' label='Telefon' onChange={set('phone')} required value={form.phone} />
          <Field
            id='a-line1'
            label='Adres (ulica i numer)'
            onChange={set('addressLine1')}
            required
            value={form.addressLine1}
          />
          <Field
            id='a-postal'
            label='Kod pocztowy'
            onChange={set('postalCode')}
            placeholder='83-300'
            required
            value={form.postalCode}
          />
          <Field id='a-city' label='Miejscowość' onChange={set('city')} required value={form.city} />
          <div className='flex items-center gap-2'>
            <Button disabled={pending} type='submit' variant='cta'>
              {pending ? 'Zapisywanie…' : 'Zapisz adres'}
            </Button>
            <Button className='text-brand-strong' onClick={() => setAdding(false)} type='button' variant='link'>
              Anuluj
            </Button>
          </div>
        </form>
      ) : (
        <Button onClick={() => setAdding(true)} type='button' variant='cta'>
          + Dodaj adres
        </Button>
      )}
    </section>
  )
}
