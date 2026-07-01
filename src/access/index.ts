import type { Access, FieldAccess } from 'payload'

/**
 * "Admin" = panel user (collection `users`: platform-admin / tenant-admin).
 * Shop customers live in a separate `customers` collection.
 */
export const isAdmin: Access = ({ req: { user } }) => user?.collection === 'users'

export const adminOnlyFieldAccess: FieldAccess = ({ req: { user } }) => user?.collection === 'users'

export const isAuthenticated: Access = ({ req: { user } }) => Boolean(user)

export const isCustomer: FieldAccess = ({ req: { user } }) => user?.collection === 'customers'

export const publicAccess: Access = () => true

/**
 * Media read (S4.6 / R-S3.2): public ONLY for static file serving (storefront `<img>` hits
 * `/api/media/file/<name>` — Payload sets `isReadingStaticFile` there, see uploads/checkFileAccess).
 * Metadata list/find (`GET /api/media`) is admin-only, so anonymous callers cannot enumerate
 * cross-tenant media. Storefront catalog reads populate media via `overrideAccess:true`, so this
 * does not affect image rendering.
 */
export const mediaRead: Access = ({ isReadingStaticFile, req: { user } }) => {
  if (isReadingStaticFile) {
    return true
  }
  return user?.collection === 'users'
}

/** Published products/content are publicly visible; admin sees everything. */
export const adminOrPublishedStatus: Access = ({ req: { user } }) => {
  if (user?.collection === 'users') {
    return true
  }

  return {
    _status: {
      equals: 'published',
    },
  }
}

/** Document owner (customer) sees their own; admin sees everything. */
export const isDocumentOwner: Access = ({ req: { user } }) => {
  if (!user) {
    return false
  }

  if (user.collection === 'users') {
    return true
  }

  return {
    customer: {
      equals: user.id,
    },
  }
}
