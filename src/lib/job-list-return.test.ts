import { describe, it, expect } from "vitest"
import { isJobListUrl } from "./job-list-return"

describe("isJobListUrl", () => {
  it("タレントの案件一覧（条件つき含む）だけを戻り先にする", () => {
    expect(isJobListUrl("/jobs")).toBe(true)
    expect(isJobListUrl("/jobs?t=abc&filter=match&sort=deadline")).toBe(true)
  })

  it("案件ページ・別の画面・外のサイトは戻り先にしない", () => {
    expect(isJobListUrl("/jobs/abc")).toBe(false)
    expect(isJobListUrl("/mypage")).toBe(false)
    expect(isJobListUrl("https://evil.example.com/jobs")).toBe(false)
    expect(isJobListUrl("//evil.example.com/jobs")).toBe(false)
    expect(isJobListUrl(null)).toBe(false)
  })
})
