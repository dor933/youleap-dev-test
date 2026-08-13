"use client"

import { CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useState, type FormEvent } from "react"
import NativeSelect from "./NativeSelect"
import { useCart } from "./CartProvider"
import { formatAmount } from "@/lib/money"
import {
  CHECKOUT_DRAFT_KEY,
  COUNTRIES,
  createOrderReference,
  parseCheckoutDraft,
  serializeCheckoutDraft,
  validateShipping,
  type CheckoutDraft,
  type ShippingDetails,
  type ShippingErrors,
} from "@/lib/checkout"
import type { CartLine } from "@/types/cart"

type PlacedOrder = {
  reference: string
  details: ShippingDetails
  lines: CartLine[]
  total: { amount: number; currencyCode: string } | undefined
}

const INPUT_BASE =
  "w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"

function fieldClasses(hasError: boolean): string {
  return `${INPUT_BASE} ${hasError ? "border-red-400 bg-red-50" : "border-gray-300"}`
}

type TextFieldProps = {
  name: keyof ShippingDetails
  label: string
  error?: string
  type?: string
  autoComplete?: string
  className?: string
  defaultValue?: string
}

function TextField({
  name,
  label,
  error,
  type = "text",
  autoComplete,
  className,
  defaultValue,
}: TextFieldProps) {
  const errorId = `${name}-error`

  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={fieldClasses(Boolean(error))}
      />
      {error && (
        <p id={errorId} className="mt-1 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}

export default function CheckoutForm() {
  const { lines, total, clear } = useCart()
  const [errors, setErrors] = useState<ShippingErrors>({})
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [order, setOrder] = useState<PlacedOrder | null>(null)
  const [draft, setDraft] = useState<CheckoutDraft>({})
  const [isRestored, setIsRestored] = useState(false)

  useEffect(() => {
    setDraft(parseCheckoutDraft(window.localStorage.getItem(CHECKOUT_DRAFT_KEY)))
    setIsRestored(true)
  }, [])

  function persistDraft(form: HTMLFormElement) {
    window.localStorage.setItem(
      CHECKOUT_DRAFT_KEY,
      serializeCheckoutDraft(Object.fromEntries(new FormData(form)))
    )
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = event.currentTarget
    persistDraft(form)
    const result = validateShipping(Object.fromEntries(new FormData(form)))
    setHasSubmitted(true)

    if (!result.success) {
      setErrors(result.errors)

      const firstInvalid = Object.keys(result.errors)[0]
      const control = firstInvalid ? form.elements.namedItem(firstInvalid) : null
      if (control instanceof HTMLElement) control.focus()
      return
    }

    window.localStorage.removeItem(CHECKOUT_DRAFT_KEY)
    setErrors({})
    setOrder({
      reference: createOrderReference(),
      details: result.data,
      lines,
      total,
    })
    clear()
  }

  function handleChange(event: FormEvent<HTMLFormElement>) {
    persistDraft(event.currentTarget)
    if (!hasSubmitted) return
    const result = validateShipping(Object.fromEntries(new FormData(event.currentTarget)))
    setErrors(result.success ? {} : result.errors)
  }

  if (order) {
    return (
      <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-green-700" aria-hidden="true" />
          <div>
            <h2 className="text-lg font-semibold text-green-900">Order confirmed</h2>
            <p className="mt-1 text-sm text-green-800">
              Thanks, {order.details.fullName}. Your reference is{" "}
              <span className="font-mono font-medium">{order.reference}</span>. A confirmation
              was sent to {order.details.email}.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-green-900">Shipping to</h3>
            <address className="mt-1 text-sm not-italic text-green-800">
              {order.details.address}
              {order.details.apartment ? `, ${order.details.apartment}` : ""}
              <br />
              {order.details.postalCode} {order.details.city}
              <br />
              {order.details.country}
            </address>
          </div>

          <div>
            <h3 className="text-sm font-medium text-green-900">Items</h3>
            <ul className="mt-1 space-y-1 text-sm text-green-800">
              {order.lines.map((line) => (
                <li key={line.variantId} className="flex justify-between gap-4">
                  <span>
                    {line.productTitle} · {line.variantTitle} × {line.quantity}
                  </span>
                  <span>{formatAmount(line.unitAmount * line.quantity, line.currencyCode)}</span>
                </li>
              ))}
            </ul>
            {order.total && (
              <p className="mt-2 flex justify-between border-t border-green-200 pt-2 text-sm font-semibold text-green-900">
                <span>Total</span>
                <span>{formatAmount(order.total.amount, order.total.currencyCode)}</span>
              </p>
            )}
          </div>
        </div>

        <Link
          href="/products"
          className="mt-6 inline-block rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          Continue shopping
        </Link>
      </div>
    )
  }

  if (lines.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 p-10 text-center">
        <p className="text-gray-600">Your cart is empty.</p>
        <Link
          href="/products"
          className="mt-4 inline-block rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          Browse products
        </Link>
      </div>
    )
  }

  if (!isRestored) {
    return <div className="h-64 animate-pulse rounded-lg bg-gray-100" aria-hidden="true" />
  }

  const errorCount = Object.keys(errors).length

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      {/* Native validation is disabled so the zod schema is the only source of truth. */}
      <form onSubmit={handleSubmit} onChange={handleChange} noValidate>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Shipping details</h2>

        {errorCount > 0 && (
          <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            Please fix {errorCount} {errorCount === 1 ? "field" : "fields"} below.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            name="fullName"
            label="Full name"
            autoComplete="name"
            defaultValue={draft.fullName}
            error={errors.fullName}
            className="sm:col-span-2"
          />
          <TextField
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            defaultValue={draft.email}
            error={errors.email}
          />
          <TextField
            name="phone"
            label="Phone"
            type="tel"
            autoComplete="tel"
            defaultValue={draft.phone}
            error={errors.phone}
          />
          <TextField
            name="address"
            label="Street address"
            autoComplete="address-line1"
            defaultValue={draft.address}
            error={errors.address}
            className="sm:col-span-2"
          />
          <TextField
            name="apartment"
            label="Apartment, suite (optional)"
            autoComplete="address-line2"
            defaultValue={draft.apartment}
            error={errors.apartment}
            className="sm:col-span-2"
          />
          <TextField
            name="city"
            label="City"
            autoComplete="address-level2"
            defaultValue={draft.city}
            error={errors.city}
          />
          <TextField
            name="postalCode"
            label="Postal code"
            autoComplete="postal-code"
            defaultValue={draft.postalCode}
            error={errors.postalCode}
          />

          <div className="sm:col-span-2">
            <label htmlFor="country" className="mb-1 block text-sm font-medium text-gray-700">
              Country
            </label>
            <NativeSelect
              id="country"
              name="country"
              defaultValue={draft.country ?? COUNTRIES[0]}
              autoComplete="country-name"
              aria-invalid={errors.country ? true : undefined}
              aria-describedby={errors.country ? "country-error" : undefined}
              className={fieldClasses(Boolean(errors.country))}
            >
              {COUNTRIES.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </NativeSelect>
            {errors.country && (
              <p id="country-error" className="mt-1 text-xs text-red-700">
                {errors.country}
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="mt-6 w-full rounded-md bg-black py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black sm:w-auto sm:px-8"
        >
          Place order
        </button>
      </form>

      <aside className="h-fit rounded-lg border border-gray-200 p-5">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">Order summary</h2>

        <ul className="space-y-3">
          {lines.map((line) => (
            <li key={line.variantId} className="flex justify-between gap-3 text-sm">
              <span className="min-w-0">
                <span className="block truncate text-gray-900">{line.productTitle}</span>
                <span className="text-xs text-gray-500">
                  {line.variantTitle} × {line.quantity}
                </span>
              </span>
              <span className="shrink-0 text-gray-900">
                {formatAmount(line.unitAmount * line.quantity, line.currencyCode)}
              </span>
            </li>
          ))}
        </ul>

        {total && (
          <p className="mt-4 flex justify-between border-t border-gray-200 pt-4 text-sm font-semibold text-gray-900">
            <span>Total</span>
            <span>{formatAmount(total.amount, total.currencyCode)}</span>
          </p>
        )}
      </aside>
    </div>
  )
}
