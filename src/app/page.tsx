import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Youleap Store — Dev Test",
}

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center p-8">
      <h1 className="mb-4 text-3xl font-bold">Youleap Store</h1>
      <p className="mb-8 text-gray-600">Dev Test</p>
      <Link
        href="/products"
        className="rounded-md bg-black px-6 py-3 text-white transition-colors hover:bg-gray-800"
      >
        Browse Products
      </Link>
    </main>
  )
}
