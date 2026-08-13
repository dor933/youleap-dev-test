import { PAGE_SIZE } from "@/lib/products"

export default function ProductsLoading() {
  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Products</h1>

      <div className="mb-6 h-20 animate-pulse rounded-md bg-gray-100" />

      <div
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        aria-busy="true"
        aria-label="Loading products"
      >
        {Array.from({ length: PAGE_SIZE }, (_, index) => (
          <div key={index} className="h-80 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    </main>
  )
}
