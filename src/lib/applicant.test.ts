import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/auth", () => ({ getSession: vi.fn() }))
vi.mock("@/lib/db", () => ({ prisma: {} }))

import { decideApplicant } from "./applicant"

const talentSession = { role: "talent", talentId: "talent-A" }
const adminSession = { role: "admin" }
const noSession = {}

describe("decideApplicant", () => {
  it("タレントがフォームで他人の talentId・合格を送っても、ログイン中の本人・応募中になる", () => {
    const d = decideApplicant({ session: talentSession, tokenTalent: null, formTalentId: "talent-B", formStatus: "ACCEPTED" })
    expect(d).toMatchObject({ ok: true, talentId: "talent-A", status: "APPLIED", requireResume: true, isAdminProxy: false, via: "session" })
  })

  it("専用リンクで開いたらリンクの本人・応募中になる", () => {
    const d = decideApplicant({ session: noSession, tokenTalent: { id: "talent-T", status: "ACTIVE" }, formTalentId: "talent-B", formStatus: "ACCEPTED" })
    expect(d).toMatchObject({ ok: true, talentId: "talent-T", status: "APPLIED", requireResume: true, isAdminProxy: false, via: "token" })
  })

  it("リンクとログインが両方あればリンクの本人（応募画面と同じ）", () => {
    const d = decideApplicant({ session: talentSession, tokenTalent: { id: "talent-T", status: "ACTIVE" } })
    expect(d).toMatchObject({ ok: true, talentId: "talent-T" })
  })

  it("無効なリンク（退会など）はリンクとして扱わない", () => {
    expect(decideApplicant({ session: noSession, tokenTalent: { id: "talent-T", status: "INACTIVE" } })).toEqual({ ok: false })
    const d = decideApplicant({ session: talentSession, tokenTalent: { id: "talent-T", status: "INACTIVE" } })
    expect(d).toMatchObject({ ok: true, talentId: "talent-A", via: "session" })
  })

  it("ログインもリンクもなければ拒否", () => {
    expect(decideApplicant({ session: noSession, tokenTalent: null, formTalentId: "talent-B" })).toEqual({ ok: false })
    expect(decideApplicant({ session: { role: "talent" }, tokenTalent: null })).toEqual({ ok: false })
  })

  it("管理者はフォームのタレント・状態を使い、コンポジ不問の代理応募になる", () => {
    const d = decideApplicant({ session: adminSession, tokenTalent: null, formTalentId: "talent-B", formStatus: "ACCEPTED" })
    expect(d).toEqual({ ok: true, talentId: "talent-B", status: "ACCEPTED", requireResume: false, isAdminProxy: true, via: "admin" })
  })

  it("管理者でも状態がなければ応募中、タレントの指定がなければ拒否", () => {
    expect(decideApplicant({ session: adminSession, tokenTalent: null, formTalentId: "talent-B" })).toMatchObject({ ok: true, status: "APPLIED" })
    expect(decideApplicant({ session: adminSession, tokenTalent: null })).toEqual({ ok: false })
  })
})
