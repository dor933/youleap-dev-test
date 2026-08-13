import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Page not found — Youleap Store",
}

export default function NotFound() {
  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-gray-600">That page does not exist.</p>
      <Link
        href="/products"
        className="mt-6 inline-block rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
      >
        Browse products
      </Link>
    </main>
  )
}
