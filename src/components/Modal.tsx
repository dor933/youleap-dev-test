"use client"

import { X } from "lucide-react"
import { useCallback, useEffect, useRef, type ReactNode } from "react"

type ModalProps = {
  labelledBy: string
  onClose: () => void
  closeLabel?: string
  layout?: keyof typeof LAYOUT_CLASSES
  children: ReactNode
}

const LAYOUT_CLASSES = {
  center: "m-auto max-h-[90vh] w-[min(56rem,92vw)] rounded-xl",
  drawer: "mt-0 mr-0 mb-0 ml-auto h-dvh max-h-dvh w-[min(28rem,92vw)]",
} as const

/**
 * Mounting opens the dialog. Every close path routes through `dialog.close()` so the
 * browser owns the focus trap and focus restoration rather than us reimplementing them.
 */
export default function Modal({
  labelledBy,
  onClose,
  closeLabel = "Close dialog",
  layout = "center",
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  const requestClose = useCallback(() => {
    dialogRef.current?.close()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) requestClose()
      }}
      className={`overflow-y-auto bg-white p-0 shadow-2xl backdrop:bg-black/50 ${LAYOUT_CLASSES[layout]}`}
    >
      <div className="relative min-h-full">
        <button
          type="button"
          onClick={requestClose}
          aria-label={closeLabel}
          className="absolute top-3 right-3 z-10 rounded-full bg-white p-2 text-gray-700 shadow-sm ring-1 ring-gray-300 transition-colors hover:bg-gray-50 hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
        {children}
      </div>
    </dialog>
  )
}
