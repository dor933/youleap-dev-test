/**
 * Lines snapshot the variant at the moment it was added, so a persisted cart
 * stays renderable without refetching the catalogue.
 */
export type CartLine = {
  variantId: string
  productId: string
  productTitle: string
  variantTitle: string
  sku: string
  thumbnail: string
  /** Minor units, matching the API. */
  unitAmount: number
  currencyCode: string
  quantity: number
  /** Inventory available when the line was added. */
  maxQuantity: number
}

export type CartState = {
  lines: CartLine[]
}
