import type { Metadata } from "next"
import { Inter } from "next/font/google"
import type { ReactNode } from "react"
import "./globals.css"
import CartProvider from "@/components/CartProvider"
import SiteHeader from "@/components/SiteHeader"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "Youleap Store — Dev Test",
  description: "Mid-level developer recruitment test",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <CartProvider>
          <SiteHeader />
          {children}
        </CartProvider>
      </body>
    </html>
  )
}
