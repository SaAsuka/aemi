"use server"

import { revalidatePath, updateTag } from "next/cache"
import { prisma } from "@/lib/db"
import { getDefaultClientId } from "@/lib/queries"
import { normalizeDeadline } from "@/lib/utils/date"

type Gender = "MALE" | "FEMALE" | "OTHER"

type JobDateInput = {
  type: "AUDITION" | "SHOOTING" | "OTHER"
  date: string
  startTime?: string | null
  endTime?: string | null
  location?: string | null
  note?: string | null
}

type SubmissionCategory = "ACTING_VIDEO" | "VOICE_SAMPLE" | "PAST_WORK_VIDEO" | "PROFILE_PHOTO"

type ApplyInput = {
  mode: "create" | "existing"
  existingJobId?: string
  title: string
  description?: string
  location?: string
  fee?: number
  genderReq?: Gender
  ageMin?: number
  ageMax?: number
  heightMin?: number
  heightMax?: number
  deadline?: string
  capacity?: number
  note?: string
  dates?: JobDateInput[]
  requirements?: SubmissionCategory[]
}

export async function applyParsedJob(input: ApplyInput): Promise<
  { success: true } | { success: false; error: string }
> {
  try {
    const clientId = await getDefaultClientId()

    const data = {
      title: input.title,
      clientId,
      description: input.description || null,
      location: input.location || null,
      fee: input.fee ?? null,
      genderReq: input.genderReq || null,
      ageMin: input.ageMin ?? null,
      ageMax: input.ageMax ?? null,
      heightMin: input.heightMin ?? null,
      heightMax: input.heightMax ?? null,
      deadline: input.deadline ? normalizeDeadline(input.deadline) : null,
      capacity: input.capacity ?? null,
      note: input.note || null,
    }

    const datesData = (input.dates ?? []).map((d) => ({
      type: d.type as "AUDITION" | "SHOOTING" | "OTHER",
      date: new Date(d.date),
      startTime: d.startTime || null,
      endTime: d.endTime || null,
      location: d.location || null,
      note: d.note || null,
    }))

    const reqData = (input.requirements ?? []).map((cat) => ({ category: cat }))

    if (input.mode === "existing" && input.existingJobId) {
      await prisma.job.update({
        where: { id: input.existingJobId },
        data,
      })
    } else {
      await prisma.job.create({
        data: {
          ...data,
          status: "OPEN",
          dates: datesData.length > 0 ? { create: datesData } : undefined,
          requirements: reqData.length > 0 ? { create: reqData } : undefined,
        },
      })
    }

    revalidatePath("/admin/jobs")
    updateTag("jobs")
    return { success: true }
  } catch (e) {
    console.error("Apply parsed job error:", e)
    return { success: false, error: "保存に失敗しました" }
  }
}

export async function applyParsedJobs(inputs: ApplyInput[]): Promise<
  { success: true; count: number } | { success: false; error: string }
> {
  try {
    const clientId = await getDefaultClientId()

    for (const input of inputs) {
      const data = {
        title: input.title,
        clientId,
        description: input.description || null,
        location: input.location || null,
        fee: input.fee ?? null,
        genderReq: input.genderReq || null,
        ageMin: input.ageMin ?? null,
        ageMax: input.ageMax ?? null,
        heightMin: input.heightMin ?? null,
        heightMax: input.heightMax ?? null,
        deadline: input.deadline ? normalizeDeadline(input.deadline) : null,
        capacity: input.capacity ?? null,
        note: input.note || null,
      }

      const datesData = (input.dates ?? []).map((d) => ({
        type: d.type as "AUDITION" | "SHOOTING" | "OTHER",
        date: new Date(d.date),
        startTime: d.startTime || null,
        endTime: d.endTime || null,
        location: d.location || null,
        note: d.note || null,
      }))

      const reqData = (input.requirements ?? []).map((cat) => ({ category: cat }))

      if (input.mode === "existing" && input.existingJobId) {
        await prisma.job.update({
          where: { id: input.existingJobId },
          data,
        })
      } else {
        await prisma.job.create({
          data: {
            ...data,
            status: "OPEN",
            dates: datesData.length > 0 ? { create: datesData } : undefined,
            requirements: reqData.length > 0 ? { create: reqData } : undefined,
          },
        })
      }
    }

    revalidatePath("/admin/jobs")
    updateTag("jobs")
    return { success: true, count: inputs.length }
  } catch (e) {
    console.error("Apply parsed jobs error:", e)
    return { success: false, error: "一括保存に失敗しました" }
  }
}
