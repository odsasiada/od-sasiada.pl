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
