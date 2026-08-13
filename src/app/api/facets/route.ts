import { NextResponse } from "next/server"
import productsData from "../../../../mock-data/products.json"

/**
 * Filter options have to come from the catalogue itself: the tag enum in
 * openapi.json is missing six tags that products actually carry.
 */
export async function GET() {
  const collections = new Map<string, string>()
  const tags = new Set<string>()

  for (const product of productsData) {
    collections.set(product.collection.handle, product.collection.title)
    for (const tag of product.tags) tags.add(tag.value)
  }

  return NextResponse.json({
    collections: [...collections]
      .map(([handle, title]) => ({ handle, title }))
      .sort((a, b) => a.title.localeCompare(b.title)),
    tags: [...tags].sort((a, b) => a.localeCompare(b)),
  })
}
