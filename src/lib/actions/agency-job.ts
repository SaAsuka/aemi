"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { jobSchema } from "@/lib/validations/job"
import { requireAgencyAdmin } from "@/lib/agency-auth"
import { normalizeDeadline } from "@/lib/utils/date"

const SUBMISSION_CATEGORIES = ["ACTING_VIDEO", "VOICE_SAMPLE", "PAST_WORK_VIDEO", "PROFILE_PHOTO"] as const

function extractRequirements(formData: FormData) {
  const reqs: {
    category: (typeof SUBMISSION_CATEGORIES)[number]
    description: string | null
    referenceUrl: string | null
    referenceFile: string | null
  }[] = []
  for (const cat of SUBMISSION_CATEGORIES) {
    if (formData.get(`req_${cat}_enabled`) === "on") {
      reqs.push({
        category: cat,
        description: (formData.get(`req_${cat}_description`) as string) || null,
        referenceUrl: (formData.get(`req_${cat}_referenceUrl`) as string) || null,
        referenceFile: (formData.get(`req_${cat}_referenceFile`) as string) || null,
      })
    }
  }
  return reqs
}

async function getOrCreateDefaultClient(agencyId: string, agencyName: string): Promise<string> {
  const existing = await prisma.client.findFirst({
    where: { agencyId },
    select: { id: true },
  })
  if (existing) return existing.id

  const created = await prisma.client.create({
    data: { companyName: agencyName, agencyId },
    select: { id: true },
  })
  return created.id
}

export async function getAgencyJobs(agencyId: string, search?: string, status?: string) {
  const where: Record<string, unknown> = { agencyId }
  if (search) where.title = { contains: search, mode: "insensitive" }
  if (status && status !== "ALL") where.status = status

  return prisma.job.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { applications: true } },
      dates: { orderBy: { date: "asc" } },
    },
  })
}

export async function getAgencyJob(id: string, agencyId: string) {
  return prisma.job.findFirst({
    where: { id, agencyId },
    include: {
      _count: { select: { applications: true } },
      requirements: true,
      dates: { orderBy: { date: "asc" } },
      applications: {
        select: {
          id: true,
          status: true,
          appliedAt: true,
          talent: { select: { id: true, name: true } },
        },
        orderBy: { appliedAt: "desc" },
      },
    },
  })
}

export async function createAgencyJob(formData: FormData) {
  const agency = await requireAgencyAdmin()
  const raw = Object.fromEntries(formData)
  const parsed = jobSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const data = parsed.data
  const requirements = extractRequirements(formData)
  const clientId = await getOrCreateDefaultClient(agency.id, agency.name)

  await prisma.job.create({
    data: {
      clientId,
      agencyId: agency.id,
      title: data.title,
      description: data.description || null,
      location: data.location || null,
      fee: typeof data.fee === "number" ? data.fee : null,
      genderReq: data.genderReq || null,
      ageMin: typeof data.ageMin === "number" ? data.ageMin : null,
      ageMax: typeof data.ageMax === "number" ? data.ageMax : null,
      heightMin: typeof data.heightMin === "number" ? data.heightMin : null,
      heightMax: typeof data.heightMax === "number" ? data.heightMax : null,
      deadline: data.deadline ? normalizeDeadline(data.deadline) : null,
      capacity: typeof data.capacity === "number" ? data.capacity : null,
      status: data.status,
      note: data.note || null,
      requirements: { create: requirements },
    },
  })

  revalidatePath("/agency/jobs")
  return { success: true }
}

export async function updateAgencyJob(id: string, formData: FormData) {
  const agency = await requireAgencyAdmin()

  const existing = await prisma.job.findFirst({ where: { id, agencyId: agency.id } })
  if (!existing) return { error: { _: ["案件が見つかりません"] } }

  const raw = Object.fromEntries(formData)
  const parsed = jobSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const data = parsed.data
  const requirements = extractRequirements(formData)

  await prisma.$transaction(async (tx) => {
    await tx.job.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description || null,
        location: data.location || null,
        fee: typeof data.fee === "number" ? data.fee : null,
        genderReq: data.genderReq || null,
        ageMin: typeof data.ageMin === "number" ? data.ageMin : null,
        ageMax: typeof data.ageMax === "number" ? data.ageMax : null,
        heightMin: typeof data.heightMin === "number" ? data.heightMin : null,
        heightMax: typeof data.heightMax === "number" ? data.heightMax : null,
        deadline: data.deadline ? normalizeDeadline(data.deadline) : null,
        capacity: typeof data.capacity === "number" ? data.capacity : null,
        status: data.status,
        note: data.note || null,
      },
    })
    await tx.jobRequirement.deleteMany({ where: { jobId: id } })
    if (requirements.length > 0) {
      await tx.jobRequirement.createMany({
        data: requirements.map((r) => ({ ...r, jobId: id })),
      })
    }
  })

  revalidatePath("/agency/jobs")
  revalidatePath(`/agency/jobs/${id}`)
  return { success: true }
}

export async function deleteAgencyJob(id: string) {
  const agency = await requireAgencyAdmin()

  const existing = await prisma.job.findFirst({
    where: { id, agencyId: agency.id },
    include: { _count: { select: { applications: true } } },
  })
  if (!existing) return { error: "案件が見つかりません" }
  if (existing._count.applications > 0) return { error: "応募がある案件は削除できません。ステータスを「キャンセル」に変更してください。" }

  await prisma.job.delete({ where: { id } })
  revalidatePath("/agency/jobs")
  return { success: true }
}
