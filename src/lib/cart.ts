import type { CartLine, CartState } from "@/types/cart"

export const EMPTY_CART: CartState = { lines: [] }

export type CartAction =
  | { type: "add"; line: Omit<CartLine, "quantity">; quantity: number }
  | { type: "remove"; variantId: string }
  | { type: "setQuantity"; variantId: string; quantity: number }
  | { type: "clear" }
  | { type: "hydrate"; state: CartState }

function clampQuantity(quantity: number, max: number): number {
  if (max <= 0) return 0
  return Math.min(Math.max(Math.trunc(quantity), 0), max)
}

/** Lines are identified by variant, never by product: one product can hold several lines. */
export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "add": {
      const existing = state.lines.find((line) => line.variantId === action.line.variantId)

      if (!existing) {
        const quantity = clampQuantity(action.quantity, action.line.maxQuantity)
        if (quantity === 0) return state
        return { lines: [...state.lines, { ...action.line, quantity }] }
      }

      const quantity = clampQuantity(
        existing.quantity + action.quantity,
        action.line.maxQuantity
      )
      return {
        lines: state.lines.map((line) =>
          line.variantId === existing.variantId ? { ...line, ...action.line, quantity } : line
        ),
      }
    }

    case "remove":
      return { lines: state.lines.filter((line) => line.variantId !== action.variantId) }

    case "setQuantity": {
      const target = state.lines.find((line) => line.variantId === action.variantId)
      if (!target) return state

      const quantity = clampQuantity(action.quantity, target.maxQuantity)
      if (quantity === 0) {
        return { lines: state.lines.filter((line) => line.variantId !== action.variantId) }
      }

      return {
        lines: state.lines.map((line) =>
          line.variantId === action.variantId ? { ...line, quantity } : line
        ),
      }
    }

    case "clear":
      return EMPTY_CART

    case "hydrate":
      return action.state
  }
}

export function getCartCount(state: CartState): number {
  return state.lines.reduce((total, line) => total + line.quantity, 0)
}

/** Totals stay in integer minor units; rounding only happens when formatting. */
export function getCartTotal(
  state: CartState
): { amount: number; currencyCode: string } | undefined {
  const first = state.lines.at(0)
  if (!first) return undefined

  const amount = state.lines.reduce(
    (total, line) => total + line.unitAmount * line.quantity,
    0
  )

  return { amount, currencyCode: first.currencyCode }
}

function isCartLine(value: unknown): value is CartLine {
  if (typeof value !== "object" || value === null) return false
  const line = value as Record<string, unknown>

  return (
    typeof line.variantId === "string" &&
    typeof line.productTitle === "string" &&
    typeof line.quantity === "number" &&
    typeof line.unitAmount === "number" &&
    typeof line.currencyCode === "string" &&
    typeof line.maxQuantity === "number"
  )
}

/** Persisted carts can be stale or hand-edited, so anything unrecognised is dropped. */
export function parseCartState(raw: string): CartState | undefined {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== "object" || parsed === null) return undefined

    const lines = (parsed as { lines?: unknown }).lines
    if (!Array.isArray(lines)) return undefined

    return { lines: lines.filter(isCartLine) }
  } catch {
    return undefined
  }
}
