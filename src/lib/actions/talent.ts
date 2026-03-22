"use server"

import { revalidatePath, updateTag } from "next/cache"
import { prisma } from "@/lib/db"
import { talentSchema } from "@/lib/validations/talent"

type TalentFilters = {
  search?: string
  heightMin?: number
  heightMax?: number
  bustMin?: number
  bustMax?: number
  waistMin?: number
  waistMax?: number
  hipMin?: number
  hipMax?: number
  shoeMin?: number
  shoeMax?: number
}

export async function getTalents(filters: TalentFilters = {}) {
  const where: Record<string, unknown> = {}

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" as const } },
      { nameKana: { contains: filters.search, mode: "insensitive" as const } },
      { email: { contains: filters.search, mode: "insensitive" as const } },
    ]
  }

  const rangeFields = [
    ["height", "heightMin", "heightMax"],
    ["bust", "bustMin", "bustMax"],
    ["waist", "waistMin", "waistMax"],
    ["hip", "hipMin", "hipMax"],
    ["shoeSize", "shoeMin", "shoeMax"],
  ] as const

  for (const [field, minKey, maxKey] of rangeFields) {
    const min = filters[minKey]
    const max = filters[maxKey]
    if (min !== undefined || max !== undefined) {
      const cond: Record<string, number> = {}
      if (min !== undefined) cond.gte = min
      if (max !== undefined) cond.lte = max
      where[field] = cond
    }
  }

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
      accessToken: true,
      resume: true,
      _count: { select: { photos: true } },
    },
  })
}

export async function getTalent(id: string) {
  const talent = await prisma.talent.findUnique({
    where: { id },
    include: {
      applications: {
        include: {
          job: { select: { id: true, title: true } },
        },
        orderBy: { appliedAt: "desc" },
      },
      photos: { orderBy: { sortOrder: "asc" } },
      works: { orderBy: { sortOrder: "asc" } },
    },
  })

  if (talent && !talent.accessToken) {
    const updated = await prisma.talent.update({
      where: { id },
      data: { accessToken: crypto.randomUUID().replace(/-/g, "").slice(0, 25) },
      select: { accessToken: true },
    })
    talent.accessToken = updated.accessToken
  }

  return talent
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
      stageName: data.stageName || null,
      nameRomaji: data.nameRomaji || null,
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
      qualifications: data.qualifications || null,
      career: data.career || null,
      category: data.category || null,
      birthplace: data.birthplace || null,
      address: data.address || null,
      representativeWork: data.representativeWork || null,
      lineUserId: data.lineUserId || null,
      profileImage: data.profileImage || null,
      resume: data.resume || null,
      nearestStation: data.nearestStation || null,
      instagramUrl: data.instagramUrl || null,
      xUrl: data.xUrl || null,
      tiktokUrl: data.tiktokUrl || null,
      websiteUrl: data.websiteUrl || null,
      bankName: data.bankName || null,
      bankBranch: data.bankBranch || null,
      bankAccountType: data.bankAccountType || null,
      bankAccountNumber: data.bankAccountNumber || null,
      bankAccountHolder: data.bankAccountHolder || null,
      status: data.status,
      note: data.note || null,
    },
  })

  revalidatePath("/admin/talents")
  updateTag("talents")
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
      stageName: data.stageName || null,
      nameRomaji: data.nameRomaji || null,
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
      qualifications: data.qualifications || null,
      career: data.career || null,
      category: data.category || null,
      birthplace: data.birthplace || null,
      address: data.address || null,
      representativeWork: data.representativeWork || null,
      lineUserId: data.lineUserId || null,
      profileImage: data.profileImage || null,
      nearestStation: data.nearestStation || null,
      instagramUrl: data.instagramUrl || null,
      xUrl: data.xUrl || null,
      tiktokUrl: data.tiktokUrl || null,
      websiteUrl: data.websiteUrl || null,
      bankName: data.bankName || null,
      bankBranch: data.bankBranch || null,
      bankAccountType: data.bankAccountType || null,
      bankAccountNumber: data.bankAccountNumber || null,
      bankAccountHolder: data.bankAccountHolder || null,
      status: data.status,
      note: data.note || null,
    },
  })

  revalidatePath("/admin/talents")
  revalidatePath(`/admin/talents/${id}`)
  updateTag("talents")
  return { success: true }
}

export async function getTalentByToken(token: string) {
  return prisma.talent.findUnique({
    where: { accessToken: token },
    select: { id: true, name: true, status: true, gender: true, birthDate: true, height: true },
  })
}

export async function saveResumeUrl(talentId: string, url: string) {
  await prisma.talent.update({ where: { id: talentId }, data: { resume: url } })
  revalidatePath(`/admin/talents/${talentId}`)
  revalidatePath("/admin/talents")
}

export async function deleteTalent(id: string) {
  await prisma.$transaction(async (tx) => {
    const appIds = (
      await tx.application.findMany({ where: { talentId: id }, select: { id: true } })
    ).map((a) => a.id)

    if (appIds.length > 0) {
      await tx.schedule.deleteMany({ where: { applicationId: { in: appIds } } })
      await tx.applicationSubmission.deleteMany({ where: { applicationId: { in: appIds } } })
      await tx.application.deleteMany({ where: { talentId: id } })
    }

    await tx.talent.delete({ where: { id } })
  })

  revalidatePath("/admin/talents")
  updateTag("talents")
  return { success: true }
}
