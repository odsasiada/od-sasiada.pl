import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ResetPasswordForm } from '@/components/shop/ResetPasswordForm'
import { getTenantBySlug } from '@/lib/shop'

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { tenant: slug } = await params
  const { token } = await searchParams
  const tenant = await getTenantBySlug(slug)

  if (!tenant) {
    notFound()
  }

  return (
    <main className='shop-main'>
      <Link className='shop-back' href={`/${slug}`}>
        ← Wróć do sklepu
      </Link>
      <h1 className='shop-h1'>Reset hasła</h1>
      <ResetPasswordForm slug={tenant.slug} token={token ?? ''} />
    </main>
  )
}
