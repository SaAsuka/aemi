"use server"

import { revalidatePath, updateTag } from "next/cache"
import { prisma } from "@/lib/db"
import { clientSchema } from "@/lib/validations/client"
import { requireAgencyAdmin } from "@/lib/agency-auth"

export async function getAgencyClients(agencyId: string, search?: string) {
  const where: Record<string, unknown> = { agencyId }
  if (search) {
    where.OR = [
      { companyName: { contains: search, mode: "insensitive" as const } },
      { contactName: { contains: search, mode: "insensitive" as const } },
    ]
  }

  return prisma.client.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      companyName: true,
      contactName: true,
      contactEmail: true,
      contactPhone: true,
      _count: { select: { jobs: true } },
    },
  })
}

export async function getAgencyClient(id: string, agencyId: string) {
  return prisma.client.findFirst({
    where: { id, agencyId },
    include: {
      jobs: {
        select: {
          id: true,
          title: true,
          status: true,
          _count: { select: { applications: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })
}

export async function createAgencyClient(formData: FormData) {
  const agency = await requireAgencyAdmin()
  const raw = Object.fromEntries(formData)
  const parsed = clientSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const data = parsed.data
  await prisma.client.create({
    data: {
      agencyId: agency.id,
      companyName: data.companyName,
      contactName: data.contactName || null,
      contactEmail: data.contactEmail || null,
      contactPhone: data.contactPhone || null,
      lineGroupId: data.lineGroupId || null,
      note: data.note || null,
    },
  })

  revalidatePath("/agency/clients")
  updateTag("clients")
  return { success: true }
}

export async function updateAgencyClient(id: string, formData: FormData) {
  const agency = await requireAgencyAdmin()
  const raw = Object.fromEntries(formData)
  const parsed = clientSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const existing = await prisma.client.findFirst({ where: { id, agencyId: agency.id } })
  if (!existing) return { error: { companyName: ["クライアントが見つかりません"] } }

  const data = parsed.data
  await prisma.client.update({
    where: { id },
    data: {
      companyName: data.companyName,
      contactName: data.contactName || null,
      contactEmail: data.contactEmail || null,
      contactPhone: data.contactPhone || null,
      lineGroupId: data.lineGroupId || null,
      note: data.note || null,
    },
  })

  revalidatePath("/agency/clients")
  revalidatePath(`/agency/clients/${id}`)
  updateTag("clients")
  return { success: true }
}

export async function deleteAgencyClient(id: string) {
  const agency = await requireAgencyAdmin()

  const existing = await prisma.client.findFirst({ where: { id, agencyId: agency.id } })
  if (!existing) return { error: "クライアントが見つかりません" }

  await prisma.client.delete({ where: { id } })
  revalidatePath("/agency/clients")
  updateTag("clients")
  return { success: true }
}
