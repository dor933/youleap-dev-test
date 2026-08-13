import type { Metadata } from "next"
import { Suspense } from "react"
import Pagination from "@/components/Pagination"
import ProductFilters from "@/components/ProductFilters"
import ProductGrid from "@/components/ProductGrid"
import { PAGE_SIZE, fetchFacets, fetchProducts } from "@/lib/products"

type ProductsSearchParams = {
  q?: string
  collection?: string
  tag?: string
  page?: string
}

export const metadata: Metadata = {
  title: "Products — Youleap Store",
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<ProductsSearchParams>
}) {
  const params = await searchParams
  const requestedPage = Number.parseInt(params.page ?? "1", 10)
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1

  const [{ products, count }, facets] = await Promise.all([
    fetchProducts({
      q: params.q?.trim() || undefined,
      collection: params.collection || undefined,
      tag: params.tag || undefined,
      page,
    }),
    fetchFacets(),
  ])

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))
  const firstOnPage = (page - 1) * PAGE_SIZE + 1
  const lastOnPage = (page - 1) * PAGE_SIZE + products.length

  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Products</h1>

      <Suspense fallback={<div className="mb-6 h-20" />}>
        <ProductFilters facets={facets} />
      </Suspense>

      {products.length === 0 ? (
        <p className="py-16 text-center text-gray-600">
          No products match your search.
        </p>
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-600">
            Showing {firstOnPage}–{lastOnPage} of {count}
          </p>
          <ProductGrid products={products} />
        </>
      )}

      <Pagination page={page} totalPages={totalPages} searchParams={params} />
    </main>
  )
}
