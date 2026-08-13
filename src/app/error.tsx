"use client"

import { useEffect } from "react"

type ErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="rounded-md border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-semibold text-red-900">Something went wrong</h1>
        <p className="mt-1 text-sm text-red-700">Please try again.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-md bg-red-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-800"
        >
          Try again
        </button>
      </div>
    </main>
  )
}
