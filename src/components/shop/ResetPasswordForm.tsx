'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { resetPassword } from '@/app/(frontend)/[tenant]/account-actions'

export const ResetPasswordForm = ({ slug, token }: { slug: string; token: string }) => {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<null | string>(null)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  if (!token) {
    return <div className='alert alert-error'>No reset token in the link.</div>
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
    return <div className='alert alert-ok'>Password changed. Logging you in…</div>
  }

  return (
    <form className='account-box' onSubmit={onSubmit}>
      <h2>Set new password</h2>
      {error && <div className='alert alert-error'>{error}</div>}
      <div className='field'>
        <label htmlFor='new-password'>New password</label>
        <input
          id='new-password'
          minLength={8}
          onChange={(e) => setPassword(e.target.value)}
          required
          type='password'
          value={password}
        />
      </div>
      <button className='btn-primary' disabled={busy} type='submit'>
        {busy ? 'Saving…' : 'Change password'}
      </button>
      <Link className='link-button' href={`/${slug}/konto`} style={{ display: 'inline-block', marginTop: 12 }}>
        ← Back to log in
      </Link>
    </form>
  )
}
