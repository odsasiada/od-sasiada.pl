'use server'

import { cookies } from 'next/headers'
import { getPayload } from 'payload'

import config from '@/payload.config'

export type AuthResult = { error: string; ok: false } | { ok: true }

export type RegisterData = {
  email: string
  firstName: string
  lastName: string
  password: string
  phone: string
}

const COOKIE = 'payload-token'

const setAuthCookie = async (token: string) => {
  const store = await cookies()
  store.set(COOKIE, token, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
}

export const registerCustomer = async (tenantId: number, data: RegisterData): Promise<AuthResult> => {
  const payload = await getPayload({ config })

  try {
    await payload.create({
      collection: 'customers',
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password,
        phone: data.phone,
        tenant: tenantId,
      },
      overrideAccess: true,
    })
  } catch {
    return { error: 'This email is already registered.', ok: false }
  }

  const result = await payload.login({ collection: 'customers', data: { email: data.email, password: data.password } })
  if (result.token) {
    await setAuthCookie(result.token)
  }
  return { ok: true }
}

export const loginCustomer = async (
  tenantId: number,
  credentials: { email: string; password: string },
): Promise<AuthResult> => {
  const payload = await getPayload({ config })

  let result: Awaited<ReturnType<typeof payload.login>>
  try {
    result = await payload.login({ collection: 'customers', data: credentials })
  } catch {
    return { error: 'Invalid email or password.', ok: false }
  }

  const customer = result.user as unknown as { tenant?: number | { id: number } | null }
  const tenant = typeof customer.tenant === 'object' ? customer.tenant?.id : customer.tenant
  if (tenant !== tenantId) {
    return { error: 'This account belongs to a different supplier.', ok: false }
  }

  if (result.token) {
    await setAuthCookie(result.token)
  }
  return { ok: true }
}

export const logoutCustomer = async (): Promise<AuthResult> => {
  const store = await cookies()
  store.delete(COOKIE)
  return { ok: true }
}

/** Sends a password reset email. Always returns ok (does not reveal whether email exists). */
export const requestPasswordReset = async (email: string): Promise<AuthResult> => {
  const payload = await getPayload({ config })
  try {
    await payload.forgotPassword({ collection: 'customers', data: { email } })
  } catch {
    // Intentionally ignored — do not reveal account existence
  }
  return { ok: true }
}

/** Sets a new password from the email token and logs in the customer. */
export const resetPassword = async (token: string, password: string): Promise<AuthResult> => {
  const payload = await getPayload({ config })
  try {
    const result = await payload.resetPassword({
      collection: 'customers',
      data: { password, token },
      overrideAccess: true,
    })
    if (result.token) {
      await setAuthCookie(result.token)
    }
    return { ok: true }
  } catch {
    return { error: 'Reset link is invalid or expired.', ok: false }
  }
}
