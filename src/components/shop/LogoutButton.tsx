'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import { logoutCustomer } from '@/app/(frontend)/[tenant]/account-actions'
import { Button } from '@/components/ui/button'

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
    <Button className='px-0 text-brand-strong' disabled={pending} onClick={onClick} type='button' variant='link'>
      {pending ? 'Wylogowywanie…' : 'Wyloguj'}
    </Button>
  )
}
