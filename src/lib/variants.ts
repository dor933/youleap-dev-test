import type { Price, Product, ProductVariant } from "@/types/product"
import { DEFAULT_CURRENCY } from "./money"

/**
 * Variants carry no structured link to options, so the only join available is
 * `variant.title`, which lists the option values in `product.options` order.
 */
const VARIANT_TITLE_SEPARATOR = " - "

export const LOW_STOCK_THRESHOLD = 5

/** Maps a `ProductOption` id to its currently selected value. */
export type OptionSelection = Record<string, string>

export type VariantResolution =
  | { status: "resolved"; variant: ProductVariant }
  | { status: "unavailable" }

export type StockStatus =
  | { status: "out_of_stock" }
  | { status: "low_stock"; quantity: number }
  | { status: "in_stock"; quantity: number }

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function optionValuesOf(variant: ProductVariant): string[] {
  return variant.title.split(VARIANT_TITLE_SEPARATOR).map((token) => token.trim())
}

/**
 * Some titles carry trailing tokens that belong to no option (prod_14 is
 * "EU 42 - Black" with only a Size option), so only the leading tokens count.
 */
function matchesSelection(
  product: Product,
  variant: ProductVariant,
  selection: OptionSelection
): boolean {
  const tokens = optionValuesOf(variant)

  return product.options.every((option, index) => {
    const selected = selection[option.id]
    const token = tokens[index]
    if (selected === undefined || token === undefined) return false
    return normalize(token) === normalize(selected)
  })
}

export function resolveVariant(
  product: Product,
  selection: OptionSelection
): VariantResolution {
  const variant = product.variants.find((candidate) =>
    matchesSelection(product, candidate, selection)
  )

  return variant ? { status: "resolved", variant } : { status: "unavailable" }
}

export function selectionFromVariant(
  product: Product,
  variant: ProductVariant
): OptionSelection {
  const tokens = optionValuesOf(variant)
  const selection: OptionSelection = {}

  product.options.forEach((option, index) => {
    const token = tokens[index]
    const match = option.values.find((value) => normalize(value) === normalize(token ?? ""))
    const fallback = option.values.at(0)

    if (match !== undefined) selection[option.id] = match
    else if (fallback !== undefined) selection[option.id] = fallback
  })

  return selection
}

/** Opens on a purchasable variant where one exists, so the modal never starts unavailable. */
export function getDefaultSelection(product: Product): OptionSelection {
  const preferred =
    product.variants.find((variant) => variant.inventory_quantity > 0) ??
    product.variants.at(0)

  return preferred ? selectionFromVariant(product, preferred) : {}
}

export function getVariantPrice(
  variant: ProductVariant,
  currencyCode: string = DEFAULT_CURRENCY
): Price | undefined {
  return (
    variant.prices.find((price) => price.currency_code === currencyCode) ??
    variant.prices.at(0)
  )
}

export function getPriceRange(
  product: Product,
  currencyCode: string = DEFAULT_CURRENCY
): { min: Price; max: Price } | undefined {
  let min: Price | undefined
  let max: Price | undefined

  for (const variant of product.variants) {
    const price = getVariantPrice(variant, currencyCode)
    if (!price) continue
    if (min === undefined || price.amount < min.amount) min = price
    if (max === undefined || price.amount > max.amount) max = price
  }

  return min && max ? { min, max } : undefined
}

/** The "starting price" shown on a card: the cheapest variant, not the first one. */
export function getStartingPrice(
  product: Product,
  currencyCode: string = DEFAULT_CURRENCY
): Price | undefined {
  return getPriceRange(product, currencyCode)?.min
}

export function getStockStatus(inventoryQuantity: number): StockStatus {
  if (inventoryQuantity <= 0) return { status: "out_of_stock" }
  if (inventoryQuantity <= LOW_STOCK_THRESHOLD) {
    return { status: "low_stock", quantity: inventoryQuantity }
  }
  return { status: "in_stock", quantity: inventoryQuantity }
}
