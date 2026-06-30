'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

import { loginCustomer, registerCustomer, requestPasswordReset } from '@/app/(frontend)/[tenant]/account-actions'
import { Field } from '@/components/shop/ui/Field'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Mode = 'forgot' | 'login' | 'register'

const TAB = 'flex-1 rounded-md border border-border-hairline py-2 text-sm font-semibold transition-colors'
const TAB_ACTIVE = 'border-brand bg-brand text-white'
const TAB_IDLE = 'bg-surface-page text-text-muted hover:bg-[var(--stone-200)]'

export const AccountForm = ({ slug, tenantId }: { slug: string; tenantId: number }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<Mode>('login')
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', password: '', phone: '' })
  const [error, setError] = useState<null | string>(null)
  const [info, setInfo] = useState<null | string>(null)
  const [busy, setBusy] = useState(false)

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value })

  const switchMode = (m: Mode) => {
    setMode(m)
    setError(null)
    setInfo(null)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setBusy(true)

    if (mode === 'forgot') {
      await requestPasswordReset(form.email)
      setBusy(false)
      setInfo('Jeśli konto istnieje, wysłaliśmy e-mail z linkiem do zresetowania hasła.')
      return
    }

    const result =
      mode === 'login'
        ? await loginCustomer(tenantId, { email: form.email, password: form.password })
        : await registerCustomer(tenantId, form)
    setBusy(false)
    if (result.ok) {
      // Return-to intent: forced login from checkout carries ?next=… → bounce back there
      // (cart survives — it lives server-side on the carts row). Only allow same-app paths.
      const next = searchParams.get('next')
      const dest = next?.startsWith('/') ? next : `/${slug}/moje-zamowienia`
      router.push(dest)
      router.refresh()
    } else {
      setError(result.error)
    }
  }

  return (
    <div className='max-w-[420px] rounded-[var(--radius-lg)] border border-border-hairline bg-surface-card p-5'>
      <div className='mb-4 flex gap-2'>
        <button
          className={cn(TAB, mode === 'login' ? TAB_ACTIVE : TAB_IDLE)}
          onClick={() => switchMode('login')}
          type='button'
        >
          Zaloguj się
        </button>
        <button
          className={cn(TAB, mode === 'register' ? TAB_ACTIVE : TAB_IDLE)}
          onClick={() => switchMode('register')}
          type='button'
        >
          Załóż konto
        </button>
      </div>

      {error ? <div className='shop-alert shop-alert-error'>{error}</div> : null}
      {info ? <div className='shop-alert shop-alert-ok'>{info}</div> : null}

      <form onSubmit={onSubmit}>
        {mode === 'register' ? (
          <>
            <Field id='firstName' label='Imię' onChange={set('firstName')} required value={form.firstName} />
            <Field id='lastName' label='Nazwisko' onChange={set('lastName')} required value={form.lastName} />
            <Field id='phone' label='Telefon' onChange={set('phone')} required value={form.phone} />
          </>
        ) : null}
        <Field id='email' label='E-mail' onChange={set('email')} required type='email' value={form.email} />
        {mode !== 'forgot' ? (
          <Field
            id='password'
            label='Hasło'
            minLength={8}
            onChange={set('password')}
            required
            type='password'
            value={form.password}
          />
        ) : null}
        <Button disabled={busy} type='submit' variant='cta'>
          {busy
            ? 'Proszę czekać…'
            : mode === 'login'
              ? 'Zaloguj się'
              : mode === 'register'
                ? 'Załóż konto'
                : 'Wyślij link resetujący'}
        </Button>
      </form>

      {mode === 'login' ? (
        <Button
          className='mt-3 px-0 text-brand-strong'
          onClick={() => switchMode('forgot')}
          type='button'
          variant='link'
        >
          Nie pamiętasz hasła?
        </Button>
      ) : null}
      {mode === 'forgot' ? (
        <Button
          className='mt-3 px-0 text-brand-strong'
          onClick={() => switchMode('login')}
          type='button'
          variant='link'
        >
          ← Wróć do logowania
        </Button>
      ) : null}
    </div>
  )
}
