"use server"

import { revalidatePath, updateTag } from "next/cache"
import { prisma } from "@/lib/db"
import { jobSchema } from "@/lib/validations/job"
import { getDefaultClientId } from "@/lib/queries"

export async function getJobs(search?: string, status?: string) {
  const where: Record<string, unknown> = {}

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { client: { companyName: { contains: search, mode: "insensitive" } } },
    ]
  }

  if (status && status !== "ALL") {
    where.status = status
  }

  return prisma.job.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { companyName: true } },
      _count: { select: { applications: true } },
    },
  })
}

export async function getJob(id: string) {
  return prisma.job.findUnique({
    where: { id },
    include: {
      client: true,
      requirements: true,
      applications: {
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
          submissions: {
            select: {
              id: true, category: true, fileUrl: true, externalUrl: true, fileName: true,
            },
          },
        },
        orderBy: { appliedAt: "desc" },
      },
    },
  })
}

export async function getOpenJobs() {
  return prisma.job.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, location: true, fee: true,
      genderReq: true, ageMin: true, ageMax: true, heightMin: true, heightMax: true,
      startsAt: true, endsAt: true, deadline: true, createdAt: true, capacity: true,
      client: { select: { companyName: true } },
    },
  })
}

export async function getOpenJob(id: string) {
  return prisma.job.findUnique({
    where: { id, status: "OPEN" },
    select: {
      id: true, title: true, description: true, location: true, fee: true,
      genderReq: true, ageMin: true, ageMax: true, heightMin: true, heightMax: true,
      startsAt: true, endsAt: true, deadline: true, capacity: true,
      client: { select: { companyName: true } },
      requirements: {
        select: {
          id: true, category: true, description: true, referenceUrl: true, referenceFile: true,
        },
      },
    },
  })
}

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

export async function createJob(formData: FormData) {
  const raw = Object.fromEntries(formData)
  const parsed = jobSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const data = parsed.data
  const requirements = extractRequirements(formData)
  const clientId = await getDefaultClientId()

  await prisma.job.create({
    data: {
      clientId,
      title: data.title,
      description: data.description || null,
      location: data.location || null,
      fee: typeof data.fee === "number" ? data.fee : null,
      genderReq: data.genderReq || null,
      ageMin: typeof data.ageMin === "number" ? data.ageMin : null,
      ageMax: typeof data.ageMax === "number" ? data.ageMax : null,
      heightMin: typeof data.heightMin === "number" ? data.heightMin : null,
      heightMax: typeof data.heightMax === "number" ? data.heightMax : null,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
      deadline: data.deadline ? new Date(data.deadline) : null,
      capacity: typeof data.capacity === "number" ? data.capacity : null,
      status: data.status,
      note: data.note || null,
      requirements: {
        create: requirements,
      },
    },
  })

  revalidatePath("/admin/jobs")
  updateTag("jobs")
  return { success: true }
}

export async function updateJob(id: string, formData: FormData) {
  const raw = Object.fromEntries(formData)
  const parsed = jobSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const data = parsed.data
  const requirements = extractRequirements(formData)
  const clientId = await getDefaultClientId()

  await prisma.$transaction(async (tx) => {
    await tx.job.update({
      where: { id },
      data: {
        clientId,
        title: data.title,
        description: data.description || null,
        location: data.location || null,
        fee: typeof data.fee === "number" ? data.fee : null,
        genderReq: data.genderReq || null,
        ageMin: typeof data.ageMin === "number" ? data.ageMin : null,
        ageMax: typeof data.ageMax === "number" ? data.ageMax : null,
        heightMin: typeof data.heightMin === "number" ? data.heightMin : null,
        heightMax: typeof data.heightMax === "number" ? data.heightMax : null,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        deadline: data.deadline ? new Date(data.deadline) : null,
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

  revalidatePath("/admin/jobs")
  revalidatePath(`/admin/jobs/${id}`)
  updateTag("jobs")
  return { success: true }
}

export async function deleteJob(id: string) {
  await prisma.job.delete({ where: { id } })
  revalidatePath("/admin/jobs")
  updateTag("jobs")
  return { success: true }
}
