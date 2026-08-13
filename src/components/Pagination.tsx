import Link from "next/link"

type PaginationProps = {
  page: number
  totalPages: number
  searchParams: Record<string, string | undefined>
}

function hrefFor(
  page: number,
  searchParams: Record<string, string | undefined>
): string {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams)) {
    if (key !== "page" && value) params.set(key, value)
  }
  if (page > 1) params.set("page", String(page))

  const queryString = params.toString()
  return queryString ? `/products?${queryString}` : "/products"
}

const LINK_CLASSES =
  "inline-flex min-w-10 items-center justify-center rounded-md border px-3 py-2 text-sm transition-colors"

export default function Pagination({ page, totalPages, searchParams }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)

  return (
    <nav aria-label="Pagination" className="mt-8 flex justify-center gap-2">
      {page > 1 && (
        <Link
          href={hrefFor(page - 1, searchParams)}
          rel="prev"
          className={`${LINK_CLASSES} border-gray-300 hover:border-gray-400`}
        >
          Previous
        </Link>
      )}

      {pages.map((pageNumber) => {
        const isCurrent = pageNumber === page

        return (
          <Link
            key={pageNumber}
            href={hrefFor(pageNumber, searchParams)}
            aria-current={isCurrent ? "page" : undefined}
            aria-label={`Page ${pageNumber}`}
            className={`${LINK_CLASSES} ${
              isCurrent
                ? "border-black bg-black text-white"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            {pageNumber}
          </Link>
        )
      })}

      {page < totalPages && (
        <Link
          href={hrefFor(page + 1, searchParams)}
          rel="next"
          className={`${LINK_CLASSES} border-gray-300 hover:border-gray-400`}
        >
          Next
        </Link>
      )}
    </nav>
  )
}
