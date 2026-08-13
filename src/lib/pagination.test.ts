import { describe, expect, it } from "vitest"
import {
  PAGE_SIZE,
  catalogueSearchParams,
  pageToOffset,
  parsePage,
  previousPage,
} from "./pagination"

describe("parsePage", () => {
  it("defaults to the first page", () => {
    expect(parsePage(undefined)).toBe(1)
  })

  it("rejects zero, negatives, and garbage so they cannot become a NaN offset", () => {
    expect(parsePage("0")).toBe(1)
    expect(parsePage("-2")).toBe(1)
    expect(parsePage("abc")).toBe(1)
  })

  it("keeps a numeric page even when it is past the end of the catalogue", () => {
    expect(parsePage("99")).toBe(99)
  })
})

describe("previousPage", () => {
  it("rewinds a past-the-end page to the last real page", () => {
    expect(previousPage(99, 3)).toBe(3)
  })

  it("steps back one page when the request is in range", () => {
    expect(previousPage(3, 3)).toBe(2)
    expect(previousPage(2, 3)).toBe(1)
  })
})

describe("pageToOffset", () => {
  it("maps UI pages onto the API's skip count, not a page index", () => {
    expect(pageToOffset(1)).toBe(0)
    expect(pageToOffset(2)).toBe(PAGE_SIZE)
    expect(pageToOffset(3)).toBe(24)
  })
})

describe("catalogueSearchParams", () => {
  it("never sends `page`, which the API does not support", () => {
    const params = catalogueSearchParams({ page: 3 })

    expect(params.get("page")).toBeNull()
    expect(params.get("offset")).toBe("24")
    expect(params.get("limit")).toBe("12")
  })

  it("forwards filters the API actually understands", () => {
    const params = catalogueSearchParams({
      page: 1,
      q: "linen",
      collection: "home",
      tag: "footwear",
    })

    expect(params.get("q")).toBe("linen")
    expect(params.get("collection")).toBe("home")
    expect(params.get("tag")).toBe("footwear")
  })
})
