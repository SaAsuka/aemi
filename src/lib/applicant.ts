// 「誰として応募・アップロードするか」を、送られてきた値ではなく受け付け側で決める。
// 送られてきた talentId / status を信じると、他人になりすまして応募したり、自分で「合格」を作れてしまうため。
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"

type SessionLike = { role?: string; talentId?: string }
type TokenTalent = { id: string; status: string } | null

export type ApplicantDecision =
  | {
      ok: true
      talentId: string
      // 応募の状態。タレントからの応募は常に APPLIED（管理者の代理応募だけ選べる）
      status: string
      // コンポジット登録を必須にするか（代理応募は今までどおり問わない）
      requireResume: boolean
      isAdminProxy: boolean
      via: "admin" | "token" | "session"
    }
  | { ok: false }

// 優先順は 管理者 → 専用リンク → タレントのログイン（応募画面と同じく、リンクで開いたらリンクの本人）
export function decideApplicant(input: {
  session: SessionLike
  tokenTalent: TokenTalent
  formTalentId?: string | null
  formStatus?: string | null
}): ApplicantDecision {
  const { session, tokenTalent, formTalentId, formStatus } = input

  if (session.role === "admin") {
    if (!formTalentId) return { ok: false }
    return {
      ok: true,
      talentId: formTalentId,
      status: formStatus || "APPLIED",
      requireResume: false,
      isAdminProxy: true,
      via: "admin",
    }
  }

  if (tokenTalent && tokenTalent.status === "ACTIVE") {
    return { ok: true, talentId: tokenTalent.id, status: "APPLIED", requireResume: true, isAdminProxy: false, via: "token" }
  }

  if (session.role === "talent" && session.talentId) {
    return { ok: true, talentId: session.talentId, status: "APPLIED", requireResume: true, isAdminProxy: false, via: "session" }
  }

  return { ok: false }
}

async function findTokenTalent(t: string | null | undefined): Promise<TokenTalent> {
  if (!t) return null
  return prisma.talent.findUnique({ where: { accessToken: t }, select: { id: true, status: true } })
}

// 応募の送信（FormData）用
export async function resolveApplicant(formData: FormData): Promise<ApplicantDecision> {
  const session = await getSession()
  const t = formData.get("t")
  const tokenTalent = session.role === "admin" ? null : await findTokenTalent(typeof t === "string" ? t : null)
  const formTalentId = formData.get("talentId")
  const formStatus = formData.get("status")
  const decision = decideApplicant({
    session: { role: session.role, talentId: session.talentId },
    tokenTalent,
    formTalentId: typeof formTalentId === "string" ? formTalentId : null,
    formStatus: typeof formStatus === "string" ? formStatus : null,
  })
  return confirmActive(decision)
}

// JSON で受け取る口（アップロードURLの発行・失敗の報告）用。talentId は管理者のときだけ採用する
export async function resolveRequester(input: { t?: string | null; talentId?: string | null }): Promise<ApplicantDecision> {
  const session = await getSession()
  const tokenTalent = session.role === "admin" ? null : await findTokenTalent(input.t)
  const decision = decideApplicant({
    session: { role: session.role, talentId: session.talentId },
    tokenTalent,
    formTalentId: input.talentId ?? null,
    formStatus: null,
  })
  return confirmActive(decision)
}

// ログイン中でも、退会・停止したタレントとしては受け付けない（応募画面の requireTalent と同じ）
async function confirmActive(decision: ApplicantDecision): Promise<ApplicantDecision> {
  if (!decision.ok || decision.isAdminProxy) return decision
  const talent = await prisma.talent.findUnique({ where: { id: decision.talentId }, select: { status: true } })
  return talent?.status === "ACTIVE" ? decision : { ok: false }
}
