"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function ProductsNavLink() {
  const pathname = usePathname()
  const isProducts = pathname === "/products"

  if (isProducts) {
    return (
      <span
        className="cursor-default rounded-md px-3 py-2 text-sm font-medium text-black"
        aria-current="page"
      >
        Products
      </span>
    )
  }

  return (
    <Link
      href="/products"
      className="rounded-md px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 hover:text-black"
    >
      Products
    </Link>
  )
}
