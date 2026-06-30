'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { resetPassword } from '@/app/(frontend)/[tenant]/account-actions'
import { Field } from '@/components/shop/ui/Field'
import { Button } from '@/components/ui/button'

export const ResetPasswordForm = ({ slug, token }: { slug: string; token: string }) => {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<null | string>(null)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  if (!token) {
    return <div className='shop-alert shop-alert-error'>Brak tokenu resetu w linku.</div>
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const res = await resetPassword(token, password)
    setBusy(false)
    if (res.ok) {
      setDone(true)
      setTimeout(() => {
        router.push(`/${slug}/moje-zamowienia`)
        router.refresh()
      }, 1200)
    } else {
      setError(res.error)
    }
  }

  if (done) {
    return <div className='shop-alert shop-alert-ok'>Hasło zmienione. Logujemy Cię…</div>
  }

  return (
    <form
      className='max-w-[420px] rounded-[var(--radius-lg)] border border-border-hairline bg-surface-card p-5'
      onSubmit={onSubmit}
    >
      <h2 className='shop-h2'>Ustaw nowe hasło</h2>
      {error ? <div className='shop-alert shop-alert-error'>{error}</div> : null}
      <Field
        id='new-password'
        label='Nowe hasło'
        minLength={8}
        onChange={(e) => setPassword(e.target.value)}
        required
        type='password'
        value={password}
      />
      <Button disabled={busy} type='submit' variant='cta'>
        {busy ? 'Zapisywanie…' : 'Zmień hasło'}
      </Button>
      <Link className='mt-3 inline-block font-semibold text-brand-strong hover:underline' href={`/${slug}/konto`}>
        ← Wróć do logowania
      </Link>
    </form>
  )
}
