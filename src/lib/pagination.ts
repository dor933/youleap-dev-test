export const PAGE_SIZE = 12

export type CatalogueQuery = {
  q?: string
  collection?: string
  tag?: string
  page: number
}

/**
 * The UI speaks pages; the API speaks a skip count. Garbage values must not
 * become `NaN` and silently return the first page's slice as if it were page 1
 * for the wrong reason — they fall back to page 1 on purpose.
 */
export function parsePage(raw: string | undefined): number {
  const requested = Number.parseInt(raw ?? "1", 10)
  return Number.isFinite(requested) && requested > 0 ? requested : 1
}

export function pageToOffset(page: number): number {
  return (page - 1) * PAGE_SIZE
}

/** Past-the-end URLs should rewind to the last real page, not to `page - 1`. */
export function previousPage(page: number, totalPages: number): number {
  if (page > totalPages) return Math.max(1, totalPages)
  return Math.max(1, page - 1)
}

export function productsPageHref(
  page: number,
  filters: Pick<CatalogueQuery, "q" | "collection" | "tag">
): string {
  const params = new URLSearchParams()

  if (filters.q) params.set("q", filters.q)
  if (filters.collection) params.set("collection", filters.collection)
  if (filters.tag) params.set("tag", filters.tag)
  if (page > 1) params.set("page", String(page))

  const queryString = params.toString()
  return queryString ? `/products?${queryString}` : "/products"
}

/**
 * The list endpoint has `offset` and `limit`. It does not have `page`. Sending
 * `?page=3` is a no-op and still returns the first twelve products.
 */
export function catalogueSearchParams(query: CatalogueQuery): URLSearchParams {
  const params = new URLSearchParams({
    limit: String(PAGE_SIZE),
    offset: String(pageToOffset(query.page)),
  })

  if (query.q) params.set("q", query.q)
  if (query.collection) params.set("collection", query.collection)
  if (query.tag) params.set("tag", query.tag)

  return params
}
