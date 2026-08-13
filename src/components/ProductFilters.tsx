"use client"

import { Search } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState, useTransition } from "react"
import NativeSelect from "./NativeSelect"
import type { Facets } from "@/lib/products"

const SEARCH_DEBOUNCE_MS = 300

const CONTROL_CLASSES =
  "rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"

type SelectFieldProps = {
  id: string
  label: string
  value: string
  placeholder: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}

function SelectField({
  id,
  label,
  value,
  placeholder,
  options,
  onChange,
}: SelectFieldProps) {
  return (
    <div className="w-full sm:w-48">
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-gray-700">
        {label}
      </label>

      <NativeSelect
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={CONTROL_CLASSES}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </NativeSelect>
    </div>
  )
}

export default function ProductFilters({ facets }: { facets: Facets }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const activeQuery = searchParams.get("q") ?? ""
  const activeCollection = searchParams.get("collection") ?? ""
  const activeTag = searchParams.get("tag") ?? ""
  const hasFilters = Boolean(activeQuery || activeCollection || activeTag)

  const [term, setTerm] = useState(activeQuery)

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams)

      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value)
        else params.delete(key)
      }

      const queryString = params.toString()
      startTransition(() => {
        router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
          scroll: false,
        })
      })
    },
    [pathname, router, searchParams]
  )

  useEffect(() => {
    setTerm(activeQuery)
  }, [activeQuery])

  useEffect(() => {
    if (term === activeQuery) return
    const timer = setTimeout(() => updateParams({ q: term, page: "" }), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [term, activeQuery, updateParams])

  return (
    <div className="mb-6 flex flex-wrap items-end gap-3" aria-busy={isPending}>
      <div className="min-w-56 flex-1">
        <label htmlFor="product-search" className="mb-1 block text-xs font-medium text-gray-700">
          Search
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <input
            id="product-search"
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search products…"
            className={`w-full pl-9 ${CONTROL_CLASSES}`}
          />
        </div>
      </div>

      <SelectField
        id="collection-filter"
        label="Collection"
        value={activeCollection}
        placeholder="All collections"
        options={facets.collections.map((collection) => ({
          value: collection.handle,
          label: collection.title,
        }))}
        onChange={(value) => updateParams({ collection: value, page: "" })}
      />

      <SelectField
        id="tag-filter"
        label="Tag"
        value={activeTag}
        placeholder="All tags"
        options={facets.tags.map((tag) => ({ value: tag, label: tag }))}
        onChange={(value) => updateParams({ tag: value, page: "" })}
      />

      {hasFilters && (
        <button
          type="button"
          onClick={() => updateParams({ q: "", collection: "", tag: "", page: "" })}
          className="px-1 py-2 text-sm font-medium text-gray-700 underline underline-offset-4 hover:text-black"
        >
          Clear filters
        </button>
      )}

      <p role="status" aria-live="polite" className="w-full text-xs text-gray-500">
        {isPending ? "Updating results…" : ""}
      </p>
    </div>
  )
}
