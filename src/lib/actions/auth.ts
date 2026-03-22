"use server"

import crypto from "crypto"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { sendInviteEmail, sendMagicLinkEmail } from "@/lib/email"
import { createCheckoutSession } from "@/lib/stripe"

export async function inviteTalent(email: string) {
  const session = await getSession()
  if (session.role !== "admin") return { error: "権限がありません" }

  const token = crypto.randomBytes(32).toString("hex")
  await prisma.authToken.create({
    data: {
      token,
      email,
      type: "INVITE",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  })

  await sendInviteEmail(email, token)
  return { success: true }
}

export async function requestMagicLink(email: string) {
  const talent = await prisma.talent.findFirst({
    where: { email, emailVerified: true },
    select: { id: true },
  })

  if (!talent) return { error: "このメールアドレスは登録されていません" }

  const token = crypto.randomBytes(32).toString("hex")
  await prisma.authToken.create({
    data: {
      token,
      email,
      type: "MAGIC_LINK",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  })

  await sendMagicLinkEmail(email, token)
  return { success: true }
}

export async function verifyToken(token: string) {
  const authToken = await prisma.authToken.findUnique({ where: { token } })

  if (!authToken || authToken.usedAt || authToken.expiresAt < new Date()) {
    return { error: "無効または期限切れのリンクです" }
  }

  await prisma.authToken.update({ where: { id: authToken.id }, data: { usedAt: new Date() } })

  if (authToken.type === "INVITE") {
    let talent = await prisma.talent.findFirst({
      where: { email: authToken.email },
      select: { id: true, stripeCustomerId: true, subscriptionStatus: true },
    })

    if (!talent) {
      talent = await prisma.talent.create({
        data: {
          name: authToken.email.split("@")[0],
          nameKana: "未設定",
          email: authToken.email,
          emailVerified: true,
        },
        select: { id: true, stripeCustomerId: true, subscriptionStatus: true },
      })
    } else {
      await prisma.talent.update({
        where: { id: talent.id },
        data: { emailVerified: true },
      })
    }

    const session = await getSession()
    session.talentId = talent.id
    session.role = "talent"
    await session.save()

    return { redirect: "/jobs" }
  }

  if (authToken.type === "MAGIC_LINK") {
    const talent = await prisma.talent.findFirst({
      where: { email: authToken.email, emailVerified: true },
      select: { id: true, subscriptionStatus: true, currentPeriodEnd: true },
    })

    if (!talent) return { error: "タレントが見つかりません" }

    const session = await getSession()
    session.talentId = talent.id
    session.role = "talent"
    await session.save()

    return { redirect: "/jobs" }
  }

  return { error: "不明なトークンタイプ" }
}

export async function adminLogin(password: string) {
  if (password !== process.env.ADMIN_PASSWORD) {
    return { error: "パスワードが正しくありません" }
  }

  const session = await getSession()
  session.role = "admin"
  await session.save()
  return { success: true }
}
