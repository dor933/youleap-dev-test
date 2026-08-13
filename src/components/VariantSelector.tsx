"use client"

import { useId } from "react"
import type { OptionSelection } from "@/lib/variants"
import type { Product } from "@/types/product"

type VariantSelectorProps = {
  product: Product
  selection: OptionSelection
  onSelectionChange: (selection: OptionSelection) => void
}

/** Option values are free text, so they need slugging before use in an id. */
function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-")
}

export default function VariantSelector({
  product,
  selection,
  onSelectionChange,
}: VariantSelectorProps) {
  const uid = useId()

  if (product.options.length === 0) return null

  return (
    <div className="space-y-4">
      {product.options.map((option) => (
        <fieldset key={option.id}>
          <legend className="text-sm font-medium text-gray-900">
            {option.title}
          </legend>

          <div className="mt-2 flex flex-wrap gap-2">
            {option.values.map((value) => {
              const inputId = `${uid}-${option.id}-${slug(value)}`

              return (
                <div key={value}>
                  <input
                    type="radio"
                    id={inputId}
                    name={`${uid}-${option.id}`}
                    value={value}
                    checked={selection[option.id] === value}
                    onChange={() =>
                      onSelectionChange({ ...selection, [option.id]: value })
                    }
                    className="peer sr-only"
                  />
                  <label
                    htmlFor={inputId}
                    className="block cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 transition-colors select-none hover:border-gray-400 peer-checked:border-black peer-checked:bg-black peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-black peer-focus-visible:ring-offset-2"
                  >
                    {value}
                  </label>
                </div>
              )
            })}
          </div>
        </fieldset>
      ))}
    </div>
  )
}
