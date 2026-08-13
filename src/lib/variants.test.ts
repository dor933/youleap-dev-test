import { describe, expect, it } from "vitest"
import productsData from "../../mock-data/products.json"
import {
  getDefaultSelection,
  getPriceRange,
  getStartingPrice,
  getStockStatus,
  getVariantPrice,
  resolveVariant,
  selectionFromVariant,
} from "./variants"
import type { Product, ProductVariant } from "@/types/product"

const products = productsData as Product[]

function fixture(id: string): Product {
  const product = products.find((candidate) => candidate.id === id)
  if (!product) throw new Error(`fixture missing ${id}`)
  return product
}

function variantAt(product: Product, index: number): ProductVariant {
  const variant = product.variants[index]
  if (!variant) throw new Error(`${product.id} has no variant at ${index}`)
  return variant
}

describe("resolveVariant", () => {
  it("round-trips every variant in the catalogue", () => {
    for (const product of products) {
      for (const variant of product.variants) {
        const resolution = resolveVariant(product, selectionFromVariant(product, variant))

        expect(resolution.status, `${product.id} ${variant.title}`).toBe("resolved")
        if (resolution.status === "resolved") {
          expect(resolution.variant.id, `${product.id} ${variant.title}`).toBe(variant.id)
        }
      }
    }
  })

  it("treats a combination with no matching variant as unavailable, not as an error", () => {
    const bedding = fixture("prod_20")

    expect(resolveVariant(bedding, { opt_size_20: "King", opt_color_20: "Slate" })).toEqual({
      status: "unavailable",
    })
  })

  it("still resolves when a variant title carries a token that maps to no option", () => {
    // prod_14 is "EU 42 - Black" but only exposes a Size option.
    const shoes = fixture("prod_14")
    const resolution = resolveVariant(shoes, { opt_size_14: "EU 43" })

    expect(resolution.status).toBe("resolved")
    if (resolution.status === "resolved") {
      expect(resolution.variant.sku).toBe("RS-43-BLK")
    }
  })

  it("resolves products that expose a single option value", () => {
    const dock = fixture("prod_11")

    expect(resolveVariant(dock, { opt_color_11: "Space Gray" })).toMatchObject({
      status: "resolved",
    })
  })

  it("treats a partial selection as unavailable", () => {
    const bedding = fixture("prod_20")

    expect(resolveVariant(bedding, { opt_size_20: "Queen" })).toEqual({ status: "unavailable" })
  })

  it("ignores case and surrounding whitespace", () => {
    const headphones = fixture("prod_01")

    expect(resolveVariant(headphones, { opt_color_01: "  navy blue " })).toMatchObject({
      status: "resolved",
    })
  })

  it("does not require the variant title to equal the joined selection", () => {
    const shoes = fixture("prod_14")

    expect(resolveVariant(shoes, { opt_size_14: "EU 42" }).status).toBe("resolved")
    expect(variantAt(shoes, 0).title).toBe("EU 42 - Black")
  })

  it("resolves out-of-stock variants instead of calling them missing", () => {
    const cases = [
      {
        id: "prod_01",
        selection: { opt_color_01: "Navy Blue" },
        sku: "HP-NVY-01",
        amount: 31900,
      },
      {
        id: "prod_03",
        selection: { opt_size_03: "750ml", opt_color_03: "Black" },
        sku: "WB-750-BLK",
        amount: 22900,
      },
      {
        id: "prod_08",
        selection: { opt_flavor_08: "Vanilla", opt_size_08: "2kg" },
        sku: "PP-VAN-2K",
        amount: 32900,
      },
    ] as const

    for (const { id, selection, sku, amount } of cases) {
      const resolution = resolveVariant(fixture(id), selection)

      expect(resolution.status, id).toBe("resolved")
      if (resolution.status === "resolved") {
        expect(resolution.variant.sku).toBe(sku)
        expect(resolution.variant.inventory_quantity).toBe(0)
        expect(getVariantPrice(resolution.variant)?.amount).toBe(amount)
        expect(getStockStatus(resolution.variant.inventory_quantity).status).toBe(
          "out_of_stock"
        )
      }
    }
  })
})

describe("getDefaultSelection", () => {
  it("never opens a product on an unavailable combination", () => {
    for (const product of products) {
      const resolution = resolveVariant(product, getDefaultSelection(product))
      expect(resolution.status, product.id).toBe("resolved")
    }
  })

  it("prefers a variant that is actually in stock", () => {
    for (const product of products) {
      if (!product.variants.some((variant) => variant.inventory_quantity > 0)) continue

      const resolution = resolveVariant(product, getDefaultSelection(product))
      if (resolution.status === "resolved") {
        expect(resolution.variant.inventory_quantity, product.id).toBeGreaterThan(0)
      }
    }
  })
})

describe("pricing", () => {
  it("takes the cheapest variant rather than the first", () => {
    const product: Product = {
      ...fixture("prod_01"),
      variants: [
        { ...variantAt(fixture("prod_01"), 0), prices: [{ amount: 50000, currency_code: "ILS" }] },
        { ...variantAt(fixture("prod_01"), 1), prices: [{ amount: 10000, currency_code: "ILS" }] },
      ],
    }

    expect(getStartingPrice(product)?.amount).toBe(10000)
  })

  it("reports a range across variants", () => {
    const range = getPriceRange(fixture("prod_01"))

    expect(range?.min.amount).toBe(29900)
    expect(range?.max.amount).toBe(31900)
  })

  it("collapses the range for a single-variant product", () => {
    const range = getPriceRange(fixture("prod_11"))

    expect(range?.min.amount).toBe(range?.max.amount)
  })

  it("equals the cheapest variant on every product in the fixture", () => {
    for (const product of products) {
      const amounts = product.variants.map(
        (variant) => getVariantPrice(variant)?.amount ?? Number.POSITIVE_INFINITY
      )

      expect(getStartingPrice(product)?.amount, product.id).toBe(Math.min(...amounts))
    }
  })

  it("matches on currency instead of taking the first price", () => {
    const variant: ProductVariant = {
      ...variantAt(fixture("prod_01"), 0),
      prices: [
        { amount: 9900, currency_code: "USD" },
        { amount: 29900, currency_code: "ILS" },
      ],
    }

    expect(getVariantPrice(variant)?.currency_code).toBe("ILS")
    expect(getVariantPrice(variant, "USD")?.amount).toBe(9900)
  })
})

describe("getStockStatus", () => {
  it.each([
    [0, "out_of_stock"],
    [1, "low_stock"],
    [5, "low_stock"],
    [6, "in_stock"],
    [25, "in_stock"],
  ])("maps inventory %i to %s", (quantity, expected) => {
    expect(getStockStatus(quantity).status).toBe(expected)
  })
})
