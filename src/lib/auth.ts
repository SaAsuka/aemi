import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getIronSession } from "iron-session"
import { sessionOptions, type SessionData } from "./session"
import { prisma } from "./db"

export async function getSession() {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions)
}

export async function requireAdmin() {
  const session = await getSession()
  if (session.role !== "admin") redirect("/admin/login")
  return session
}

export async function requireTalentRaw() {
  const session = await getSession()
  if (!session.talentId || session.role !== "talent") redirect("/auth/login")

  const talent = await prisma.talent.findUnique({
    where: { id: session.talentId },
    select: {
      id: true,
      name: true,
      nameKana: true,
      stageName: true,
      category: true,
      status: true,
      gender: true,
      birthDate: true,
      height: true,
      email: true,
      mustChangePassword: true,
      subscription: {
        select: { status: true, currentPeriodEnd: true, stripeCustomerId: true },
      },
    },
  })

  if (!talent || talent.status !== "ACTIVE") redirect("/auth/login")
  return talent
}

export async function requireTalent() {
  const talent = await requireTalentRaw()
  if (talent.nameKana === "未設定") redirect("/setup")
  if (talent.mustChangePassword) redirect("/mypage/settings")
  return talent
}

export function isSubscriptionActive(talent: { subscription?: { status: string; currentPeriodEnd: Date | null } | null }) {
  if (!talent.subscription) return false
  if (talent.subscription.status === "ACTIVE") return true
  if (talent.subscription.status === "CANCELED" && talent.subscription.currentPeriodEnd && talent.subscription.currentPeriodEnd > new Date()) return true
  return false
}
