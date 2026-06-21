'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import { logoutCustomer } from '@/app/(frontend)/[tenant]/account-actions'

export const LogoutButton = ({ slug }: { slug: string }) => {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const onClick = () =>
    startTransition(async () => {
      await logoutCustomer()
      router.push(`/${slug}`)
      router.refresh()
    })

  return (
    <button className='link-button' disabled={pending} onClick={onClick} type='button'>
      {pending ? 'Wylogowywanie…' : 'Wyloguj'}
    </button>
  )
}
