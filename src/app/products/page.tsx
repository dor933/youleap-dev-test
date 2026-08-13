import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import Pagination from "@/components/Pagination"
import ProductFilters from "@/components/ProductFilters"
import ProductGrid from "@/components/ProductGrid"
import { PAGE_SIZE, parsePage, productsPageHref } from "@/lib/pagination"
import { fetchFacets, fetchProducts } from "@/lib/products"

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
  const page = parsePage(params.page)

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
  const isPastEnd = count > 0 && page > totalPages
  const firstOnPage = (page - 1) * PAGE_SIZE + 1
  const lastOnPage = (page - 1) * PAGE_SIZE + products.length
  const filters = { q: params.q, collection: params.collection, tag: params.tag }

  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Products</h1>

      <Suspense fallback={<div className="mb-6 h-20" />}>
        <ProductFilters facets={facets} />
      </Suspense>

      {products.length === 0 ? (
        <p className="py-16 text-center text-gray-600">
          {isPastEnd ? (
            <>
              This page doesn’t exist.{" "}
              <Link
                href={productsPageHref(totalPages, filters)}
                className="font-medium text-gray-900 underline underline-offset-4 hover:text-black"
              >
                Go to page {totalPages}
              </Link>
            </>
          ) : (
            "No products match your search."
          )}
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
