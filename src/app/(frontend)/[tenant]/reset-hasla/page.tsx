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
    <main className='container'>
      <Link className='link-back' href={`/${slug}`}>
        ← Back to catalog
      </Link>
      <h1>Reset password</h1>
      <ResetPasswordForm slug={tenant.slug} token={token ?? ''} />
    </main>
  )
}
