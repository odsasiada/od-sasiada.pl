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
    <main className='container'>
      <Link className='link-back' href={`/${slug}`}>
        ← Back to catalog
      </Link>
      <h1>Your account</h1>

      {customer ? (
        <div className='account-box'>
          <p>
            Logged in as{' '}
            <strong>
              {customer.firstName} {customer.lastName}
            </strong>{' '}
            ({customer.email}).
          </p>
          <p>
            <Link className='link-back' href={`/${slug}/moje-zamowienia`}>
              My orders →
            </Link>
          </p>
          <LogoutButton slug={slug} />
        </div>
      ) : (
        <AccountForm slug={slug} tenantId={tenant.id} />
      )}

      {customer && <AddressBook addresses={addresses} tenantId={tenant.id} />}
    </main>
  )
}
