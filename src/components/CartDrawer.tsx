"use client"

import { Minus, Plus, Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useId } from "react"
import Modal from "./Modal"
import { useCart } from "./CartProvider"
import { formatAmount } from "@/lib/money"

const STEPPER_BUTTON_CLASSES =
  "rounded border border-gray-300 p-1 text-gray-700 transition-colors hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-40"

export default function CartDrawer() {
  const { lines, count, total, isOpen, closeCart, removeItem, setQuantity } = useCart()
  const titleId = useId()

  if (!isOpen) return null

  return (
    <Modal
      labelledBy={titleId}
      onClose={closeCart}
      closeLabel="Close cart"
      layout="drawer"
    >
      <div className="flex min-h-dvh flex-col">
        <div className="border-b border-gray-200 p-6 pr-16">
          <h2 id={titleId} className="text-lg font-semibold text-gray-900">
            Your cart
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {count === 0 ? "No items yet" : `${count} ${count === 1 ? "item" : "items"}`}
          </p>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <p className="text-sm text-gray-600">Your cart is empty.</p>
          </div>
        ) : (
          <ul className="flex-1 divide-y divide-gray-200">
            {lines.map((line) => (
              <li key={line.variantId} className="flex gap-4 p-4">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-gray-100">
                  <Image
                    src={line.thumbnail}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {line.productTitle}
                  </p>
                  <p className="text-xs text-gray-500">{line.variantTitle}</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatAmount(line.unitAmount, line.currencyCode)}
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity(line.variantId, line.quantity - 1)}
                      aria-label={`Decrease quantity of ${line.productTitle}`}
                      className={STEPPER_BUTTON_CLASSES}
                    >
                      <Minus className="size-3.5" aria-hidden="true" />
                    </button>

                    <span className="min-w-6 text-center text-sm" aria-live="polite">
                      {line.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() => setQuantity(line.variantId, line.quantity + 1)}
                      disabled={line.quantity >= line.maxQuantity}
                      aria-label={`Increase quantity of ${line.productTitle}`}
                      className={STEPPER_BUTTON_CLASSES}
                    >
                      <Plus className="size-3.5" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() => removeItem(line.variantId)}
                      aria-label={`Remove ${line.productTitle} from cart`}
                      className="ml-auto rounded p-1 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>

                  {line.quantity >= line.maxQuantity && (
                    <p className="mt-1 text-xs text-amber-700">
                      Only {line.maxQuantity} in stock
                    </p>
                  )}
                </div>

                <p className="text-sm font-medium text-gray-900">
                  {formatAmount(line.unitAmount * line.quantity, line.currencyCode)}
                </p>
              </li>
            ))}
          </ul>
        )}

        {total && (
          <div className="sticky bottom-0 border-t border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-baseline justify-between">
              <span className="text-sm text-gray-600">Total</span>
              <span className="text-lg font-semibold text-gray-900">
                {formatAmount(total.amount, total.currencyCode)}
              </span>
            </div>

            <Link
              href="/checkout"
              onClick={closeCart}
              className="block rounded-md bg-black py-3 text-center text-sm font-medium text-white transition-colors hover:bg-gray-800"
            >
              Checkout
            </Link>
          </div>
        )}
      </div>
    </Modal>
  )
}
