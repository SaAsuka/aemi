"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { talentSchema } from "@/lib/validations/talent"

export async function getTalents(search?: string) {
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { nameKana: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {}

  return prisma.talent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      nameKana: true,
      gender: true,
      birthDate: true,
      height: true,
      bust: true,
      waist: true,
      hip: true,
      shoeSize: true,
      status: true,
    },
  })
}

export async function getTalent(id: string) {
  return prisma.talent.findUnique({
    where: { id },
    include: {
      applications: {
        include: {
          job: {
            select: { id: true, title: true, client: { select: { companyName: true } } },
          },
        },
        orderBy: { appliedAt: "desc" },
      },
    },
  })
}

export async function createTalent(formData: FormData) {
  const raw = Object.fromEntries(formData)
  const parsed = talentSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const data = parsed.data
  await prisma.talent.create({
    data: {
      name: data.name,
      nameKana: data.nameKana,
      email: data.email || null,
      phone: data.phone || null,
      gender: data.gender || null,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      height: typeof data.height === "number" ? data.height : null,
      bust: typeof data.bust === "number" ? data.bust : null,
      waist: typeof data.waist === "number" ? data.waist : null,
      hip: typeof data.hip === "number" ? data.hip : null,
      shoeSize: typeof data.shoeSize === "number" ? data.shoeSize : null,
      skills: data.skills || null,
      hobbies: data.hobbies || null,
      career: data.career || null,
      lineUserId: data.lineUserId || null,
      profileImage: data.profileImage || null,
      resume: data.resume || null,
      status: data.status,
      note: data.note || null,
    },
  })

  revalidatePath("/admin/talents")
  return { success: true }
}

export async function updateTalent(id: string, formData: FormData) {
  const raw = Object.fromEntries(formData)
  const parsed = talentSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const data = parsed.data
  await prisma.talent.update({
    where: { id },
    data: {
      name: data.name,
      nameKana: data.nameKana,
      email: data.email || null,
      phone: data.phone || null,
      gender: data.gender || null,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      height: typeof data.height === "number" ? data.height : null,
      bust: typeof data.bust === "number" ? data.bust : null,
      waist: typeof data.waist === "number" ? data.waist : null,
      hip: typeof data.hip === "number" ? data.hip : null,
      shoeSize: typeof data.shoeSize === "number" ? data.shoeSize : null,
      skills: data.skills || null,
      hobbies: data.hobbies || null,
      career: data.career || null,
      lineUserId: data.lineUserId || null,
      profileImage: data.profileImage || null,
      resume: data.resume || null,
      status: data.status,
      note: data.note || null,
    },
  })

  revalidatePath("/admin/talents")
  revalidatePath(`/admin/talents/${id}`)
  return { success: true }
}

export async function deleteTalent(id: string) {
  await prisma.talent.delete({ where: { id } })
  revalidatePath("/admin/talents")
  return { success: true }
}
