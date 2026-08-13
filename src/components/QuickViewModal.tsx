"use client"

import Image from "next/image"
import { useEffect, useId, useState } from "react"
import Modal from "./Modal"
import VariantSelector from "./VariantSelector"
import VariantSummary from "./VariantSummary"
import { useCart } from "./CartProvider"
import {
  getDefaultSelection,
  resolveVariant,
  type OptionSelection,
} from "@/lib/variants"
import type { Product } from "@/types/product"

type QuickViewModalProps = {
  product: Product
  onClose: () => void
}

const ADDED_CONFIRMATION_MS = 2000

export default function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const { addItem } = useCart()
  const titleId = useId()
  const [selection, setSelection] = useState<OptionSelection>(() =>
    getDefaultSelection(product)
  )
  const [activeImage, setActiveImage] = useState(0)
  const [justAdded, setJustAdded] = useState(false)

  useEffect(() => {
    if (!justAdded) return
    const timer = setTimeout(() => setJustAdded(false), ADDED_CONFIRMATION_MS)
    return () => clearTimeout(timer)
  }, [justAdded])

  const images =
    product.images.length > 0
      ? product.images.map((image) => image.url)
      : [product.thumbnail]

  const resolution = resolveVariant(product, selection)
  const variant = resolution.status === "resolved" ? resolution.variant : undefined
  const canAddToCart = variant !== undefined && variant.inventory_quantity > 0

  const addToCartLabel = canAddToCart
    ? "Add to Cart"
    : variant !== undefined
      ? "Out of stock"
      : "Unavailable"

  function handleAddToCart() {
    if (!variant || !canAddToCart) return
    addItem(product, variant)
    setJustAdded(true)
  }

  return (
    <Modal labelledBy={titleId} onClose={onClose} closeLabel="Close quick view">
      <div className="grid gap-6 p-6 md:grid-cols-2 md:gap-8">
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
            <Image
              src={images[activeImage] ?? images[0]}
              alt={product.title}
              fill
              sizes="(min-width: 768px) 45vw, 90vw"
              className="object-cover"
            />
          </div>

          {images.length > 1 && (
            <ul className="flex gap-2">
              {images.map((url, index) => (
                <li key={url}>
                  <button
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-label={`Show image ${index + 1} of ${images.length}`}
                    aria-current={index === activeImage}
                    className={`relative size-16 overflow-hidden rounded-md border-2 transition-colors ${
                      index === activeImage
                        ? "border-black"
                        : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <Image
                      src={url}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-5">
          <div className="space-y-2 pr-10">
            <h2 id={titleId} className="text-xl font-semibold text-gray-900">
              {product.title}
            </h2>
            <p className="text-sm leading-relaxed text-gray-600">
              {product.description}
            </p>
          </div>

          <VariantSelector
            product={product}
            selection={selection}
            onSelectionChange={setSelection}
          />

          <VariantSummary resolution={resolution} />

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              className="w-full rounded-md bg-black py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
            >
              {addToCartLabel}
            </button>

            <p role="status" aria-live="polite" className="min-h-5 text-sm text-green-700">
              {justAdded ? "Added to cart" : ""}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  )
}
