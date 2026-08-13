"use client"

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react"
import QuickViewModal from "./QuickViewModal"
import type { Product } from "@/types/product"

type QuickViewContextValue = {
  openQuickView: (product: Product) => void
}

const QuickViewContext = createContext<QuickViewContextValue | null>(null)

export function useQuickView(): QuickViewContextValue {
  const context = useContext(QuickViewContext)
  if (!context) throw new Error("useQuickView must be used inside a QuickViewProvider")
  return context
}

/** Client island: the grid cards stay Server Components via `children`. */
export default function QuickViewProvider({ children }: { children: ReactNode }) {
  const [product, setProduct] = useState<Product | null>(null)

  return (
    <QuickViewContext.Provider value={{ openQuickView: setProduct }}>
      {children}
      {product && (
        <QuickViewModal
          key={product.id}
          product={product}
          onClose={() => setProduct(null)}
        />
      )}
    </QuickViewContext.Provider>
  )
}
