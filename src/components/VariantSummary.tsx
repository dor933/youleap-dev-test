import { formatPrice } from "@/lib/money"
import { getStockStatus, getVariantPrice, type VariantResolution } from "@/lib/variants"

type VariantSummaryProps = {
  resolution: VariantResolution
}

const STOCK_BADGE_STYLES = {
  out_of_stock: "bg-red-50 text-red-700",
  low_stock: "bg-amber-50 text-amber-700",
  in_stock: "bg-green-50 text-green-700",
} as const

function StockBadge({ quantity }: { quantity: number }) {
  const stock = getStockStatus(quantity)

  const label =
    stock.status === "out_of_stock"
      ? "Out of stock"
      : stock.status === "low_stock"
        ? `Only ${stock.quantity} left`
        : "In stock"

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STOCK_BADGE_STYLES[stock.status]}`}
    >
      {label}
    </span>
  )
}

export default function VariantSummary({ resolution }: VariantSummaryProps) {
  if (resolution.status === "unavailable") {
    return (
      <div role="status" aria-live="polite" className="space-y-1">
        <p className="text-lg font-semibold text-gray-400">—</p>
        <p className="text-sm text-amber-700">
          This combination isn’t available. Try a different option.
        </p>
      </div>
    )
  }

  const { variant } = resolution
  const price = getVariantPrice(variant)

  return (
    <div role="status" aria-live="polite" className="space-y-2">
      <p className="text-lg font-semibold text-gray-900">
        {price ? formatPrice(price) : "Price unavailable"}
      </p>
      <div className="flex items-center gap-3">
        <StockBadge quantity={variant.inventory_quantity} />
        <span className="text-xs text-gray-500">SKU {variant.sku}</span>
      </div>
    </div>
  )
}
