"use server"

import { revalidatePath, updateTag } from "next/cache"
import { prisma } from "@/lib/db"

type TalentEntry = {
  talentId: string
  status: "ACCEPTED" | "REJECTED" | "PENDING"
  date?: string
  startTime?: string
  location?: string
  note?: string
}

type ApplyInput = {
  mode: "create" | "existing"
  existingJobId?: string
  title: string
  clientId: string
  location?: string
  note?: string
  talents: TalentEntry[]
}

const STATUS_MAP = {
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  PENDING: "RESUME_SENT",
} as const

export async function applyParsedJob(input: ApplyInput): Promise<
  { success: true } | { success: false; error: string }
> {
  try {
    let jobId: string

    if (input.mode === "existing" && input.existingJobId) {
      jobId = input.existingJobId
    } else {
      const job = await prisma.job.create({
        data: {
          title: input.title,
          clientId: input.clientId,
          location: input.location || null,
          note: input.note || null,
          status: "OPEN",
        },
      })
      jobId = job.id
    }

    for (const entry of input.talents) {
      if (!entry.talentId) continue

      const appStatus = STATUS_MAP[entry.status]
      const decidedStatuses = ["ACCEPTED", "REJECTED"] as const
      const isDecided = (decidedStatuses as readonly string[]).includes(appStatus)

      const application = await prisma.application.upsert({
        where: {
          talentId_jobId: { talentId: entry.talentId, jobId },
        },
        create: {
          talentId: entry.talentId,
          jobId,
          status: appStatus,
          decidedAt: isDecided ? new Date() : null,
          note: entry.note || null,
        },
        update: {
          status: appStatus,
          decidedAt: isDecided ? new Date() : null,
          note: entry.note || null,
        },
      })

      if (entry.status === "ACCEPTED" && entry.date) {
        const existing = await prisma.schedule.findUnique({
          where: { applicationId: application.id },
        })
        if (existing) {
          await prisma.schedule.update({
            where: { applicationId: application.id },
            data: {
              date: new Date(entry.date),
              startTime: entry.startTime || null,
              location: entry.location || null,
            },
          })
        } else {
          await prisma.schedule.create({
            data: {
              applicationId: application.id,
              date: new Date(entry.date),
              startTime: entry.startTime || null,
              location: entry.location || null,
            },
          })
        }
      }
    }

    revalidatePath("/admin/jobs")
    revalidatePath("/admin/applications")
    revalidatePath("/admin/schedule")
    updateTag("jobs")
    updateTag("talents")
    return { success: true }
  } catch (e) {
    console.error("Apply parsed job error:", e)
    return { success: false, error: "保存に失敗しました" }
  }
}
