"use server"

import { revalidatePath, updateTag } from "next/cache"
import { prisma } from "@/lib/db"
import { applicationSchema } from "@/lib/validations/application"

export async function getApplications(status?: string, jobId?: string) {
  const where: Record<string, unknown> = {}

  if (status && status !== "ALL") {
    where.status = status
  }
  if (jobId) {
    where.jobId = jobId
  }

  return prisma.application.findMany({
    where,
    orderBy: { appliedAt: "desc" },
    select: {
      id: true,
      status: true,
      appliedAt: true,
      talent: {
        select: {
          id: true, name: true,
          birthDate: true, height: true, gender: true,
          nearestStation: true, resume: true,
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
    },
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

export async function updateApplicationStatus(id: string, status: string) {
  const validStatuses = ["APPLIED", "RESUME_SENT", "ACCEPTED", "REJECTED", "AUTO_REJECTED", "CANCELLED"]
  if (!validStatuses.includes(status)) {
    return { error: "無効なステータスです" }
  }

  const decidedStatuses = ["ACCEPTED", "REJECTED", "AUTO_REJECTED", "CANCELLED"]

  await prisma.application.update({
    where: { id },
    data: {
      status: status as "APPLIED" | "RESUME_SENT" | "ACCEPTED" | "REJECTED" | "AUTO_REJECTED" | "CANCELLED",
      decidedAt: decidedStatuses.includes(status) ? new Date() : null,
    },
  })

  revalidatePath("/admin/applications")
  updateTag("talents")
  updateTag("jobs")
  return { success: true }
}

export async function deleteApplication(id: string) {
  await prisma.application.delete({ where: { id } })
  revalidatePath("/admin/applications")
  updateTag("talents")
  updateTag("jobs")
  return { success: true }
}
