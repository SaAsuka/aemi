"use server"

import { revalidatePath, updateTag } from "next/cache"
import { prisma } from "@/lib/db"

type ApplyInput = {
  mode: "create" | "existing"
  existingJobId?: string
  title: string
  clientId: string
  location?: string
  note?: string
}

export async function applyParsedJob(input: ApplyInput): Promise<
  { success: true } | { success: false; error: string }
> {
  try {
    if (input.mode === "existing" && input.existingJobId) {
      await prisma.job.update({
        where: { id: input.existingJobId },
        data: {
          note: input.note || null,
        },
      })
    } else {
      await prisma.job.create({
        data: {
          title: input.title,
          clientId: input.clientId,
          location: input.location || null,
          note: input.note || null,
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
