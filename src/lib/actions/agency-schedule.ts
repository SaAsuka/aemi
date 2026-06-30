"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { scheduleSchema } from "@/lib/validations/schedule"
import { requireAgencyAdmin } from "@/lib/agency-auth"

type ScheduleFilters = {
  month?: string
  talent?: string
  job?: string
}

export async function getAgencySchedules(agencyId: string, filters: ScheduleFilters = {}) {
  const where: Record<string, unknown> = {
    application: { job: { agencyId } },
  }

  if (filters.month) {
    const start = new Date(`${filters.month}-01`)
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59)
    where.date = { gte: start, lte: end }
  }

  if (filters.talent) {
    where.application = {
      ...((where.application as Record<string, unknown>) ?? {}),
      talent: { name: { contains: filters.talent, mode: "insensitive" as const } },
    }
  }

  if (filters.job) {
    const existing = (where.application as Record<string, unknown>) ?? {}
    where.application = {
      ...existing,
      job: {
        ...(existing.job as Record<string, unknown> ?? {}),
        title: { contains: filters.job, mode: "insensitive" as const },
      },
    }
  }

  return prisma.schedule.findMany({
    where,
    orderBy: { date: "asc" },
    select: {
      id: true,
      date: true,
      startTime: true,
      endTime: true,
      location: true,
      status: true,
      application: {
        select: {
          talent: { select: { id: true, name: true } },
          job: { select: { id: true, title: true } },
        },
      },
    },
  })
}

export async function createAgencySchedule(formData: FormData) {
  const agency = await requireAgencyAdmin()
  const raw = Object.fromEntries(formData)
  const parsed = scheduleSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const data = parsed.data

  const application = await prisma.application.findFirst({
    where: { id: data.applicationId, job: { agencyId: agency.id } },
  })
  if (!application) return { error: { applicationId: ["応募が見つかりません"] } }

  const existing = await prisma.schedule.findUnique({
    where: { applicationId: data.applicationId },
  })
  if (existing) {
    return { error: { applicationId: ["この応募のスケジュールは既に登録済みです"] } }
  }

  await prisma.schedule.create({
    data: {
      applicationId: data.applicationId,
      date: new Date(data.date),
      startTime: data.startTime || null,
      endTime: data.endTime || null,
      location: data.location || null,
      status: data.status,
      note: data.note || null,
    },
  })

  revalidatePath("/agency/schedule")
  return { success: true }
}

export async function updateAgencyScheduleStatus(id: string, status: string) {
  const agency = await requireAgencyAdmin()
  const validStatuses = ["CONFIRMED", "COMPLETED", "NO_SHOW", "CANCELLED"]
  if (!validStatuses.includes(status)) {
    return { error: "無効なステータスです" }
  }

  const existing = await prisma.schedule.findFirst({
    where: { id, application: { job: { agencyId: agency.id } } },
  })
  if (!existing) return { error: "スケジュールが見つかりません" }

  await prisma.schedule.update({
    where: { id },
    data: {
      status: status as "CONFIRMED" | "COMPLETED" | "NO_SHOW" | "CANCELLED",
    },
  })

  revalidatePath("/agency/schedule")
  return { success: true }
}

export async function updateAgencySchedule(id: string, formData: FormData) {
  const agency = await requireAgencyAdmin()
  const raw = Object.fromEntries(formData)
  const parsed = scheduleSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const existing = await prisma.schedule.findFirst({
    where: { id, application: { job: { agencyId: agency.id } } },
  })
  if (!existing) return { error: { _: ["スケジュールが見つかりません"] } }

  const data = parsed.data
  await prisma.schedule.update({
    where: { id },
    data: {
      date: new Date(data.date),
      startTime: data.startTime || null,
      endTime: data.endTime || null,
      location: data.location || null,
      status: data.status,
      note: data.note || null,
    },
  })

  revalidatePath("/agency/schedule")
  return { success: true }
}

export async function deleteAgencySchedule(id: string) {
  const agency = await requireAgencyAdmin()

  const existing = await prisma.schedule.findFirst({
    where: { id, application: { job: { agencyId: agency.id } } },
  })
  if (!existing) return { error: "スケジュールが見つかりません" }

  await prisma.schedule.delete({ where: { id } })
  revalidatePath("/agency/schedule")
  return { success: true }
}
