"use server"

import { prisma } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { formatDate } from "@/lib/utils/date"
import {
  TALENT_STATUS_LABELS,
  GENDER_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
  JOB_STATUS_LABELS,
  APPLICATION_STATUS_LABELS,
} from "@/types"

const BOM = "\uFEFF"

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function buildCsv(headers: string[], rows: string[][]): string {
  const headerLine = headers.map(escapeCsv).join(",")
  const dataLines = rows.map((row) => row.map(escapeCsv).join(","))
  return BOM + [headerLine, ...dataLines].join("\n")
}

export async function exportTalentsCsv(): Promise<string> {
  await requireAdmin()

  const talents = await prisma.talent.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      name: true,
      nameKana: true,
      gender: true,
      birthDate: true,
      height: true,
      status: true,
      lineUserId: true,
      subscription: { select: { status: true } },
    },
  })

  const headers = ["名前", "フリガナ", "性別", "生年月日", "身長", "ステータス", "LINE連携", "サブスク状態"]
  const rows = talents.map((t) => [
    t.name,
    t.nameKana ?? "",
    t.gender ? GENDER_LABELS[t.gender] ?? "" : "",
    t.birthDate ? formatDate(t.birthDate) : "",
    t.height ? String(t.height) : "",
    TALENT_STATUS_LABELS[t.status] ?? t.status,
    t.lineUserId ? "連携済" : "未連携",
    SUBSCRIPTION_STATUS_LABELS[t.subscription?.status ?? "NONE"] ?? "未契約",
  ])

  return buildCsv(headers, rows)
}

export async function exportJobsCsv(): Promise<string> {
  await requireAdmin()

  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      title: true,
      fee: true,
      deadline: true,
      status: true,
      _count: { select: { applications: true } },
    },
  })

  const headers = ["案件名", "報酬", "締切", "ステータス", "応募数"]
  const rows = jobs.map((j) => [
    j.title,
    j.fee ? `¥${j.fee.toLocaleString()}` : "",
    j.deadline ? formatDate(j.deadline) : "",
    JOB_STATUS_LABELS[j.status] ?? j.status,
    String(j._count.applications),
  ])

  return buildCsv(headers, rows)
}

export async function exportApplicationsCsv(): Promise<string> {
  await requireAdmin()

  const applications = await prisma.application.findMany({
    orderBy: { appliedAt: "desc" },
    select: {
      status: true,
      appliedAt: true,
      talent: { select: { name: true } },
      job: { select: { title: true } },
    },
  })

  const headers = ["タレント名", "案件名", "ステータス", "応募日"]
  const rows = applications.map((a) => [
    a.talent.name,
    a.job.title,
    APPLICATION_STATUS_LABELS[a.status] ?? a.status,
    formatDate(a.appliedAt),
  ])

  return buildCsv(headers, rows)
}
