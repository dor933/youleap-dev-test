import { ChevronDown } from "lucide-react"
import type { ComponentProps } from "react"

/**
 * Native `<select>` arrows sit flush against the control edge on mobile and
 * ignore padding. This hides that chrome and centres a chevron in a right-hand
 * slot instead, so the inset matches the text padding.
 */
export default function NativeSelect({
  className = "",
  children,
  ...props
}: ComponentProps<"select">) {
  return (
    <div className="relative flex items-center">
      <select
        {...props}
        className={`w-full appearance-none bg-none ${className} pr-12`}
      >
        {children}
      </select>

      <span className="pointer-events-none absolute inset-y-0 right-0 flex w-12 items-center justify-center text-gray-500">
        <ChevronDown className="size-4" aria-hidden="true" />
      </span>
    </div>
  )
}
