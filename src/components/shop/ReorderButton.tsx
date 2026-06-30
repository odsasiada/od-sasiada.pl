'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { reorder } from '@/app/(frontend)/[tenant]/actions'
import { Button } from '@/components/ui/button'

export const ReorderButton = ({ orderId, slug, tenantId }: { orderId: number; slug: string; tenantId: number }) => {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<null | string>(null)

  // REPLACE semantics: reorder writes the order's items into the SERVER cart (clearing whatever
  // was there), re-priced from the DB. We make the replace obvious by warning before running.
  const onClick = () =>
    startTransition(async () => {
      setError(null)
      if (!window.confirm('Zamówienie ponowne zastąpi obecną zawartość koszyka. Kontynuować?')) {
        return
      }
      const result = await reorder(tenantId, orderId)
      if (!result.ok) {
        setError(result.error)
        return
      }
      if (result.skipped > 0) {
        window.alert(`Koszyk zastąpiony. Pominięto ${result.skipped} niedostępnych pozycji.`)
      }
      router.push(`/${slug}/koszyk`)
      router.refresh()
    })

  return (
    <div className='mt-3 flex items-center gap-2'>
      <Button disabled={pending} onClick={onClick} type='button' variant='cta'>
        {pending ? 'Dodawanie…' : '↻ Zamów ponownie'}
      </Button>
      {error ? <span className='text-xs text-[color:var(--state-error)]'>{error}</span> : null}
    </div>
  )
}
