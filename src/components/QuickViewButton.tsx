"use client"

import { useQuickView } from "./QuickViewProvider"
import type { Product } from "@/types/product"

export default function QuickViewButton({ product }: { product: Product }) {
  const { openQuickView } = useQuickView()

  return (
    <button
      type="button"
      onClick={() => openQuickView(product)}
      aria-label={`Quick view: ${product.title}`}
      className="mt-auto w-full rounded-md bg-black py-2 text-sm text-white transition-colors hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
    >
      Quick View
    </button>
  )
}
