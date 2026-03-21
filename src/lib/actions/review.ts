"use server"

import { revalidatePath, updateTag } from "next/cache"
import { prisma } from "@/lib/db"
import { generateReviewToken } from "@/lib/utils/token"
import { reviewSchema } from "@/lib/validations/review"

export async function generateReviewLink(applicationId: string) {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      reviewToken: true,
      talent: { select: { name: true } },
      job: { select: { title: true } },
    },
  })

  if (!app) {
    return { error: "応募が見つかりません" }
  }

  let token = app.reviewToken
  if (!token) {
    token = generateReviewToken()
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        reviewToken: token,
        status: "RESUME_SENT",
      },
    })
    revalidatePath("/admin/applications")
    updateTag("talents")
    updateTag("jobs")
  }

  return {
    success: true,
    token,
    talentName: app.talent.name,
    jobTitle: app.job.title,
  }
}

export async function getApplicationByToken(token: string) {
  const app = await prisma.application.findUnique({
    where: { reviewToken: token },
    select: {
      id: true,
      status: true,
      reviewedAt: true,
      talent: {
        select: {
          name: true,
          nameKana: true,
          gender: true,
          birthDate: true,
          height: true,
          bust: true,
          waist: true,
          hip: true,
          shoeSize: true,
          skills: true,
          hobbies: true,
          career: true,
          profileImage: true,
        },
      },
      job: {
        select: {
          title: true,
          location: true,
          fee: true,
          startsAt: true,
          endsAt: true,
        },
      },
    },
  })

  return app
}

export async function submitReview(token: string, formData: FormData) {
  const app = await prisma.application.findUnique({
    where: { reviewToken: token },
    select: { id: true, reviewedAt: true },
  })

  if (!app) {
    return { error: "無効なリンクです" }
  }

  if (app.reviewedAt) {
    return { error: "既に回答済みです" }
  }

  const raw = {
    result: formData.get("result") as string,
    preferredDate: formData.get("preferredDate") as string || "",
    preferredTime: formData.get("preferredTime") as string || "",
    rejectionReason: formData.get("rejectionReason") as string || "",
    comment: formData.get("comment") as string || "",
  }

  const parsed = reviewSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const data = parsed.data

  if (data.result === "ACCEPTED") {
    await prisma.application.update({
      where: { id: app.id },
      data: {
        status: "ACCEPTED",
        decidedAt: new Date(),
        reviewedAt: new Date(),
        preferredDate: data.preferredDate,
        preferredTime: data.preferredTime,
        reviewComment: data.comment || null,
      },
    })
  } else {
    await prisma.application.update({
      where: { id: app.id },
      data: {
        status: "REJECTED",
        decidedAt: new Date(),
        reviewedAt: new Date(),
        rejectionReason: data.rejectionReason,
        reviewComment: data.comment || null,
      },
    })
  }

  revalidatePath("/admin/applications")
  updateTag("talents")
  updateTag("jobs")
  return { success: true }
}
