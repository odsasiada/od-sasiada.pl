'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

import { loginCustomer, registerCustomer, requestPasswordReset } from '@/app/(frontend)/[tenant]/account-actions'

type Mode = 'forgot' | 'login' | 'register'

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
      setInfo('If the account exists, we sent an email with a password reset link.')
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
    <div className='account-box'>
      <div className='tabs'>
        <button className={mode === 'login' ? 'tab active' : 'tab'} onClick={() => switchMode('login')} type='button'>
          Log in
        </button>
        <button
          className={mode === 'register' ? 'tab active' : 'tab'}
          onClick={() => switchMode('register')}
          type='button'
        >
          Register
        </button>
      </div>

      {error && <div className='alert alert-error'>{error}</div>}
      {info && <div className='alert alert-ok'>{info}</div>}

      <form onSubmit={onSubmit}>
        {mode === 'register' && (
          <>
            <div className='field'>
              <label htmlFor='firstName'>First name</label>
              <input id='firstName' onChange={set('firstName')} required value={form.firstName} />
            </div>
            <div className='field'>
              <label htmlFor='lastName'>Last name</label>
              <input id='lastName' onChange={set('lastName')} required value={form.lastName} />
            </div>
            <div className='field'>
              <label htmlFor='phone'>Phone</label>
              <input id='phone' onChange={set('phone')} required value={form.phone} />
            </div>
          </>
        )}
        <div className='field'>
          <label htmlFor='email'>E-mail</label>
          <input id='email' onChange={set('email')} required type='email' value={form.email} />
        </div>
        {mode !== 'forgot' && (
          <div className='field'>
            <label htmlFor='password'>Password</label>
            <input
              id='password'
              minLength={8}
              onChange={set('password')}
              required
              type='password'
              value={form.password}
            />
          </div>
        )}
        <button className='btn-primary' disabled={busy} type='submit'>
          {busy
            ? 'Please wait…'
            : mode === 'login'
              ? 'Log in'
              : mode === 'register'
                ? 'Create account'
                : 'Send reset link'}
        </button>
      </form>

      {mode === 'login' && (
        <button className='link-button' onClick={() => switchMode('forgot')} style={{ marginTop: 12 }} type='button'>
          Forgot your password?
        </button>
      )}
      {mode === 'forgot' && (
        <button className='link-button' onClick={() => switchMode('login')} style={{ marginTop: 12 }} type='button'>
          ← Back to log in
        </button>
      )}
    </div>
  )
}
