import { describe, it, expect } from "vitest"
import { shouldRetryReport } from "./client-error-report"

describe("shouldRetryReport", () => {
  it("通信できなかったときは送り直す", () => {
    expect(shouldRetryReport({ status: null })).toBe(true)
    expect(shouldRetryReport({ status: 0 })).toBe(true)
    expect(shouldRetryReport({})).toBe(true)
  })

  it("サーバー側の失敗（5xx）は送り直す", () => {
    expect(shouldRetryReport({ status: 500 })).toBe(true)
    expect(shouldRetryReport({ status: 503 })).toBe(true)
  })

  it("回数制限・ログイン切れ・形の不備・成功は送り直さない", () => {
    expect(shouldRetryReport({ status: 429 })).toBe(false)
    expect(shouldRetryReport({ status: 401 })).toBe(false)
    expect(shouldRetryReport({ status: 400 })).toBe(false)
    expect(shouldRetryReport({ status: 200 })).toBe(false)
  })
})
