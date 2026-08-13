import { describe, expect, it } from "vitest"
import { createOrderReference, parseCheckoutDraft, serializeCheckoutDraft, validateShipping } from "./checkout"

const valid = {
  fullName: "Dor Tal",
  email: "dor@example.com",
  phone: "+972 52 123 4567",
  address: "12 Rothschild Blvd",
  apartment: "",
  city: "Tel Aviv",
  postalCode: "6688218",
  country: "Israel",
}

function errorsFor(overrides: Record<string, string>) {
  const result = validateShipping({ ...valid, ...overrides })
  return result.success ? {} : result.errors
}

describe("validateShipping", () => {
  it("accepts a complete address", () => {
    expect(validateShipping(valid).success).toBe(true)
  })

  it("treats apartment as optional", () => {
    const { apartment: _apartment, ...withoutApartment } = valid
    expect(validateShipping(withoutApartment).success).toBe(true)
  })

  it("trims surrounding whitespace before validating", () => {
    const result = validateShipping({ ...valid, city: "  Tel Aviv  " })

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.city).toBe("Tel Aviv")
  })

  it("rejects whitespace-only required fields", () => {
    expect(errorsFor({ city: "   " }).city).toBeDefined()
  })

  it("rejects a malformed email", () => {
    expect(errorsFor({ email: "dor@" }).email).toBe("Enter a valid email address")
  })

  it("rejects a phone number that is too short", () => {
    expect(errorsFor({ phone: "123" }).phone).toBeDefined()
  })

  it("accepts international and local phone formats", () => {
    expect(errorsFor({ phone: "052-123-4567" }).phone).toBeUndefined()
    expect(errorsFor({ phone: "(052) 1234567" }).phone).toBeUndefined()
  })

  it("rejects an unsupported country", () => {
    expect(errorsFor({ country: "Atlantis" }).country).toBe("Select a country")
  })

  it("rejects a postal code with punctuation", () => {
    expect(errorsFor({ postalCode: "66$88" }).postalCode).toBeDefined()
  })

  it("reports every invalid field at once", () => {
    const errors = errorsFor({ fullName: "", email: "no", postalCode: "!" })

    expect(Object.keys(errors).sort()).toEqual(["email", "fullName", "postalCode"])
  })

  it("reports at most one message per field", () => {
    const errors = errorsFor({ fullName: "" })

    expect(typeof errors.fullName).toBe("string")
  })
})

describe("createOrderReference", () => {
  it("produces a prefixed reference", () => {
    expect(createOrderReference()).toMatch(/^YL-[0-9A-Z]+-[0-9A-Z]{4}$/)
  })

  it("does not repeat", () => {
    expect(createOrderReference()).not.toBe(createOrderReference())
  })
})

describe("checkout draft", () => {
  it("round-trips known fields", () => {
    const raw = serializeCheckoutDraft({
      fullName: "Dor Tal",
      email: "dor@example.com",
      country: "Israel",
    })

    expect(parseCheckoutDraft(raw)).toEqual({
      fullName: "Dor Tal",
      email: "dor@example.com",
      country: "Israel",
    })
  })

  it("keeps a partial draft", () => {
    expect(parseCheckoutDraft('{"fullName":"Dor"}')).toEqual({ fullName: "Dor" })
  })

  it("drops unknown keys and invalid countries", () => {
    expect(parseCheckoutDraft('{"fullName":"Dor","card":"4111","country":"Atlantis"}')).toEqual({
      fullName: "Dor",
    })
  })

  it("returns empty for missing or corrupt storage", () => {
    expect(parseCheckoutDraft(null)).toEqual({})
    expect(parseCheckoutDraft("not json")).toEqual({})
  })
})
