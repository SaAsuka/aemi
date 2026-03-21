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
      talent: { select: { id: true, name: true } },
      job: {
        select: {
          id: true,
          title: true,
          client: { select: { companyName: true } },
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

  await prisma.application.create({
    data: {
      talentId: data.talentId,
      jobId: data.jobId,
      status: data.status,
      note: data.note || null,
    },
  })

  revalidatePath("/admin/applications")
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
