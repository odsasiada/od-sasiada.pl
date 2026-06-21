'use client'

import type { CartLine, CartSnapshot } from '@/lib/money'

import { usePathname, useRouter } from 'next/navigation'
import { createContext, type ReactNode, useContext, useMemo, useOptimistic, useState, useTransition } from 'react'

import { addToCart, clearCart, removeItem, updateQty } from '@/app/(frontend)/[tenant]/cart-actions'

// Thin client wrapper over the SERVER cart (carts collection). No localStorage — the cart lives
// in the DB, scoped to the logged-in customer + tenant. Mutations call the 'use server' actions
// in cart-actions.ts (which validate price + tenant server-side), then router.refresh() reloads
// the server-rendered snapshot. We keep the exact useCart() surface the components expect.

type AddInput = {
  priceInPLN: number
  productId: number
  title: string
  variantId: null | number
  variantLabel: null | string
}

type CartContextValue = {
  add: (item: AddInput, quantity?: number) => void
  busy: boolean
  clear: () => void
  count: number
  error: null | string
  isLoggedIn: boolean
  items: CartLine[]
  remove: (key: string) => void
  requireLogin: () => void
  setQuantity: (key: string, quantity: number) => void
  total: number
}

const CartContext = createContext<CartContextValue | null>(null)

const keyOf = (productId: number, variantId: null | number) => `${productId}:${variantId ?? ''}`

const computeTotals = (items: CartLine[]) => ({
  count: items.reduce((n, i) => n + i.quantity, 0),
  total: items.reduce((sum, i) => sum + i.priceInPLN * i.quantity, 0),
})

export const CartProvider = ({
  children,
  initial,
  isLoggedIn,
  slug,
  tenantId,
}: {
  children: ReactNode
  initial: CartSnapshot
  isLoggedIn: boolean
  slug: string
  tenantId: number
}) => {
  const router = useRouter()
  const pathname = usePathname()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<null | string>(null)

  // Optimistic items, reconciled with the server `initial` on every refresh.
  const [optimisticItems, applyOptimistic] = useOptimistic<CartLine[], CartLine[]>(initial.items, (_, next) => next)

  const value = useMemo<CartContextValue>(() => {
    const requireLogin = () => {
      router.push(`/${slug}/konto?next=${encodeURIComponent(pathname)}`)
    }

    const run = (
      optimistic: (items: CartLine[]) => CartLine[],
      action: () => Promise<{ error: string; ok: false } | { ok: true }>,
    ) => {
      if (!isLoggedIn) {
        requireLogin()
        return
      }
      setError(null)
      startTransition(async () => {
        applyOptimistic(optimistic(optimisticItems))
        const result = await action()
        if (!result.ok) {
          setError(result.error)
        }
        router.refresh()
      })
    }

    const add: CartContextValue['add'] = (item, quantity = 1) => {
      const key = keyOf(item.productId, item.variantId)
      run(
        (items) => {
          const existing = items.find((i) => i.key === key)
          return existing
            ? items.map((i) => (i.key === key ? { ...i, quantity: i.quantity + quantity } : i))
            : [...items, { ...item, key, quantity }]
        },
        () => addToCart(tenantId, { productId: item.productId, quantity, variantId: item.variantId }),
      )
    }

    const setQuantity: CartContextValue['setQuantity'] = (key, quantity) => {
      run(
        (items) =>
          quantity < 1
            ? items.filter((i) => i.key !== key)
            : items.map((i) => (i.key === key ? { ...i, quantity } : i)),
        () => updateQty(tenantId, key, quantity),
      )
    }

    const remove: CartContextValue['remove'] = (key) => {
      run(
        (items) => items.filter((i) => i.key !== key),
        () => removeItem(tenantId, key),
      )
    }

    const clear: CartContextValue['clear'] = () => {
      run(
        () => [],
        () => clearCart(tenantId),
      )
    }

    const { count, total } = computeTotals(optimisticItems)
    return {
      add,
      busy: pending,
      clear,
      count,
      error,
      isLoggedIn,
      items: optimisticItems,
      remove,
      requireLogin,
      setQuantity,
      total,
    }
  }, [applyOptimistic, error, isLoggedIn, optimisticItems, pathname, pending, router, slug, tenantId])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = (): CartContextValue => {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart musi być użyty wewnątrz <CartProvider>')
  }
  return ctx
}
