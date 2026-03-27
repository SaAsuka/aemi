"use server"

import { revalidatePath, updateTag } from "next/cache"
import { prisma } from "@/lib/db"
import { getDefaultClientId } from "@/lib/queries"

type Gender = "MALE" | "FEMALE" | "OTHER"

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
  startsAt?: string
  endsAt?: string
  deadline?: string
  capacity?: number
  note?: string
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
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      deadline: input.deadline ? new Date(input.deadline) : null,
      capacity: input.capacity ?? null,
      note: input.note || null,
    }

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

    await prisma.$transaction(
      inputs.map((input) => {
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
          startsAt: input.startsAt ? new Date(input.startsAt) : null,
          endsAt: input.endsAt ? new Date(input.endsAt) : null,
          deadline: input.deadline ? new Date(input.deadline) : null,
          capacity: input.capacity ?? null,
          note: input.note || null,
        }

        if (input.mode === "existing" && input.existingJobId) {
          return prisma.job.update({
            where: { id: input.existingJobId },
            data,
          })
        }
        return prisma.job.create({
          data: {
            ...data,
            status: "OPEN",
          },
        })
      })
    )

    revalidatePath("/admin/jobs")
    updateTag("jobs")
    return { success: true, count: inputs.length }
  } catch (e) {
    console.error("Apply parsed jobs error:", e)
    return { success: false, error: "一括保存に失敗しました" }
  }
}
