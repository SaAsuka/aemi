"use server"

import { revalidatePath, updateTag } from "next/cache"
import { prisma } from "@/lib/db"
import { jobSchema } from "@/lib/validations/job"

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

export async function createJob(formData: FormData) {
  const raw = Object.fromEntries(formData)
  const parsed = jobSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const data = parsed.data
  await prisma.job.create({
    data: {
      clientId: data.clientId,
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
  await prisma.job.update({
    where: { id },
    data: {
      clientId: data.clientId,
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
