import type { Metadata } from "next"
import CheckoutForm from "@/components/CheckoutForm"

export const metadata: Metadata = {
  title: "Checkout — Youleap Store",
}

export default function CheckoutPage() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Checkout</h1>
      <CheckoutForm />
    </main>
  )
}
