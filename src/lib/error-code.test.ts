import { describe, it, expect } from "vitest"
import { makeErrorCode, isErrorCode } from "./error-code"

describe("makeErrorCode", () => {
  it("E- と6文字の形で作る", () => {
    for (let i = 0; i < 200; i++) {
      expect(makeErrorCode()).toMatch(/^E-[A-Z0-9]{6}$/)
    }
  })

  it("紛らわしい 0/O/1/I を使わない", () => {
    for (let i = 0; i < 500; i++) {
      expect(makeErrorCode().slice(2)).not.toMatch(/[0O1I]/)
    }
  })

  it("作った番号は isErrorCode を通る", () => {
    for (let i = 0; i < 100; i++) {
      expect(isErrorCode(makeErrorCode())).toBe(true)
    }
  })
})

describe("isErrorCode", () => {
  it("形が違うものは通さない", () => {
    expect(isErrorCode("E-7K2X9")).toBe(false)
    expect(isErrorCode("E-7K2X9QQ")).toBe(false)
    expect(isErrorCode("e-7k2x9q")).toBe(false)
    expect(isErrorCode("E-7K2X0Q")).toBe(false)
    expect(isErrorCode("X-7K2X9Q")).toBe(false)
    expect(isErrorCode(null)).toBe(false)
    expect(isErrorCode(123)).toBe(false)
  })
})
