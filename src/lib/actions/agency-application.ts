"use server"

import { revalidatePath, updateTag } from "next/cache"
import { del } from "@vercel/blob"
import { deleteFromStorage, isSupabaseStorageUrl } from "@/lib/supabase-storage"
import { prisma } from "@/lib/db"
import { applicationSchema } from "@/lib/validations/application"
import { requireAgencyAdmin } from "@/lib/agency-auth"
import { sendLinePush, buildStatusMessage } from "@/lib/line"

function buildAgencyAppWhere(agencyId: string, status?: string, jobId?: string, talentId?: string) {
  const where: Record<string, unknown> = {
    job: { agencyId },
  }
  if (status && status !== "ALL") where.status = status
  if (jobId) where.jobId = jobId
  if (talentId) where.talentId = talentId
  return where
}

export async function getAgencyApplicationCount(agencyId: string, status?: string, jobId?: string, talentId?: string) {
  return prisma.application.count({ where: buildAgencyAppWhere(agencyId, status, jobId, talentId) })
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
      id: true, title: true, deadline: true, fee: true,
      dates: { orderBy: { date: "asc" as const } },
    },
  },
  submissions: {
    select: {
      id: true, category: true, fileUrl: true, externalUrl: true, fileName: true,
    },
  },
  invoices: {
    select: { id: true, status: true },
    where: { status: { not: "CANCELLED" } },
    take: 1,
  },
} as const

export async function getAgencyApplications(
  agencyId: string,
  status?: string,
  jobId?: string,
  sort?: string,
  order?: string,
  page?: number,
  talentId?: string,
) {
  const where = buildAgencyAppWhere(agencyId, status, jobId, talentId)
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

export async function getAgencyApplication(id: string, agencyId: string) {
  return prisma.application.findFirst({
    where: { id, job: { agencyId } },
    include: {
      talent: true,
      job: { include: { client: true } },
      schedule: true,
    },
  })
}

const SUBMISSION_CATEGORIES = ["ACTING_VIDEO", "VOICE_SAMPLE", "PAST_WORK_VIDEO", "PROFILE_PHOTO"] as const

export async function createAgencyApplication(formData: FormData) {
  const agency = await requireAgencyAdmin()
  const raw = Object.fromEntries(formData)
  const parsed = applicationSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const data = parsed.data

  const job = await prisma.job.findFirst({ where: { id: data.jobId, agencyId: agency.id } })
  if (!job) return { error: { jobId: ["案件が見つかりません"] } }

  const existing = await prisma.application.findUnique({
    where: { talentId_jobId: { talentId: data.talentId, jobId: data.jobId } },
  })
  if (existing) {
    return { error: { jobId: ["このタレントは既にこの案件に応募済みです"] } }
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

  revalidatePath("/agency/applications")
  updateTag("talents")
  updateTag("jobs")
  return { success: true }
}

const NOTIFY_STATUSES = new Set(["RESUME_SENT", "ACCEPTED", "REJECTED"])

export async function updateAgencyApplicationStatus(id: string, status: string) {
  const agency = await requireAgencyAdmin()
  const validStatuses = ["APPLIED", "RESUME_SENT", "ACCEPTED", "REJECTED", "AUTO_REJECTED", "CANCELLED"]
  if (!validStatuses.includes(status)) {
    return { error: "無効なステータスです" }
  }

  const existing = await prisma.application.findFirst({
    where: { id, job: { agencyId: agency.id } },
  })
  if (!existing) return { error: "応募が見つかりません" }

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
    sendLinePush(application.talent.lineUserId, message).catch(() => {})
  }

  revalidatePath("/agency/applications")
  updateTag("talents")
  updateTag("jobs")
  return { success: true }
}

export async function bulkUpdateAgencyApplicationStatus(ids: string[], status: string) {
  const agency = await requireAgencyAdmin()
  const validStatuses = ["APPLIED", "RESUME_SENT", "ACCEPTED", "REJECTED", "AUTO_REJECTED", "CANCELLED"]
  if (!validStatuses.includes(status)) return { error: "無効なステータスです" }

  const decidedStatuses = ["ACCEPTED", "REJECTED", "AUTO_REJECTED", "CANCELLED"]
  const applications = await prisma.application.findMany({
    where: { id: { in: ids }, job: { agencyId: agency.id } },
    select: { id: true },
  })
  const validIds = applications.map((a) => a.id)
  if (validIds.length === 0) return { error: "対象の応募が見つかりません" }

  await prisma.application.updateMany({
    where: { id: { in: validIds } },
    data: {
      status: status as "APPLIED" | "RESUME_SENT" | "ACCEPTED" | "REJECTED" | "AUTO_REJECTED" | "CANCELLED",
      decidedAt: decidedStatuses.includes(status) ? new Date() : null,
    },
  })

  revalidatePath("/agency/applications")
  updateTag("talents")
  return { success: true }
}

export async function bulkDeleteAgencyApplications(ids: string[]) {
  const agency = await requireAgencyAdmin()
  const applications = await prisma.application.findMany({
    where: { id: { in: ids }, job: { agencyId: agency.id } },
    select: { id: true },
  })
  const validIds = applications.map((a) => a.id)
  if (validIds.length === 0) return { error: "対象の応募が見つかりません" }

  await prisma.application.deleteMany({ where: { id: { in: validIds } } })
  revalidatePath("/agency/applications")
  updateTag("talents")
  return { success: true }
}

export async function deleteAgencyApplication(id: string) {
  const agency = await requireAgencyAdmin()

  const existing = await prisma.application.findFirst({
    where: { id, job: { agencyId: agency.id } },
  })
  if (!existing) return { error: "応募が見つかりません" }

  const submissions = await prisma.applicationSubmission.findMany({
    where: { applicationId: id },
    select: { fileUrl: true },
  })
  await prisma.application.delete({ where: { id } })
  const allUrls = submissions.map((s) => s.fileUrl).filter((url): url is string => !!url)
  const vercelUrls = allUrls.filter((u) => u.includes("blob.vercel-storage.com"))
  const supabaseUrls = allUrls.filter((u) => isSupabaseStorageUrl(u))
  if (vercelUrls.length > 0) await del(vercelUrls).catch(() => {})
  if (supabaseUrls.length > 0) await deleteFromStorage(supabaseUrls).catch(() => {})
  revalidatePath("/agency/applications")
  updateTag("talents")
  updateTag("jobs")
  return { success: true }
}
