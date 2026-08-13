import { describe, expect, it } from "vitest"
import {
  EMPTY_CART,
  cartReducer,
  getCartCount,
  getCartTotal,
  parseCartState,
  type CartAction,
} from "./cart"
import type { CartLine, CartState } from "@/types/cart"

function line(overrides: Partial<CartLine> = {}): Omit<CartLine, "quantity"> {
  return {
    variantId: "var_01a",
    productId: "prod_01",
    productTitle: "Classic Wireless Headphones",
    variantTitle: "Black",
    sku: "HP-BLK-01",
    thumbnail: "https://example.test/thumb.jpg",
    unitAmount: 29900,
    currencyCode: "ILS",
    maxQuantity: 25,
    ...overrides,
  }
}

function run(actions: CartAction[]): CartState {
  return actions.reduce(cartReducer, EMPTY_CART)
}

describe("cartReducer", () => {
  it("merges repeat additions of the same variant into one line", () => {
    const state = run([
      { type: "add", line: line(), quantity: 1 },
      { type: "add", line: line(), quantity: 2 },
    ])

    expect(state.lines).toHaveLength(1)
    expect(state.lines[0]?.quantity).toBe(3)
  })

  it("keeps different variants of one product as separate lines", () => {
    const state = run([
      { type: "add", line: line(), quantity: 1 },
      { type: "add", line: line({ variantId: "var_01b", variantTitle: "White" }), quantity: 1 },
    ])

    expect(state.lines).toHaveLength(2)
  })

  it("clamps quantity to the available inventory", () => {
    const state = run([{ type: "add", line: line({ maxQuantity: 4 }), quantity: 99 }])

    expect(state.lines[0]?.quantity).toBe(4)
  })

  it("clamps when an existing line would exceed inventory", () => {
    const state = run([
      { type: "add", line: line({ maxQuantity: 3 }), quantity: 2 },
      { type: "add", line: line({ maxQuantity: 3 }), quantity: 2 },
    ])

    expect(state.lines[0]?.quantity).toBe(3)
  })

  it("refuses to add an out-of-stock variant", () => {
    const state = run([{ type: "add", line: line({ maxQuantity: 0 }), quantity: 1 }])

    expect(state.lines).toHaveLength(0)
  })

  it("removes a line when its quantity is set to zero", () => {
    const state = run([
      { type: "add", line: line(), quantity: 2 },
      { type: "setQuantity", variantId: "var_01a", quantity: 0 },
    ])

    expect(state.lines).toHaveLength(0)
  })

  it("ignores a quantity change for an unknown variant", () => {
    const state = run([
      { type: "add", line: line(), quantity: 1 },
      { type: "setQuantity", variantId: "nope", quantity: 5 },
    ])

    expect(state.lines).toHaveLength(1)
    expect(state.lines[0]?.quantity).toBe(1)
  })

  it("removes only the targeted variant", () => {
    const state = run([
      { type: "add", line: line(), quantity: 1 },
      { type: "add", line: line({ variantId: "var_20c" }), quantity: 1 },
      { type: "remove", variantId: "var_01a" },
    ])

    expect(state.lines.map((entry) => entry.variantId)).toEqual(["var_20c"])
  })

  it("empties on clear", () => {
    const state = run([
      { type: "add", line: line(), quantity: 2 },
      { type: "clear" },
    ])

    expect(state.lines).toHaveLength(0)
  })
})

describe("cart totals", () => {
  const state = run([
    { type: "add", line: line(), quantity: 3 },
    { type: "add", line: line({ variantId: "var_20c", unitAmount: 69900 }), quantity: 2 },
  ])

  it("sums quantities across lines", () => {
    expect(getCartCount(state)).toBe(5)
  })

  it("keeps the total in integer minor units", () => {
    expect(getCartTotal(state)?.amount).toBe(3 * 29900 + 2 * 69900)
  })

  it("has no total for an empty cart", () => {
    expect(getCartTotal(EMPTY_CART)).toBeUndefined()
  })
})

describe("parseCartState", () => {
  it("round-trips a serialised cart", () => {
    const state = run([{ type: "add", line: line(), quantity: 2 }])

    expect(parseCartState(JSON.stringify(state))?.lines).toHaveLength(1)
  })

  it("drops entries that are not recognisable lines", () => {
    const parsed = parseCartState('{"lines":[{"variantId":"x"},null,{"nope":true}]}')

    expect(parsed?.lines).toHaveLength(0)
  })

  it("returns undefined for malformed input", () => {
    expect(parseCartState("not json")).toBeUndefined()
    expect(parseCartState('{"lines":"nope"}')).toBeUndefined()
  })
})
