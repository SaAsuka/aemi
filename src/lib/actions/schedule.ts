"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { scheduleSchema } from "@/lib/validations/schedule"

export async function getSchedules(month?: string) {
  const where: Record<string, unknown> = {}

  if (month) {
    const start = new Date(`${month}-01`)
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59)
    where.date = { gte: start, lte: end }
  }

  return prisma.schedule.findMany({
    where,
    orderBy: { date: "asc" },
    include: {
      application: {
        include: {
          talent: true,
          job: { include: { client: true } },
        },
      },
    },
  })
}

export async function createSchedule(formData: FormData) {
  const raw = Object.fromEntries(formData)
  const parsed = scheduleSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const data = parsed.data

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

  revalidatePath("/admin/schedule")
  return { success: true }
}

export async function updateScheduleStatus(id: string, status: string) {
  const validStatuses = ["CONFIRMED", "COMPLETED", "NO_SHOW", "CANCELLED"]
  if (!validStatuses.includes(status)) {
    return { error: "無効なステータスです" }
  }

  await prisma.schedule.update({
    where: { id },
    data: {
      status: status as "CONFIRMED" | "COMPLETED" | "NO_SHOW" | "CANCELLED",
    },
  })

  revalidatePath("/admin/schedule")
  return { success: true }
}

export async function updateSchedule(id: string, formData: FormData) {
  const raw = Object.fromEntries(formData)
  const parsed = scheduleSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

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

  revalidatePath("/admin/schedule")
  return { success: true }
}

export async function deleteSchedule(id: string) {
  await prisma.schedule.delete({ where: { id } })
  revalidatePath("/admin/schedule")
  return { success: true }
}
