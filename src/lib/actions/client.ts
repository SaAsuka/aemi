"use server"

import { requireAdmin } from "@/lib/auth"
import { revalidatePath, updateTag } from "next/cache"
import { prisma } from "@/lib/db"
import { clientSchema } from "@/lib/validations/client"

export async function getClients(search?: string) {
  await requireAdmin()
  const where = search
    ? {
        OR: [
          { companyName: { contains: search, mode: "insensitive" as const } },
          { contactName: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {}

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

export async function getClient(id: string) {
  await requireAdmin()
  return prisma.client.findUnique({
    where: { id },
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

export async function createClient(formData: FormData) {
  await requireAdmin()
  const raw = Object.fromEntries(formData)
  const parsed = clientSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const data = parsed.data
  await prisma.client.create({
    data: {
      companyName: data.companyName,
      contactName: data.contactName || null,
      contactEmail: data.contactEmail || null,
      contactPhone: data.contactPhone || null,
      lineGroupId: data.lineGroupId || null,
      note: data.note || null,
    },
  })

  revalidatePath("/admin/clients")
  updateTag("clients")
  return { success: true }
}

export async function updateClient(id: string, formData: FormData) {
  await requireAdmin()
  const raw = Object.fromEntries(formData)
  const parsed = clientSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

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

  revalidatePath("/admin/clients")
  revalidatePath(`/admin/clients/${id}`)
  updateTag("clients")
  return { success: true }
}

export async function deleteClient(id: string) {
  await requireAdmin()
  await prisma.client.delete({ where: { id } })
  revalidatePath("/admin/clients")
  updateTag("clients")
  return { success: true }
}
