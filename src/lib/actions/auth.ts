"use server"

import crypto from "crypto"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { sendInviteEmail, sendPasswordResetEmail } from "@/lib/email"

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

export async function passwordLogin(email: string, password: string) {
  const talent = await prisma.talent.findFirst({
    where: { email, emailVerified: true },
    select: { id: true, passwordHash: true, nameKana: true },
  })

  if (!talent) return { error: "メールアドレスまたはパスワードが正しくありません" }

  if (!talent.passwordHash) {
    return { error: "NO_PASSWORD" }
  }

  const valid = await bcrypt.compare(password, talent.passwordHash)
  if (!valid) return { error: "メールアドレスまたはパスワードが正しくありません" }

  const session = await getSession()
  session.talentId = talent.id
  session.role = "talent"
  await session.save()

  return {
    success: true,
    redirect: talent.nameKana === "未設定" ? "/setup" : "/mypage",
  }
}

export async function requestPasswordReset(email: string) {
  const talent = await prisma.talent.findFirst({
    where: { email, emailVerified: true },
    select: { id: true },
  })

  if (!talent) {
    return { success: true }
  }

  const token = crypto.randomBytes(32).toString("hex")
  await prisma.authToken.create({
    data: {
      token,
      email,
      type: "PASSWORD_RESET",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  })

  await sendPasswordResetEmail(email, token)
  return { success: true }
}

export async function resetPassword(token: string, password: string) {
  const authToken = await prisma.authToken.findUnique({ where: { token } })

  if (!authToken || authToken.usedAt || authToken.expiresAt < new Date()) {
    return { error: "無効または期限切れのリンクです" }
  }

  if (authToken.type !== "PASSWORD_RESET") {
    return { error: "無効なトークンです" }
  }

  const talent = await prisma.talent.findFirst({
    where: { email: authToken.email, emailVerified: true },
    select: { id: true, nameKana: true },
  })

  if (!talent) return { error: "タレントが見つかりません" }

  const passwordHash = await bcrypt.hash(password, 10)

  await prisma.$transaction([
    prisma.authToken.update({ where: { id: authToken.id }, data: { usedAt: new Date() } }),
    prisma.talent.update({ where: { id: talent.id }, data: { passwordHash } }),
  ])

  const session = await getSession()
  session.talentId = talent.id
  session.role = "talent"
  await session.save()

  return {
    success: true,
    redirect: talent.nameKana === "未設定" ? "/setup" : "/mypage",
  }
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const session = await getSession()
  if (!session.talentId || session.role !== "talent") {
    return { error: "認証エラー" }
  }

  const talent = await prisma.talent.findUnique({
    where: { id: session.talentId },
    select: { passwordHash: true },
  })

  if (!talent || !talent.passwordHash) {
    return { error: "パスワードが設定されていません" }
  }

  const valid = await bcrypt.compare(currentPassword, talent.passwordHash)
  if (!valid) return { error: "現在のパスワードが正しくありません" }

  const passwordHash = await bcrypt.hash(newPassword, 10)
  await prisma.talent.update({
    where: { id: session.talentId },
    data: { passwordHash },
  })

  return { success: true }
}

export async function verifyToken(token: string) {
  const authToken = await prisma.authToken.findUnique({ where: { token } })

  if (!authToken || authToken.usedAt || authToken.expiresAt < new Date()) {
    return { error: "無効または期限切れのリンクです" }
  }

  if (authToken.type === "PASSWORD_RESET") {
    return { redirect: `/auth/reset-password?token=${token}` }
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

    return { redirect: "/setup" }
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
