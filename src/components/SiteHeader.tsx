import Link from "next/link"
import CartButton from "./CartButton"
import CartDrawer from "./CartDrawer"
import ProductsNavLink from "./ProductsNavLink"

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="font-semibold text-gray-900">
          Youleap Store
        </Link>

        <nav className="flex items-center gap-2">
          <ProductsNavLink />
          <CartButton />
        </nav>
      </div>

      <CartDrawer />
    </header>
  )
}
