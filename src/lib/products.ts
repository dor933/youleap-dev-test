import { headers } from "next/headers"
import type { ProductsResponse } from "@/types/product"

export const PAGE_SIZE = 12

export type ProductQuery = {
  q?: string
  collection?: string
  tag?: string
  page: number
}

export type Facets = {
  collections: { handle: string; title: string }[]
  tags: string[]
}

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

export async function fetchProducts(query: ProductQuery): Promise<ProductsResponse> {
  const params = new URLSearchParams({
    limit: String(PAGE_SIZE),
    offset: String((query.page - 1) * PAGE_SIZE),
  })

  if (query.q) params.set("q", query.q)
  if (query.collection) params.set("collection", query.collection)
  if (query.tag) params.set("tag", query.tag)

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
