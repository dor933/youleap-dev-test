import Image from "next/image"
import QuickViewButton from "./QuickViewButton"
import { formatPrice } from "@/lib/money"
import { getPriceRange } from "@/lib/variants"
import type { Product } from "@/types/product"

type ProductCardProps = {
  product: Product
  priority?: boolean
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const range = getPriceRange(product)
  const priceLabel = !range
    ? "Price unavailable"
    : range.min.amount === range.max.amount
      ? formatPrice(range.min)
      : `From ${formatPrice(range.min)}`

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="relative aspect-square bg-gray-100">
        <Image
          src={product.thumbnail}
          alt={product.title}
          fill
          priority={priority}
          sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-medium text-gray-900">{product.title}</h3>
        <p className="mt-1 mb-4 text-sm text-gray-600">{priceLabel}</p>
        <QuickViewButton product={product} />
      </div>
    </article>
  )
}
