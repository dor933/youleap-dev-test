import { describe, expect, it } from "vitest"
import openapi from "../../openapi.json"
import productsData from "../../mock-data/products.json"
import { collectFacets } from "./facets"
import type { Product } from "@/types/product"

const products = productsData as Product[]

function openApiTagEnum(): string[] {
  const parameter = openapi.paths["/api/products"].get.parameters.find(
    (entry) => entry.name === "tag"
  )
  const values =
    parameter && "schema" in parameter && parameter.schema && "enum" in parameter.schema
      ? parameter.schema.enum
      : undefined

  return values ?? []
}

describe("collectFacets", () => {
  it("includes every tag the products actually carry", () => {
    const actual = new Set(products.flatMap((product) => product.tags.map((tag) => tag.value)))

    expect(new Set(collectFacets(products).tags)).toEqual(actual)
  })

  it("keeps tags that the OpenAPI enum dropped", () => {
    const spec = new Set(openApiTagEnum())
    const dropped = collectFacets(products).tags.filter((tag) => !spec.has(tag))

    expect(dropped).toEqual([
      "decor",
      "equipment",
      "footwear",
      "leather",
      "photography",
      "wellness",
    ])
  })

  it("exposes collection handles, which is what the API filters on", () => {
    const audio = collectFacets(products).collections.find(
      (collection) => collection.handle === "audio"
    )

    expect(audio?.title).toBe("Audio")
    expect(collectFacets(products).collections.map((collection) => collection.handle)).not.toContain(
      "Audio"
    )
  })
})
