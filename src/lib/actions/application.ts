"use server"

import { getSession, requireAdmin } from "@/lib/auth"
import { isErrorCode } from "@/lib/error-code"
import { revalidatePath, updateTag } from "next/cache"
import { after } from "next/server"
import { resolveApplicant, resolveRequester } from "@/lib/applicant"
import { logger } from "@/lib/logger"
import { recordFormError } from "@/lib/form-error-log"
import {
  buildAnswerFromForm,
  hasMissingRequired,
  isAgeLocked,
  missingMessage,
  profileInitialValue,
  parseSubmissionAnswers,
  parseSubmissionFields,
  sameFieldKeys,
  visibleFields,
  type SubmissionAnswer,
  type SubmissionField,
} from "@/lib/submission-fields"
import { del } from "@vercel/blob"
import { deleteFromStorage, isSupabaseStorageUrl } from "@/lib/supabase-storage"
import { prisma } from "@/lib/db"
import { applicationSchema } from "@/lib/validations/application"
import { sendLinePush, buildStatusMessage } from "@/lib/line"
import { sendSlackNotification, buildApplicationNotification } from "@/lib/slack"
import { trackEvent } from "@/lib/track-event"

function buildAppWhere(status?: string, jobId?: string, talentId?: string, missingOnly?: boolean) {
  const where: Record<string, unknown> = {}
  if (status && status !== "ALL") where.status = status
  if (jobId) where.jobId = jobId
  if (talentId) where.talentId = talentId
  if (missingOnly) where.hasMissingAnswers = true
  return where
}

export async function getApplicationCount(status?: string, jobId?: string, talentId?: string, missingOnly?: boolean) {
  await requireAdmin()
  return prisma.application.count({ where: buildAppWhere(status, jobId, talentId, missingOnly) })
}

const APP_SELECT = {
  id: true,
  status: true,
  appliedAt: true,
  hasMissingAnswers: true,
  talent: {
    select: {
      id: true, name: true,
      birthDate: true, height: true, gender: true,
      nearestStation: true, resume: true,
      profileImage: true,
    },
  },
  job: {
    select: {
      id: true, title: true, deadline: true, fee: true,
      dates: { orderBy: { date: "asc" as const } },
    },
  },
  submissions: {
    select: {
      id: true, category: true, fileUrl: true, externalUrl: true, fileName: true,
    },
  },
  invoices: {
    select: { id: true, status: true, freeeInvoiceNumber: true },
    where: { status: { not: "CANCELLED" } },
    take: 1,
  },
  schedule: { select: { date: true, status: true } },
} as const

export async function getApplications(status?: string, jobId?: string, sort?: string, order?: string, page?: number, talentId?: string, missingOnly?: boolean) {
  await requireAdmin()
  const where = buildAppWhere(status, jobId, talentId, missingOnly)
  const sortOrder: "asc" | "desc" = order === "asc" ? "asc" : "desc"
  const pageSize = 50
  const currentPage = page ?? 1

  if (sort === "talent") {
    return prisma.application.findMany({
      where,
      orderBy: { talent: { name: sortOrder } },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
      select: APP_SELECT,
    })
  }
  if (sort === "job") {
    return prisma.application.findMany({
      where,
      orderBy: { job: { title: sortOrder } },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
      select: APP_SELECT,
    })
  }
  if (sort === "status") {
    return prisma.application.findMany({
      where,
      orderBy: { status: sortOrder },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
      select: APP_SELECT,
    })
  }
  return prisma.application.findMany({
    where,
    orderBy: { appliedAt: sortOrder },
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
    select: APP_SELECT,
  })
}

export async function getApplication(id: string) {
  await requireAdmin()
  return prisma.application.findUnique({
    where: { id },
    include: {
      talent: true,
      job: { include: { client: true } },
      schedule: true,
    },
  })
}

const SUBMISSION_CATEGORIES = ["ACTING_VIDEO", "VOICE_SAMPLE", "PAST_WORK_VIDEO", "PROFILE_PHOTO"] as const

// 応募済みの応募で「あとで別途送る」になっている項目（再送で完了扱いにしたときも案内を出すため）
function deferredItems(json: unknown): { label: string; code: string | null }[] {
  return parseSubmissionAnswers(json)
    .filter((a) => a.origin === "DEFERRED")
    .map((a) => ({ label: a.label, code: a.errorCode }))
}

function isUniqueViolation(e: unknown) {
  return (e as { code?: string } | null)?.code === "P2002"
}

export async function createApplication(formData: FormData) {
  try {
    return await createApplicationInner(formData)
  } catch (e) {
    // 想定外の失敗。タレントには受付番号と「時間をおいて再送」を返し、原因は記録に残す
    const message = e instanceof Error ? e.message : String(e)
    const session = await getSession().catch(() => null)
    const code = await recordFormError({
      form: "application",
      source: "server",
      talentId: session?.role === "talent" ? session.talentId ?? null : null,
      jobId: (formData.get("jobId") as string | null) ?? null,
      reason: "SERVER_ERROR",
      message,
    })
    const text = "応募の送信に失敗しました。時間をおいてもう一度お試しください"
    return { error: { jobId: [`${text}（受付番号：${code}）`] }, message: text, action: "RETRY" as const, code }
  }
}

async function createApplicationInner(formData: FormData) {
  const raw = Object.fromEntries(formData)
  const parsed = applicationSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  // 誰として応募するかは送られてきた talentId / status ではなく、ログイン・専用リンク・管理者かで決める
  const applicant = await resolveApplicant(formData)
  if (!applicant.ok) {
    // 本人確認できない呼び出しは記録テーブルに残さない（外から記録を埋められないように）
    after(() => logger.warn("application_unauthorized", { jobId: parsed.data.jobId }))
    return { error: { talentId: ["ログインし直してください"] } }
  }
  const data = { ...parsed.data, talentId: applicant.talentId, status: applicant.status as typeof parsed.data.status }

  if (applicant.requireResume) {
    const talentResume = await prisma.talent.findUnique({ where: { id: data.talentId }, select: { resume: true } })
    if (!talentResume?.resume) {
      return { error: { jobId: ["コンポジPDFが未登録のため応募できません。先に設定画面から宣材写真をアップロードし、コンポジPDFを生成してください。"] } }
    }
  }

  const existing = await prisma.application.findUnique({
    where: { talentId_jobId: { talentId: data.talentId, jobId: data.jobId } },
  })
  if (existing) {
    // タレント本人の再送（送信が止まった後など）は失敗ではなく完了として返す。管理者の代理応募は今までどおり
    if (!applicant.isAdminProxy) {
      return { success: true, alreadyApplied: true, deferred: deferredItems(existing.submissionAnswers) }
    }
    return { error: { jobId: ["このタレントは既にこの案件に応募済みです"] } }
  }

  const jobDates = await prisma.jobDate.findMany({
    where: { jobId: data.jobId },
    select: { date: true, type: true },
  })

  if (jobDates.length > 0) {
    const jobDateStrings = new Set(jobDates.map((d) => d.date.toISOString().split("T")[0]))

    const activeApps = await prisma.application.findMany({
      where: {
        talentId: data.talentId,
        status: { in: ["APPLIED", "RESUME_SENT", "ACCEPTED"] },
        jobId: { not: data.jobId },
      },
      select: {
        job: {
          select: {
            title: true,
            dates: { select: { date: true, type: true } },
          },
        },
      },
    })

    const typeLabels: Record<string, string> = {
      AUDITION: "オーディション",
      SHOOTING: "撮影",
      OTHER: "予定",
    }

    for (const app of activeApps) {
      for (const existingDate of app.job.dates) {
        const dateStr = existingDate.date.toISOString().split("T")[0]
        if (jobDateStrings.has(dateStr)) {
          const d = new Date(dateStr)
          const label = `${d.getMonth() + 1}月${d.getDate()}日`
          const typeLabel = typeLabels[existingDate.type] ?? "予定"
          return {
            error: {
              jobId: [`${label}に別の案件（${app.job.title}）の${typeLabel}があるため応募できません`],
            },
          }
        }
      }
    }
  }

  const requirements = await prisma.jobRequirement.findMany({
    where: { jobId: data.jobId },
  })

  for (const req of requirements) {
    const fileUrl = formData.get(`sub_${req.category}_fileUrl`) as string
    const externalUrl = formData.get(`sub_${req.category}_externalUrl`) as string
    if (!fileUrl && !externalUrl) {
      return { error: { jobId: ["提出物が不足しています"] } }
    }
  }

  const submissions: {
    category: (typeof SUBMISSION_CATEGORIES)[number]
    fileUrl: string | null
    externalUrl: string | null
    fileName: string | null
  }[] = []

  for (const cat of SUBMISSION_CATEGORIES) {
    const fileUrl = (formData.get(`sub_${cat}_fileUrl`) as string) || null
    const externalUrl = (formData.get(`sub_${cat}_externalUrl`) as string) || null
    const fileName = (formData.get(`sub_${cat}_fileName`) as string) || null
    if (fileUrl || externalUrl) {
      submissions.push({ category: cat, fileUrl, externalUrl, fileName })
    }
  }

  // 案件ごとの自由な提出項目（コンポジの項目はフォームに出さないので最初から対象外）
  const jobFields = await prisma.job.findUnique({ where: { id: data.jobId }, select: { submissionFields: true } })
  const fields = visibleFields(parseSubmissionFields(jobFields?.submissionFields, (e, d) => logger.warn(e, d)))
  const answers: SubmissionAnswer[] = []

  // 管理者の代理応募は画面に自由項目の入力欄が無いので、必須も突き合わせも見ない（後から応募詳細で入れる）
  if (fields.length > 0 && !applicant.isAdminProxy) {
    if (!sameFieldKeys(formData.get("fieldKeys") as string | null, fields)) {
      const message = "案件の内容が更新されました。画面を開き直してください"
      const code = await recordFormError({
        form: "application", source: "server", talentId: data.talentId, jobId: data.jobId, reason: "FIELDS_CHANGED",
      })
      return { error: { fieldKeys: [message] }, message, action: "RELOAD" as const, code }
    }

    // 名前・年齢・身長の項目は、プロフィールのままか書き換えたかを記録する（プロフィール自体は書き換えない）
    const needsProfile = fields.some((f) => f.autofill === "NAME" || f.autofill === "AGE" || f.autofill === "HEIGHT")
    const profile = needsProfile
      ? await prisma.talent.findUnique({ where: { id: data.talentId }, select: { name: true, birthDate: true, height: true } })
      : null
    const today = new Date()

    const fieldErrors: Record<string, string[]> = {}
    const failed: { key: string; reason: "REQUIRED_MISSING" | "INVALID_VALUE" }[] = []
    for (const field of fields) {
      // 生年月日がある年齢は、送られてきた値ではなく生年月日から計算した値にする（画面でも書き換え不可）
      if (profile && isAgeLocked(field, profile)) {
        answers.push({
          key: field.key, label: field.label, kind: field.kind,
          value: profileInitialValue("AGE", profile, today), fileUrl: null, fileName: null,
          origin: "PROFILE", errorCode: null, updatedAt: null,
        })
        continue
      }
      const get = (name: string) => (formData.get(name) as string | null) ?? null
      const built = buildAnswerFromForm(field, get, { talentId: data.talentId, jobId: data.jobId })
      if (!built.ok) {
        fieldErrors[`ans_${field.key}`] = [built.error]
        failed.push({ key: field.key, reason: "INVALID_VALUE" })
        continue
      }
      if (built.answer) {
        const fromProfile = profile && field.autofill && built.answer.value === profileInitialValue(field.autofill, profile, today)
        answers.push(fromProfile ? { ...built.answer, origin: "PROFILE" } : built.answer)
        continue
      }
      // 「あとで別途送る」：その項目のアップロード失敗が記録されているときだけ受け付ける
      const deferred = await deferredAnswer(field, get, data.talentId, data.jobId)
      if (deferred) {
        answers.push(deferred)
        continue
      }
      if (field.required) {
        fieldErrors[`ans_${field.key}`] = [missingMessage(field)]
        failed.push({ key: field.key, reason: "REQUIRED_MISSING" })
      }
    }
    if (Object.keys(fieldErrors).length > 0) {
      for (const f of failed.slice(0, 5)) {
        await recordFormError({
          form: "application", source: "server", talentId: data.talentId, jobId: data.jobId, field: f.key, reason: f.reason,
        })
      }
      return { error: fieldErrors, message: "入力内容を確認してください", action: "FIX_FIELDS" as const }
    }
  }

  try {
    await prisma.application.create({
      data: {
        talentId: data.talentId,
        jobId: data.jobId,
        status: data.status,
        note: data.note || null,
        submissions: {
          create: submissions,
        },
        // 自由項目のない案件は今までどおり何も入れない
        ...(fields.length > 0
          ? { submissionAnswers: answers, hasMissingAnswers: hasMissingRequired(fields, answers) }
          : {}),
      },
    })
  } catch (e) {
    // 同時に2回送られた（止まった後の再送など）とき、2回目は応募済みとして完了扱いにする
    if (isUniqueViolation(e) && !applicant.isAdminProxy) {
      const already = await prisma.application.findUnique({
        where: { talentId_jobId: { talentId: data.talentId, jobId: data.jobId } },
        select: { submissionAnswers: true },
      })
      return { success: true, alreadyApplied: true, deferred: deferredItems(already?.submissionAnswers) }
    }
    throw e
  }

  const [talent, job, appCount] = await Promise.all([
    prisma.talent.findUnique({ where: { id: data.talentId }, select: { name: true } }),
    prisma.job.findUnique({ where: { id: data.jobId }, select: { title: true } }),
    prisma.application.count({ where: { talentId: data.talentId } }),
  ])
  if (appCount === 1) {
    trackEvent("first_applied", {
      userId: data.talentId,
      userType: "talent",
      properties: { jobId: data.jobId },
    })
  }
  if (talent && job) {
    sendSlackNotification(buildApplicationNotification(talent.name, job.title)).catch((err) => {
      console.error("[Slack] 応募通知送信エラー:", err)
    })
  }

  revalidatePath("/admin/applications")
  revalidatePath("/jobs")
  updateTag("talents")
  updateTag("jobs")
  return {
    success: true,
    deferred: answers.filter((a) => a.origin === "DEFERRED").map((a) => ({ label: a.label, code: a.errorCode })),
  }
}

// 応募の送信が30秒で終わらなかったとき、画面から「実は応募できていたか」を確かめる（タレント本人・専用リンクのみ）
export async function getMyApplicationStatus(jobId: string, t?: string | null) {
  const requester = await resolveRequester({ t })
  if (!requester.ok || requester.isAdminProxy) return { applied: false as const, deferred: [] }
  const app = await prisma.application.findUnique({
    where: { talentId_jobId: { talentId: requester.talentId, jobId } },
    select: { submissionAnswers: true },
  })
  return app ? { applied: true as const, deferred: deferredItems(app.submissionAnswers) } : { applied: false as const, deferred: [] }
}

// 「あとで別途送る」の回答を作る。写真・ファイルの項目で、その応募者・案件・項目のアップロード失敗の記録があるときだけ
async function deferredAnswer(
  field: SubmissionField,
  get: (name: string) => string | null,
  talentId: string,
  jobId: string
): Promise<SubmissionAnswer | null> {
  if (field.kind !== "PHOTO" && field.kind !== "FILE") return null
  if (get(`ans_${field.key}_deferred`) !== "1") return null
  const log = await prisma.formErrorLog.findFirst({
    where: { talentId, jobId, field: field.key, form: "upload" },
    orderBy: { createdAt: "desc" },
    select: { code: true },
  })
  if (!log) return null
  const sentCode = get(`ans_${field.key}_deferred_code`)
  return {
    key: field.key,
    label: field.label,
    kind: field.kind,
    value: null,
    fileUrl: null,
    fileName: null,
    origin: "DEFERRED",
    errorCode: isErrorCode(sentCode) ? sentCode : log.code,
    updatedAt: null,
  }
}

const NOTIFY_STATUSES = new Set(["RESUME_SENT", "ACCEPTED", "REJECTED"])
// 不合格・キャンセルにしたら、登録済みの予定（確定のもの）も「キャンセル」にする。
// 完了・無断欠席は終わった記録なので変えない
const SCHEDULE_CANCEL_STATUSES = new Set(["REJECTED", "CANCELLED"])

async function cancelSchedulesOf(applicationIds: string[]) {
  const res = await prisma.schedule.updateMany({
    where: { applicationId: { in: applicationIds }, status: "CONFIRMED" },
    data: { status: "CANCELLED" },
  })
  if (res.count > 0) revalidatePath("/admin/schedule")
  return res.count
}

export async function updateApplicationStatus(id: string, status: string) {
  await requireAdmin()
  const validStatuses = ["APPLIED", "RESUME_SENT", "ACCEPTED", "REJECTED", "AUTO_REJECTED", "CANCELLED"]
  if (!validStatuses.includes(status)) {
    return { error: "無効なステータスです" }
  }

  const decidedStatuses = ["ACCEPTED", "REJECTED", "AUTO_REJECTED", "CANCELLED"]

  const application = await prisma.application.update({
    where: { id },
    data: {
      status: status as "APPLIED" | "RESUME_SENT" | "ACCEPTED" | "REJECTED" | "AUTO_REJECTED" | "CANCELLED",
      decidedAt: decidedStatuses.includes(status) ? new Date() : null,
    },
    select: {
      talent: { select: { lineUserId: true, lineNotifyEnabled: true } },
      job: { select: { id: true, title: true } },
      schedule: { select: { date: true, startTime: true, endTime: true, location: true } },
    },
  })

  if (NOTIFY_STATUSES.has(status) && application.talent.lineUserId && application.talent.lineNotifyEnabled) {
    const message = buildStatusMessage(status, application.job.title, application.job.id, application.schedule)
    sendLinePush(application.talent.lineUserId, message).catch((err) => {
      console.error("[LINE] ステータス通知送信エラー:", err)
    })
  }

  const cancelledSchedules = SCHEDULE_CANCEL_STATUSES.has(status) ? await cancelSchedulesOf([id]) : 0

  revalidatePath("/admin/applications")
  updateTag("talents")
  updateTag("jobs")
  return { success: true, cancelledSchedules }
}

export async function bulkUpdateApplicationStatus(ids: string[], status: string) {
  await requireAdmin()
  const validStatuses = ["APPLIED", "RESUME_SENT", "ACCEPTED", "REJECTED", "AUTO_REJECTED", "CANCELLED"]
  if (!validStatuses.includes(status)) return { error: "無効なステータスです" }
  if (ids.length === 0) return { error: "対象が選択されていません" }

  const decidedStatuses = ["ACCEPTED", "REJECTED", "AUTO_REJECTED", "CANCELLED"]
  await prisma.application.updateMany({
    where: { id: { in: ids } },
    data: {
      status: status as "APPLIED" | "RESUME_SENT" | "ACCEPTED" | "REJECTED" | "AUTO_REJECTED" | "CANCELLED",
      decidedAt: decidedStatuses.includes(status) ? new Date() : null,
    },
  })
  const cancelledSchedules = SCHEDULE_CANCEL_STATUSES.has(status) ? await cancelSchedulesOf(ids) : 0
  revalidatePath("/admin/applications")
  updateTag("talents")
  updateTag("jobs")
  return { success: true, count: ids.length, cancelledSchedules }
}

// 請求書はお金の記録なので、請求書がある応募は消さない（取消の請求書も含む）
const INVOICE_BLOCK_MESSAGE = "請求書がある応募は削除できません。選考をやめる場合は、状況を「キャンセル」にしてください。"

export async function bulkDeleteApplications(ids: string[]) {
  await requireAdmin()
  if (ids.length === 0) return { error: "対象が選択されていません" }
  const withInvoice = await prisma.application.count({ where: { id: { in: ids }, invoices: { some: {} } } })
  if (withInvoice > 0) {
    return { error: `選んだうち${withInvoice}件に請求書があるため、削除しませんでした。${INVOICE_BLOCK_MESSAGE}` }
  }
  const submissions = await prisma.applicationSubmission.findMany({
    where: { applicationId: { in: ids } },
    select: { fileUrl: true },
  })
  // 予定は応募と一緒には消えない（DBの設定）ので、先に消す
  await prisma.$transaction([
    prisma.schedule.deleteMany({ where: { applicationId: { in: ids } } }),
    prisma.application.deleteMany({ where: { id: { in: ids } } }),
  ])
  const allUrls = submissions.map((s) => s.fileUrl).filter((url): url is string => !!url)
  const vercelUrls = allUrls.filter((u) => u.includes("blob.vercel-storage.com"))
  const supabaseUrls = allUrls.filter((u) => isSupabaseStorageUrl(u))
  if (vercelUrls.length > 0) await del(vercelUrls).catch(() => {})
  if (supabaseUrls.length > 0) await deleteFromStorage(supabaseUrls).catch(() => {})
  revalidatePath("/admin/applications")
  revalidatePath("/admin/schedule")
  updateTag("talents")
  updateTag("jobs")
  return { success: true, count: ids.length }
}

export async function deleteApplication(id: string) {
  await requireAdmin()
  if ((await prisma.invoice.count({ where: { applicationId: id } })) > 0) {
    return { error: INVOICE_BLOCK_MESSAGE }
  }
  const submissions = await prisma.applicationSubmission.findMany({
    where: { applicationId: id },
    select: { fileUrl: true },
  })
  // 予定は応募と一緒には消えない（DBの設定）ので、先に消す
  await prisma.$transaction([
    prisma.schedule.deleteMany({ where: { applicationId: id } }),
    prisma.application.delete({ where: { id } }),
  ])
  const allUrls = submissions.map((s) => s.fileUrl).filter((url): url is string => !!url)
  const vercelUrls = allUrls.filter((u) => u.includes("blob.vercel-storage.com"))
  const supabaseUrls = allUrls.filter((u) => isSupabaseStorageUrl(u))
  if (vercelUrls.length > 0) await del(vercelUrls).catch(() => {})
  if (supabaseUrls.length > 0) await deleteFromStorage(supabaseUrls).catch(() => {})
  revalidatePath("/admin/applications")
  revalidatePath("/admin/schedule")
  updateTag("talents")
  updateTag("jobs")
  return { success: true }
}
