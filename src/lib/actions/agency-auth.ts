"use server"

import crypto from "crypto"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import { getAgencySession } from "@/lib/agency-auth"
import { sendAgencyVerifyEmail } from "@/lib/email"

export async function registerAgency(formData: FormData) {
  const name = (formData.get("name") as string)?.trim()
  const email = (formData.get("email") as string)?.trim().toLowerCase()
  const password = formData.get("password") as string

  if (!name || !email || !password) return { error: "すべての項目を入力してください" }
  if (password.length < 8) return { error: "パスワードは8文字以上で入力してください" }

  const existing = await prisma.agency.findUnique({ where: { email }, select: { id: true } })
  if (existing) return { error: "このメールアドレスはすでに登録されています" }

  const passwordHash = await bcrypt.hash(password, 10)
  const verifyToken = crypto.randomBytes(32).toString("hex")

  await prisma.agency.create({
    data: { name, email, passwordHash, verifyToken, emailVerified: false },
  })

  try {
    await sendAgencyVerifyEmail(email, name, verifyToken)
  } catch (e) {
    console.error("[registerAgency] email send failed", e)
  }

  return { success: true }
}

export async function verifyAgencyEmail(token: string) {
  const agency = await prisma.agency.findUnique({
    where: { verifyToken: token },
    select: { id: true, emailVerified: true, onboardingCompleted: true },
  })

  if (!agency) return { error: "無効または期限切れのリンクです" }
  if (agency.emailVerified) return { error: "すでに確認済みです" }

  await prisma.agency.update({
    where: { id: agency.id },
    data: { emailVerified: true, verifyToken: null },
  })

  const session = await getAgencySession()
  session.agencyId = agency.id
  session.role = "agency_admin"
  await session.save()

  return { success: true, redirect: "/agency/onboarding" }
}

export async function agencyLogin(email: string, password: string) {
  const agency = await prisma.agency.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, passwordHash: true, emailVerified: true, onboardingCompleted: true, status: true },
  })

  if (!agency || !agency.passwordHash) return { error: "メールアドレスまたはパスワードが正しくありません" }
  if (agency.status === "SUSPENDED") return { error: "このアカウントは利用停止中です" }

  const valid = await bcrypt.compare(password, agency.passwordHash)
  if (!valid) return { error: "メールアドレスまたはパスワードが正しくありません" }

  if (!agency.emailVerified) return { error: "メールアドレスの確認が完了していません。確認メールをご確認ください" }

  const session = await getAgencySession()
  session.agencyId = agency.id
  session.role = "agency_admin"
  await session.save()

  const redirect = !agency.onboardingCompleted ? "/agency/onboarding" : "/agency/dashboard"
  return { success: true, redirect }
}

export async function agencyLogout() {
  const session = await getAgencySession()
  session.agencyId = undefined
  session.role = undefined
  await session.save()
  return { success: true }
}

export async function completeOnboarding(formData: FormData) {
  const session = await getAgencySession()
  if (!session.agencyId || session.role !== "agency_admin") return { error: "認証エラー" }

  const contactName = (formData.get("contactName") as string)?.trim() || null
  const contactPhone = (formData.get("contactPhone") as string)?.trim() || null
  const address = (formData.get("address") as string)?.trim() || null

  await prisma.agency.update({
    where: { id: session.agencyId },
    data: { contactName, contactPhone, address, onboardingCompleted: true },
  })

  return { success: true }
}
