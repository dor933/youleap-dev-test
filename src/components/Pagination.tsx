import Link from "next/link"
import { previousPage, productsPageHref } from "@/lib/pagination"

type PaginationProps = {
  page: number
  totalPages: number
  searchParams: Record<string, string | undefined>
}

const LINK_CLASSES =
  "inline-flex min-w-10 items-center justify-center rounded-md border px-3 py-2 text-sm transition-colors"

export default function Pagination({ page, totalPages, searchParams }: PaginationProps) {
  if (totalPages <= 1) return null

  const filters = {
    q: searchParams.q,
    collection: searchParams.collection,
    tag: searchParams.tag,
  }
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)
  const previous = previousPage(page, totalPages)

  return (
    <nav aria-label="Pagination" className="mt-8 flex justify-center gap-2">
      {page > 1 && (
        <Link
          href={productsPageHref(previous, filters)}
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
            href={productsPageHref(pageNumber, filters)}
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
          href={productsPageHref(page + 1, filters)}
          rel="next"
          className={`${LINK_CLASSES} border-gray-300 hover:border-gray-400`}
        >
          Next
        </Link>
      )}
    </nav>
  )
}
