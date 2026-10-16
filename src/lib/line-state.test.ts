import { describe, it, expect } from "vitest"
import { createLineState, verifyLineState, LINE_STATE_TTL_MS } from "./line-state"

const SECRET = "test-secret-at-least-32-characters-long"
const NOW = 1_800_000_000_000

describe("LINE連携のstate", () => {
  it("作ったstateを検証すると、talentIdと戻り先が取り出せる", () => {
    const state = createLineState("talent_1", "/welcome", SECRET, NOW)
    expect(verifyLineState(state, SECRET, NOW)).toEqual({ talentId: "talent_1", returnTo: "/welcome" })
  })

  it("有効期限ちょうどまでは通り、1ミリ秒でも過ぎたら無効", () => {
    const state = createLineState("talent_1", "", SECRET, NOW)
    expect(verifyLineState(state, SECRET, NOW + LINE_STATE_TTL_MS)).not.toBeNull()
    expect(verifyLineState(state, SECRET, NOW + LINE_STATE_TTL_MS + 1)).toBeNull()
  })

  it("有効期限は3分", () => {
    expect(LINE_STATE_TTL_MS).toBe(3 * 60 * 1000)
  })

  it("別の秘密鍵では検証できない", () => {
    const state = createLineState("talent_1", "", SECRET, NOW)
    expect(verifyLineState(state, "another-secret-at-least-32-characters", NOW)).toBeNull()
  })

  it("中身（talentId）を書き換えると無効になる", () => {
    const state = createLineState("talent_1", "", SECRET, NOW)
    const [body, sig] = state.split(".")
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"))
    payload.t = "talent_victim"
    const forged = `${Buffer.from(JSON.stringify(payload)).toString("base64url")}.${sig}`
    expect(verifyLineState(forged, SECRET, NOW)).toBeNull()
  })

  it("有効期限を書き換えて延長しても無効になる", () => {
    const state = createLineState("talent_1", "", SECRET, NOW)
    const [body, sig] = state.split(".")
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"))
    payload.e = NOW + 24 * 60 * 60 * 1000
    const forged = `${Buffer.from(JSON.stringify(payload)).toString("base64url")}.${sig}`
    expect(verifyLineState(forged, SECRET, NOW + LINE_STATE_TTL_MS + 1)).toBeNull()
  })

  it("壊れた形式は無効", () => {
    expect(verifyLineState("", SECRET, NOW)).toBeNull()
    expect(verifyLineState("abc", SECRET, NOW)).toBeNull()
    expect(verifyLineState("a.b.c", SECRET, NOW)).toBeNull()
    expect(verifyLineState("旧形式のランダムなhex文字列", SECRET, NOW)).toBeNull()
  })

  it("外部サイトへの戻り先は捨てる（オープンリダイレクト対策）", () => {
    for (const returnTo of ["https://evil.example.com", "//evil.example.com", "javascript:alert(1)"]) {
      const state = createLineState("talent_1", returnTo, SECRET, NOW)
      expect(verifyLineState(state, SECRET, NOW)?.returnTo).toBe("")
    }
  })

  it("同じ人でも毎回違うstateになる", () => {
    expect(createLineState("talent_1", "", SECRET, NOW)).not.toBe(createLineState("talent_1", "", SECRET, NOW))
  })
})
