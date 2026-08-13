import type { Price } from "@/types/product"

export const DEFAULT_CURRENCY = "ILS"

/** The API returns amounts in minor units — 29900 is ₪299.00. */
const MINOR_UNITS_PER_MAJOR = 100

/** "he-IL" wraps output in RTL marks, which corrupt the layout of an LTR storefront. */
const PRICE_LOCALE = "en-IL"

export function formatAmount(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat(PRICE_LOCALE, {
    style: "currency",
    currency: currencyCode,
  }).format(amount / MINOR_UNITS_PER_MAJOR)
}

export function formatPrice(price: Price): string {
  return formatAmount(price.amount, price.currency_code)
}
