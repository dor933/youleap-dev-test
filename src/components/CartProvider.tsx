"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react"
import {
  EMPTY_CART,
  cartReducer,
  getCartCount,
  getCartTotal,
  parseCartState,
} from "@/lib/cart"
import { getVariantPrice } from "@/lib/variants"
import type { CartLine } from "@/types/cart"
import type { Product, ProductVariant } from "@/types/product"

const STORAGE_KEY = "youleap-cart-v1"

type CartContextValue = {
  lines: CartLine[]
  count: number
  total: { amount: number; currencyCode: string } | undefined
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  addItem: (product: Product, variant: ProductVariant, quantity?: number) => void
  removeItem: (variantId: string) => void
  setQuantity: (variantId: string, quantity: number) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) throw new Error("useCart must be used inside a CartProvider")
  return context
}

export default function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, EMPTY_CART)
  const [isOpen, setIsOpen] = useState(false)

  /**
   * The server has no access to localStorage, so the cart starts empty and is
   * restored after mount. Reading it during render would break hydration.
   */
  const [isRestored, setIsRestored] = useState(false)

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    const restored = stored ? parseCartState(stored) : undefined
    if (restored) dispatch({ type: "hydrate", state: restored })
    setIsRestored(true)
  }, [])

  useEffect(() => {
    if (!isRestored) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state, isRestored])

  const addItem = useCallback(
    (product: Product, variant: ProductVariant, quantity = 1) => {
      const price = getVariantPrice(variant)
      if (!price) return

      dispatch({
        type: "add",
        quantity,
        line: {
          variantId: variant.id,
          productId: product.id,
          productTitle: product.title,
          variantTitle: variant.title,
          sku: variant.sku,
          thumbnail: product.thumbnail,
          unitAmount: price.amount,
          currencyCode: price.currency_code,
          maxQuantity: variant.inventory_quantity,
        },
      })
    },
    []
  )

  const value = useMemo<CartContextValue>(
    () => ({
      lines: state.lines,
      count: getCartCount(state),
      total: getCartTotal(state),
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addItem,
      removeItem: (variantId) => dispatch({ type: "remove", variantId }),
      setQuantity: (variantId, quantity) =>
        dispatch({ type: "setQuantity", variantId, quantity }),
      clear: () => dispatch({ type: "clear" }),
    }),
    [state, isOpen, addItem]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
