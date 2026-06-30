import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AccountForm } from '@/components/shop/AccountForm'
import { AddressBook } from '@/components/shop/AddressBook'
import { LogoutButton } from '@/components/shop/LogoutButton'
import { getCustomerAddresses } from '@/lib/addresses'
import { getCurrentCustomer } from '@/lib/auth'
import { getTenantBySlug } from '@/lib/shop'

export default async function AccountPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: slug } = await params
  const tenant = await getTenantBySlug(slug)

  if (!tenant) {
    notFound()
  }

  const customer = await getCurrentCustomer(tenant.id)
  const addresses = customer ? await getCustomerAddresses(tenant.id) : []

  return (
    <main className='shop-main'>
      <Link className='shop-back' href={`/${slug}`}>
        ← Wróć do sklepu
      </Link>
      <h1 className='shop-h1'>Twoje konto</h1>

      {customer ? (
        <div className='max-w-[420px] rounded-[var(--radius-lg)] border border-border-hairline bg-surface-card p-5'>
          <p>
            Zalogowano jako{' '}
            <strong>
              {customer.firstName} {customer.lastName}
            </strong>{' '}
            ({customer.email}).
          </p>
          <p className='mt-2'>
            <Link className='font-semibold text-brand-strong hover:underline' href={`/${slug}/moje-zamowienia`}>
              Moje zamówienia →
            </Link>
          </p>
          <div className='mt-2'>
            <LogoutButton slug={slug} />
          </div>
        </div>
      ) : (
        <AccountForm slug={slug} tenantId={tenant.id} />
      )}

      {customer ? <AddressBook addresses={addresses} tenantId={tenant.id} /> : null}
    </main>
  )
}
