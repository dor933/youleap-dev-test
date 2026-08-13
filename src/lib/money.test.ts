import { describe, expect, it } from "vitest"
import { formatAmount, formatPrice } from "./money"

describe("formatAmount", () => {
  it("renders minor units as major units", () => {
    expect(formatAmount(29900, "ILS")).toBe("₪299.00")
  })

  it("groups thousands", () => {
    expect(formatAmount(229500, "ILS")).toBe("₪2,295.00")
  })

  it("keeps two decimals for round amounts", () => {
    expect(formatAmount(0, "ILS")).toBe("₪0.00")
  })

  it("respects the currency it is given", () => {
    // en-IL disambiguates foreign currencies, hence "US$" rather than "$".
    expect(formatAmount(9900, "USD")).toBe("US$99.00")
  })

  it("does not emit RTL marks that would break an LTR layout", () => {
    const formatted = formatAmount(29900, "ILS")

    expect(formatted).toBe("₪299.00")
    expect(formatted).not.toMatch(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/)
  })

  it("does not treat agorot as already-major units", () => {
    expect(formatAmount(29900, "ILS")).not.toBe("₪29,900.00")
  })
})

describe("formatPrice", () => {
  it("reads the currency off the price", () => {
    expect(formatPrice({ amount: 31900, currency_code: "ILS" })).toBe("₪319.00")
  })
})
