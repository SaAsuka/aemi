import { describe, it, expect } from "vitest"
import { classifyUploadError } from "./upload-errors"

describe("classifyUploadError", () => {
  it("413（Vercel の HTML の応答）は大きすぎる", () => {
    const r = classifyUploadError({ status: 413, body: "<html>Request Entity Too Large</html>" })
    expect(r.kind).toBe("TOO_LARGE")
    expect(r.reason).toBe("TOO_LARGE")
  })

  it("受け口が返した理由を使う", () => {
    expect(classifyUploadError({ status: 400, body: { reason: "BAD_TYPE" } }).kind).toBe("BAD_TYPE")
    expect(classifyUploadError({ status: 400, body: { reason: "TOO_LARGE" } }).kind).toBe("TOO_LARGE")
  })

  it("応答が無い（XHR の onerror・Safari の Load failed・Chrome の Failed to fetch）は通信の問題", () => {
    expect(classifyUploadError({ status: 0 }).kind).toBe("NETWORK")
    expect(classifyUploadError({ error: new TypeError("Load failed") }).kind).toBe("NETWORK")
    expect(classifyUploadError({ error: new TypeError("Failed to fetch") }).kind).toBe("NETWORK")
  })

  it("30秒止まったら STALLED", () => {
    expect(classifyUploadError({ stalled: true, status: 0 }).kind).toBe("STALLED")
  })

  it("タレントが中止したものは記録しない", () => {
    const r = classifyUploadError({ aborted: true })
    expect(r.kind).toBe("ABORTED")
    expect(r.reason).toBeNull()
  })

  it("401・403 はログイン切れ", () => {
    expect(classifyUploadError({ status: 401 }).kind).toBe("UNAUTHORIZED")
    expect(classifyUploadError({ status: 403, body: "" }).kind).toBe("UNAUTHORIZED")
  })

  it("それ以外（本文が空の500など）はその他", () => {
    expect(classifyUploadError({ status: 500, body: "" }).kind).toBe("OTHER")
    expect(classifyUploadError({ status: 502, body: null }).kind).toBe("OTHER")
  })

  it("どの場合もタレント向けの文言がある", () => {
    for (const input of [{ status: 413 }, { status: 0 }, { stalled: true }, { status: 500 }]) {
      expect(classifyUploadError(input).message.length).toBeGreaterThan(0)
    }
  })
})
