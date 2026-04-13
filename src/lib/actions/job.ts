"use server"

import { revalidatePath, updateTag } from "next/cache"
import { prisma } from "@/lib/db"
import { jobSchema } from "@/lib/validations/job"
import { getDefaultClientId } from "@/lib/queries"
import { matchTalentToJob } from "@/lib/utils/job-matching"
import { sendLinePush } from "@/lib/line"
import { formatDate } from "@/lib/utils/date"

const JOB_SORT_FIELDS = ["title", "fee", "deadline", "status", "createdAt"] as const

function buildJobWhere(search?: string, status?: string) {
  const where: Record<string, unknown> = {}
  if (search) where.title = { contains: search, mode: "insensitive" }
  if (status && status !== "ALL") where.status = status
  return where
}

export async function getJobCount(search?: string, status?: string) {
  return prisma.job.count({ where: buildJobWhere(search, status) })
}

export async function getJobs(search?: string, status?: string, talentId?: string, sort?: string, order?: string, page?: number) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  await prisma.job.updateMany({
    where: { status: "CLOSED", deadline: { gte: today } },
    data: { status: "OPEN" },
  })

  const where = buildJobWhere(search, status)
  const sortField = JOB_SORT_FIELDS.includes(sort as typeof JOB_SORT_FIELDS[number]) ? sort! : "createdAt"
  const sortOrder = order === "asc" ? "asc" : "desc"
  const pageSize = 50
  const currentPage = page ?? 1

  const jobs = await prisma.job.findMany({
    where,
    orderBy: { [sortField]: sortOrder },
    skip: talentId ? 0 : (currentPage - 1) * pageSize,
    take: talentId ? undefined : pageSize,
    include: {
      _count: { select: { applications: true } },
      dates: { orderBy: { date: "asc" } },
    },
  })

  if (!talentId) return jobs

  const talent = await prisma.talent.findUnique({
    where: { id: talentId },
    select: { gender: true, birthDate: true, height: true },
  })

  if (!talent) return jobs

  return jobs.filter((job) => {
    const { matchStatus } = matchTalentToJob(talent, job)
    return matchStatus !== "unmatch"
  })
}

export async function getJob(id: string) {
  return prisma.job.findUnique({
    where: { id },
    include: {
      client: true,
      requirements: true,
      dates: { orderBy: { date: "asc" } },
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
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return prisma.job.findMany({
    where: {
      status: "OPEN",
      OR: [
        { deadline: null },
        { deadline: { gte: today } },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, location: true, fee: true,
      genderReq: true, ageMin: true, ageMax: true, heightMin: true, heightMax: true,
      deadline: true, createdAt: true, capacity: true,
      client: { select: { companyName: true } },
      dates: { orderBy: { date: "asc" as const } },
    },
  })
}

export async function getOpenJob(id: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return prisma.job.findUnique({
    where: {
      id,
      status: "OPEN",
      OR: [
        { deadline: null },
        { deadline: { gte: today } },
      ],
    },
    select: {
      id: true, title: true, description: true, location: true, fee: true,
      genderReq: true, ageMin: true, ageMax: true, heightMin: true, heightMax: true,
      deadline: true, capacity: true,
      client: { select: { companyName: true } },
      dates: { orderBy: { date: "asc" as const } },
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

  const job = await prisma.job.create({
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
      deadline: data.deadline ? new Date(data.deadline) : null,
      capacity: typeof data.capacity === "number" ? data.capacity : null,
      status: data.status,
      note: data.note || null,
      requirements: {
        create: requirements,
      },
    },
    include: { dates: { orderBy: { date: "asc" }, take: 1 } },
  })

  revalidatePath("/admin/jobs")
  updateTag("jobs")

  if (data.status === "OPEN") {
    notifyMatchingTalents(job).catch((e) =>
      console.error("[LINE] 通知処理エラー:", e)
    )
  }

  return { success: true }
}

async function notifyMatchingTalents(job: {
  id: string
  genderReq: string | null
  ageMin: number | null
  ageMax: number | null
  heightMin: number | null
  heightMax: number | null
}) {
  const talents = await prisma.talent.findMany({
    where: { status: "ACTIVE", lineUserId: { not: null } },
    select: { id: true, gender: true, birthDate: true, height: true },
  })

  const ids = talents
    .filter((t) => matchTalentToJob(t, job).matchStatus !== "unmatch")
    .map((t) => t.id)

  if (ids.length > 0) {
    await sendLineNotification(job.id, ids)
  }
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

export async function sendLineNotification(jobId: string, talentIds: string[]) {
  if (talentIds.length === 0) return { error: "送信先が選択されていません" }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { dates: { orderBy: { date: "asc" }, take: 1 } },
  })
  if (!job) return { error: "案件が見つかりません" }

  const talents = await prisma.talent.findMany({
    where: { id: { in: talentIds }, lineUserId: { not: null } },
    select: { lineUserId: true },
  })

  const lines = [`新しい案件が登録されました\n`, `■ ${job.title}`]
  if (job.dates.length > 0) {
    const d = job.dates[0]
    lines.push(`日程: ${formatDate(d.date)}${d.startTime ? ` ${d.startTime}〜` : ""}`)
  }
  if (job.location) lines.push(`場所: ${job.location}`)
  if (job.fee) lines.push(`報酬: ¥${job.fee.toLocaleString()}`)
  lines.push(`\n詳細・応募はこちら\nhttps://app.vozel.jp/jobs/${job.id}`)
  const message = lines.join("\n")

  let sentCount = 0
  for (const talent of talents) {
    const ok = await sendLinePush(talent.lineUserId!, message)
    if (ok) sentCount++
  }

  return { success: true, sentCount, totalSelected: talentIds.length }
}

export async function deleteJob(id: string) {
  await prisma.job.delete({ where: { id } })
  revalidatePath("/admin/jobs")
  updateTag("jobs")
  return { success: true }
}
