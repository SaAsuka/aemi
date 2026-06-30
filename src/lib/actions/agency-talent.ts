"use server"

import { revalidatePath, updateTag } from "next/cache"
import { del } from "@vercel/blob"
import { deleteFromStorage, isSupabaseStorageUrl } from "@/lib/supabase-storage"
import { prisma } from "@/lib/db"
import { talentBaseSchema } from "@/lib/validations/talent"
import { upsertSocialLinks, upsertBankAccount } from "./talent-relations"
import { requireAgencyAdmin } from "@/lib/agency-auth"

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
  line?: string
  subscription?: string
  sort?: string
  order?: "asc" | "desc"
  page?: number
  pageSize?: number
}

const TALENT_SELECT = {
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
  lineUserId: true,
  resume: true,
  resumeSource: true,
  subscription: {
    select: { status: true, currentPeriodEnd: true },
  },
  _count: { select: { photos: true } },
} as const

function buildTalentWhere(agencyId: string, filters: TalentFilters) {
  const where: Record<string, unknown> = { agencyId }
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
  if (filters.line === "connected") {
    where.lineUserId = { not: null }
  } else if (filters.line === "not_connected") {
    where.lineUserId = null
  }
  if (filters.subscription) {
    if (filters.subscription === "NONE") {
      const subConditions = [
        { subscription: { is: null } },
        { subscription: { status: "NONE" } },
      ]
      if (where.OR) {
        where.AND = [{ OR: where.OR as Record<string, unknown>[] }, { OR: subConditions }]
        delete where.OR
      } else {
        where.OR = subConditions
      }
    } else {
      where.subscription = { status: filters.subscription }
    }
  }
  return where
}

const TALENT_SORT_FIELDS = ["name", "nameKana", "status", "height", "createdAt"] as const

export async function getAgencyTalentCount(agencyId: string, filters: TalentFilters = {}) {
  return prisma.talent.count({ where: buildTalentWhere(agencyId, filters) })
}

export async function getAgencyTalents(agencyId: string, filters: TalentFilters = {}) {
  const where = buildTalentWhere(agencyId, filters)
  const pageSize = filters.pageSize ?? 50
  const page = filters.page ?? 1
  const sortField = TALENT_SORT_FIELDS.includes(filters.sort as typeof TALENT_SORT_FIELDS[number])
    ? filters.sort!
    : "createdAt"
  const sortOrder = filters.order ?? "desc"

  return prisma.talent.findMany({
    where,
    orderBy: { [sortField]: sortOrder },
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: TALENT_SELECT,
  })
}

export async function getAgencyActiveTalentsForMatching(agencyId: string) {
  return prisma.talent.findMany({
    where: { agencyId, status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      gender: true,
      birthDate: true,
      height: true,
      lineUserId: true,
    },
  })
}

export async function getAgencyTalent(id: string, agencyId: string) {
  const talent = await prisma.talent.findFirst({
    where: { id, agencyId },
    include: {
      applications: {
        include: {
          job: { select: { id: true, title: true, location: true } },
          schedule: { select: { date: true, startTime: true, endTime: true, location: true, status: true } },
        },
        orderBy: { appliedAt: "desc" },
      },
      photos: { orderBy: { sortOrder: "asc" } },
      works: { orderBy: { sortOrder: "asc" } },
      bankAccount: true,
      socialLinks: true,
      subscription: true,
    },
  })
  if (!talent) return null
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { accessToken: _at, ...safe } = talent
  return safe
}

export async function createAgencyTalent(formData: FormData) {
  const agency = await requireAgencyAdmin()
  const raw = Object.fromEntries(formData)
  const parsed = talentBaseSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const data = parsed.data
  const talent = await prisma.talent.create({
    data: {
      agencyId: agency.id,
      lastName: data.lastName,
      firstName: data.firstName,
      lastNameKana: data.lastNameKana,
      firstNameKana: data.firstNameKana,
      name: data.lastName + " " + data.firstName,
      nameKana: data.lastNameKana + " " + data.firstNameKana,
      stageName: data.stageName || null,
      nameRomaji: data.nameRomaji || null,
      emailVerified: true,
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
      status: data.status,
      note: data.note || null,
    },
  })

  await upsertSocialLinks(talent.id, data)
  await upsertBankAccount(talent.id, data)

  revalidatePath("/agency/talents")
  updateTag("talents")
  return { success: true }
}

export async function updateAgencyTalent(id: string, formData: FormData) {
  const agency = await requireAgencyAdmin()

  const existing = await prisma.talent.findFirst({ where: { id, agencyId: agency.id } })
  if (!existing) return { error: { _: ["タレントが見つかりません"] } }

  const raw = Object.fromEntries(formData)
  const parsed = talentBaseSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const data = parsed.data
  await prisma.talent.update({
    where: { id },
    data: {
      lastName: data.lastName,
      firstName: data.firstName,
      lastNameKana: data.lastNameKana,
      firstNameKana: data.firstNameKana,
      name: data.lastName + " " + data.firstName,
      nameKana: data.lastNameKana + " " + data.firstNameKana,
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
      status: data.status,
      note: data.note || null,
    },
  })

  await upsertSocialLinks(id, data)
  await upsertBankAccount(id, data)

  revalidatePath("/agency/talents")
  revalidatePath(`/agency/talents/${id}`)
  updateTag("talents")
  return { success: true }
}

export async function deleteAgencyTalent(id: string) {
  const agency = await requireAgencyAdmin()

  const [photos, works, applications, talent] = await Promise.all([
    prisma.talentPhoto.findMany({ where: { talentId: id }, select: { url: true } }),
    prisma.talentWork.findMany({ where: { talentId: id }, select: { imageUrl: true } }),
    prisma.application.findMany({
      where: { talentId: id },
      select: { id: true, submissions: { select: { fileUrl: true } } },
    }),
    prisma.talent.findFirst({ where: { id, agencyId: agency.id }, select: { resume: true } }),
  ])

  if (!talent) return { error: "タレントが見つかりません" }

  await prisma.$transaction(async (tx) => {
    const appIds = applications.map((a) => a.id)
    if (appIds.length > 0) {
      await tx.schedule.deleteMany({ where: { applicationId: { in: appIds } } })
      await tx.application.deleteMany({ where: { talentId: id } })
    }
    await tx.talent.delete({ where: { id } })
  })

  const allUrls = [
    ...photos.map((p) => p.url),
    ...works.map((w) => w.imageUrl),
    ...applications.flatMap((a) => a.submissions.map((s) => s.fileUrl)),
    talent?.resume,
  ].filter((url): url is string => !!url)

  const vercelUrls = allUrls.filter((u) => u.includes("blob.vercel-storage.com"))
  const supabaseUrls = allUrls.filter((u) => isSupabaseStorageUrl(u))

  if (vercelUrls.length > 0) await del(vercelUrls).catch(() => {})
  if (supabaseUrls.length > 0) await deleteFromStorage(supabaseUrls).catch(() => {})

  revalidatePath("/agency/talents")
  updateTag("talents")
  return { success: true }
}
