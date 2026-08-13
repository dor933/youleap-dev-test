import { z } from "zod"

export const COUNTRIES = [
  "Israel",
  "United States",
  "United Kingdom",
  "Germany",
  "France",
] as const

export const shippingSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your full name")
    .max(100, "Name must be 100 characters or fewer"),
  email: z.email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .regex(/^[+(]?[\d][\d\s()-]{6,19}$/, "Enter a valid phone number"),
  address: z
    .string()
    .trim()
    .min(4, "Enter your street address")
    .max(200, "Address must be 200 characters or fewer"),
  apartment: z
    .string()
    .trim()
    .max(50, "Apartment must be 50 characters or fewer")
    .optional(),
  city: z.string().trim().min(2, "Enter your city"),
  postalCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9][A-Za-z0-9 -]{2,9}$/, "Enter a valid postal code"),
  country: z.enum(COUNTRIES, { error: "Select a country" }),
})

export type ShippingDetails = z.infer<typeof shippingSchema>
export type ShippingErrors = Partial<Record<keyof ShippingDetails, string>>

export type ShippingValidation =
  | { success: true; data: ShippingDetails }
  | { success: false; errors: ShippingErrors }

/** Only the first issue per field is surfaced; a stack of messages under one input is noise. */
export function validateShipping(input: unknown): ShippingValidation {
  const result = shippingSchema.safeParse(input)
  if (result.success) return { success: true, data: result.data }

  const errors: ShippingErrors = {}

  for (const issue of result.error.issues) {
    const field = issue.path[0]
    if (typeof field === "string" && !(field in errors)) {
      errors[field as keyof ShippingDetails] = issue.message
    }
  }

  return { success: false, errors }
}

export function createOrderReference(): string {
  const time = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `YL-${time}-${random}`
}

export const CHECKOUT_DRAFT_KEY = "youleap-checkout-draft-v1"

const DRAFT_FIELDS = [
  "fullName",
  "email",
  "phone",
  "address",
  "apartment",
  "city",
  "postalCode",
  "country",
] as const

export type CheckoutDraft = Partial<Record<(typeof DRAFT_FIELDS)[number], string>>

/** Partial drafts are allowed; a refresh should not require a valid address. */
export function parseCheckoutDraft(raw: string | null): CheckoutDraft {
  if (!raw) return {}

  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== "object" || parsed === null) return {}

    const source = parsed as Record<string, unknown>
    const draft: CheckoutDraft = {}

    for (const field of DRAFT_FIELDS) {
      const value = source[field]
      if (typeof value !== "string") continue
      if (field === "country" && !(COUNTRIES as readonly string[]).includes(value)) continue
      draft[field] = value
    }

    return draft
  } catch {
    return {}
  }
}

export function serializeCheckoutDraft(input: Record<string, FormDataEntryValue>): string {
  const draft: CheckoutDraft = {}

  for (const field of DRAFT_FIELDS) {
    const value = input[field]
    if (typeof value === "string") draft[field] = value
  }

  return JSON.stringify(draft)
}
