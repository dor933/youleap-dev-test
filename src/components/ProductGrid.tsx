import ProductCard from "./ProductCard"
import QuickViewProvider from "./QuickViewProvider"
import type { Product } from "@/types/product"

const LCP_IMAGE_COUNT = 4

export default function ProductGrid({ products }: { products: Product[] }) {
  return (
    <QuickViewProvider>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            priority={index < LCP_IMAGE_COUNT}
          />
        ))}
      </div>
    </QuickViewProvider>
  )
}
