import { headers } from "next/headers"
import type { Facets } from "./facets"
import { catalogueSearchParams, type CatalogueQuery } from "./pagination"
import type { ProductsResponse } from "@/types/product"

export type { Facets } from "./facets"
export { PAGE_SIZE } from "./pagination"
export type { CatalogueQuery as ProductQuery } from "./pagination"

/**
 * The storefront talks to the catalogue over HTTP even when both happen to be
 * served by this app, mirroring the real headless setup. Server-side fetch
 * needs an absolute URL, so the origin is read off the incoming request.
 */
async function getOrigin(): Promise<string> {
  const headerList = await headers()
  const host = headerList.get("host") ?? "localhost:3000"
  const protocol =
    headerList.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https")

  return `${protocol}://${host}`
}

export async function fetchProducts(query: CatalogueQuery): Promise<ProductsResponse> {
  const params = catalogueSearchParams(query)

  const response = await fetch(`${await getOrigin()}/api/products?${params}`, {
    cache: "no-store",
  })
  if (!response.ok) {
    throw new Error(`Product request failed with ${response.status}`)
  }

  return response.json() as Promise<ProductsResponse>
}

export async function fetchFacets(): Promise<Facets> {
  const response = await fetch(`${await getOrigin()}/api/facets`, {
    cache: "no-store",
  })
  if (!response.ok) {
    throw new Error(`Facet request failed with ${response.status}`)
  }

  return response.json() as Promise<Facets>
}
