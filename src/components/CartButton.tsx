"use client"

import { ShoppingCart } from "lucide-react"
import { useCart } from "./CartProvider"

export default function CartButton() {
  const { count, openCart } = useCart()

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Open cart, ${count} ${count === 1 ? "item" : "items"}`}
      className="relative rounded-md p-2 text-gray-700 transition-colors hover:bg-gray-100 hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
    >
      <ShoppingCart className="size-5" aria-hidden="true" />

      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-black px-1.5 text-xs font-medium text-white">
          {count}
        </span>
      )}
    </button>
  )
}
