"use server"

import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function seedVozelAgency(name: string, email: string) {
  const session = await getSession()
  if (session.role !== "admin") return { error: "権限がありません" }

  if (!name || !email) return { error: "事務所名とメールアドレスを入力してください" }

  const existing = await prisma.agency.findUnique({ where: { email } })
  if (existing) {
    const updated = await prisma.$transaction([
      prisma.talent.updateMany({ where: { agencyId: null }, data: { agencyId: existing.id } }),
      prisma.job.updateMany({ where: { agencyId: null }, data: { agencyId: existing.id } }),
      prisma.client.updateMany({ where: { agencyId: null }, data: { agencyId: existing.id } }),
      prisma.option.updateMany({ where: { agencyId: null }, data: { agencyId: existing.id } }),
    ])
    const total = updated.reduce((sum, r) => sum + r.count, 0)
    return { success: true, agencyId: existing.id, updated: total, message: "既存の代理店レコードを使用しました" }
  }

  const agency = await prisma.agency.create({
    data: {
      name,
      email,
      emailVerified: true,
      onboardingCompleted: true,
      status: "ACTIVE",
    },
  })

  const results = await prisma.$transaction([
    prisma.talent.updateMany({ where: { agencyId: null }, data: { agencyId: agency.id } }),
    prisma.job.updateMany({ where: { agencyId: null }, data: { agencyId: agency.id } }),
    prisma.client.updateMany({ where: { agencyId: null }, data: { agencyId: agency.id } }),
    prisma.option.updateMany({ where: { agencyId: null }, data: { agencyId: agency.id } }),
  ])

  const total = results.reduce((sum, r) => sum + r.count, 0)
  return { success: true, agencyId: agency.id, updated: total, message: `代理店を作成し、${total}件のデータを紐付けました` }
}
