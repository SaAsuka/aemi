"use server"

import { revalidatePath, updateTag } from "next/cache"
import { prisma } from "@/lib/db"
import { applicationSchema } from "@/lib/validations/application"
import { sendLinePush, buildStatusMessage } from "@/lib/line"

function buildAppWhere(status?: string, jobId?: string) {
  const where: Record<string, unknown> = {}
  if (status && status !== "ALL") where.status = status
  if (jobId) where.jobId = jobId
  return where
}

export async function getApplicationCount(status?: string, jobId?: string) {
  return prisma.application.count({ where: buildAppWhere(status, jobId) })
}

const APP_SELECT = {
  id: true,
  status: true,
  appliedAt: true,
  talent: {
    select: {
      id: true, name: true,
      birthDate: true, height: true, gender: true,
      nearestStation: true, resume: true,
      profileImage: true,
    },
  },
  job: {
    select: {
      id: true, title: true, deadline: true,
      dates: { orderBy: { date: "asc" as const } },
    },
  },
  submissions: {
    select: {
      id: true, category: true, fileUrl: true, externalUrl: true, fileName: true,
    },
  },
} as const

export async function getApplications(status?: string, jobId?: string, sort?: string, order?: string, page?: number) {
  const where = buildAppWhere(status, jobId)
  const sortOrder: "asc" | "desc" = order === "asc" ? "asc" : "desc"
  const pageSize = 50
  const currentPage = page ?? 1

  if (sort === "talent") {
    return prisma.application.findMany({
      where,
      orderBy: { talent: { name: sortOrder } },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
      select: APP_SELECT,
    })
  }
  if (sort === "job") {
    return prisma.application.findMany({
      where,
      orderBy: { job: { title: sortOrder } },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
      select: APP_SELECT,
    })
  }
  if (sort === "status") {
    return prisma.application.findMany({
      where,
      orderBy: { status: sortOrder },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
      select: APP_SELECT,
    })
  }
  return prisma.application.findMany({
    where,
    orderBy: { appliedAt: sortOrder },
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
    select: APP_SELECT,
  })
}

export async function getApplication(id: string) {
  return prisma.application.findUnique({
    where: { id },
    include: {
      talent: true,
      job: { include: { client: true } },
      schedule: true,
    },
  })
}

const SUBMISSION_CATEGORIES = ["ACTING_VIDEO", "VOICE_SAMPLE", "PAST_WORK_VIDEO", "PROFILE_PHOTO"] as const

export async function createApplication(formData: FormData) {
  const raw = Object.fromEntries(formData)
  const parsed = applicationSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const data = parsed.data

  const existing = await prisma.application.findUnique({
    where: { talentId_jobId: { talentId: data.talentId, jobId: data.jobId } },
  })
  if (existing) {
    return { error: { jobId: ["このタレントは既にこの案件に応募済みです"] } }
  }

  const jobDates = await prisma.jobDate.findMany({
    where: { jobId: data.jobId },
    select: { date: true, type: true },
  })

  if (jobDates.length > 0) {
    const jobDateStrings = new Set(jobDates.map((d) => d.date.toISOString().split("T")[0]))

    const activeApps = await prisma.application.findMany({
      where: {
        talentId: data.talentId,
        status: { in: ["APPLIED", "RESUME_SENT", "ACCEPTED"] },
        jobId: { not: data.jobId },
      },
      select: {
        job: {
          select: {
            title: true,
            dates: { select: { date: true, type: true } },
          },
        },
      },
    })

    const typeLabels: Record<string, string> = {
      AUDITION: "オーディション",
      SHOOTING: "撮影",
      OTHER: "予定",
    }

    for (const app of activeApps) {
      for (const existingDate of app.job.dates) {
        const dateStr = existingDate.date.toISOString().split("T")[0]
        if (jobDateStrings.has(dateStr)) {
          const d = new Date(dateStr)
          const label = `${d.getMonth() + 1}月${d.getDate()}日`
          const typeLabel = typeLabels[existingDate.type] ?? "予定"
          return {
            error: {
              jobId: [`${label}に別の案件（${app.job.title}）の${typeLabel}があるため応募できません`],
            },
          }
        }
      }
    }
  }

  const requirements = await prisma.jobRequirement.findMany({
    where: { jobId: data.jobId },
  })

  for (const req of requirements) {
    const fileUrl = formData.get(`sub_${req.category}_fileUrl`) as string
    const externalUrl = formData.get(`sub_${req.category}_externalUrl`) as string
    if (!fileUrl && !externalUrl) {
      return { error: { jobId: ["提出物が不足しています"] } }
    }
  }

  const submissions: {
    category: (typeof SUBMISSION_CATEGORIES)[number]
    fileUrl: string | null
    externalUrl: string | null
    fileName: string | null
  }[] = []

  for (const cat of SUBMISSION_CATEGORIES) {
    const fileUrl = (formData.get(`sub_${cat}_fileUrl`) as string) || null
    const externalUrl = (formData.get(`sub_${cat}_externalUrl`) as string) || null
    const fileName = (formData.get(`sub_${cat}_fileName`) as string) || null
    if (fileUrl || externalUrl) {
      submissions.push({ category: cat, fileUrl, externalUrl, fileName })
    }
  }

  await prisma.application.create({
    data: {
      talentId: data.talentId,
      jobId: data.jobId,
      status: data.status,
      note: data.note || null,
      submissions: {
        create: submissions,
      },
    },
  })

  revalidatePath("/admin/applications")
  revalidatePath("/jobs")
  updateTag("talents")
  updateTag("jobs")
  return { success: true }
}

const NOTIFY_STATUSES = new Set(["RESUME_SENT", "ACCEPTED", "REJECTED"])

export async function updateApplicationStatus(id: string, status: string) {
  const validStatuses = ["APPLIED", "RESUME_SENT", "ACCEPTED", "REJECTED", "AUTO_REJECTED", "CANCELLED"]
  if (!validStatuses.includes(status)) {
    return { error: "無効なステータスです" }
  }

  const decidedStatuses = ["ACCEPTED", "REJECTED", "AUTO_REJECTED", "CANCELLED"]

  const application = await prisma.application.update({
    where: { id },
    data: {
      status: status as "APPLIED" | "RESUME_SENT" | "ACCEPTED" | "REJECTED" | "AUTO_REJECTED" | "CANCELLED",
      decidedAt: decidedStatuses.includes(status) ? new Date() : null,
    },
    select: {
      talent: { select: { lineUserId: true, lineNotifyEnabled: true } },
      job: { select: { id: true, title: true } },
      schedule: { select: { date: true, startTime: true, endTime: true, location: true } },
    },
  })

  if (NOTIFY_STATUSES.has(status) && application.talent.lineUserId && application.talent.lineNotifyEnabled) {
    const message = buildStatusMessage(status, application.job.title, application.job.id, application.schedule)
    sendLinePush(application.talent.lineUserId, message).catch((err) => {
      console.error("[LINE] ステータス通知送信エラー:", err)
    })
  }

  revalidatePath("/admin/applications")
  updateTag("talents")
  updateTag("jobs")
  return { success: true }
}

export async function bulkUpdateApplicationStatus(ids: string[], status: string) {
  const validStatuses = ["APPLIED", "RESUME_SENT", "ACCEPTED", "REJECTED", "AUTO_REJECTED", "CANCELLED"]
  if (!validStatuses.includes(status)) return { error: "無効なステータスです" }
  if (ids.length === 0) return { error: "対象が選択されていません" }

  const decidedStatuses = ["ACCEPTED", "REJECTED", "AUTO_REJECTED", "CANCELLED"]
  await prisma.application.updateMany({
    where: { id: { in: ids } },
    data: {
      status: status as "APPLIED" | "RESUME_SENT" | "ACCEPTED" | "REJECTED" | "AUTO_REJECTED" | "CANCELLED",
      decidedAt: decidedStatuses.includes(status) ? new Date() : null,
    },
  })
  revalidatePath("/admin/applications")
  updateTag("talents")
  updateTag("jobs")
  return { success: true, count: ids.length }
}

export async function bulkDeleteApplications(ids: string[]) {
  if (ids.length === 0) return { error: "対象が選択されていません" }
  await prisma.application.deleteMany({ where: { id: { in: ids } } })
  revalidatePath("/admin/applications")
  updateTag("talents")
  updateTag("jobs")
  return { success: true, count: ids.length }
}

export async function deleteApplication(id: string) {
  await prisma.application.delete({ where: { id } })
  revalidatePath("/admin/applications")
  updateTag("talents")
  updateTag("jobs")
  return { success: true }
}
