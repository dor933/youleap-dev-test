export type Facets = {
  collections: { handle: string; title: string }[]
  tags: string[]
}

type FacetSource = {
  collection: { handle: string; title: string }
  tags: { value: string }[]
}

/**
 * Filter options have to come from the catalogue itself: the tag enum in
 * `openapi.json` is missing tags that products actually carry, and collection
 * filters match on `handle`, not the display title.
 */
export function collectFacets(products: FacetSource[]): Facets {
  const collections = new Map<string, string>()
  const tags = new Set<string>()

  for (const product of products) {
    collections.set(product.collection.handle, product.collection.title)
    for (const tag of product.tags) tags.add(tag.value)
  }

  return {
    collections: [...collections]
      .map(([handle, title]) => ({ handle, title }))
      .sort((a, b) => a.title.localeCompare(b.title)),
    tags: [...tags].sort((a, b) => a.localeCompare(b)),
  }
}
