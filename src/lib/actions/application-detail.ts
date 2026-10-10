"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { logger } from "@/lib/logger"
import {
  buildAnswerFromForm,
  hasMissingRequired,
  parseSubmissionAnswers,
  parseSubmissionFields,
  type SubmissionAnswer,
} from "@/lib/submission-fields"

const warn = (event: string, detail: Record<string, unknown>) => logger.warn(event, detail)

// 管理画面の応募詳細。自由な提出項目の回答・今の4種類の提出物・タレントに登録済みのコンポジットを返す
export async function getApplicationDetail(id: string) {
  await requireAdmin()
  const app = await prisma.application.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      appliedAt: true,
      hasMissingAnswers: true,
      submissionAnswers: true,
      talent: { select: { id: true, name: true, resume: true } },
      job: { select: { id: true, title: true, submissionFields: true } },
      submissions: { select: { id: true, category: true, fileUrl: true, externalUrl: true, fileName: true } },
    },
  })
  if (!app) return null
  return {
    ...app,
    fields: parseSubmissionFields(app.job.submissionFields, warn),
    answers: parseSubmissionAnswers(app.submissionAnswers, warn),
  }
}

// 管理者が応募詳細で、自由項目の回答を登録・差し替え・修正する（別途送ってもらったものを入れる等）。
// プロフィールは書き換えない。差し替えた古いファイルは消さない
export async function updateApplicationAnswer(
  applicationId: string,
  key: string,
  input: { value?: string | null; fileUrl?: string | null; fileName?: string | null }
): Promise<{ success: true } | { error: string }> {
  await requireAdmin()
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    select: { talentId: true, jobId: true, submissionAnswers: true, job: { select: { submissionFields: true } } },
  })
  if (!app) return { error: "応募が見つかりません" }

  const fields = parseSubmissionFields(app.job.submissionFields, warn)
  const field = fields.find((f) => f.key === key)
  if (!field || field.autofill === "COMPOSITE") return { error: "この項目は登録できません" }

  const values: Record<string, string | null | undefined> = {
    [`ans_${key}_value`]: input.value,
    [`ans_${key}_fileUrl`]: input.fileUrl,
    [`ans_${key}_fileName`]: input.fileName,
  }
  const built = buildAnswerFromForm(field, (name) => values[name] ?? null, { talentId: app.talentId, jobId: app.jobId })
  if (!built.ok) return { error: built.error }
  if (!built.answer) {
    return { error: field.kind === "PHOTO" || field.kind === "FILE" ? "ファイルを選んでください" : "内容を入力してください" }
  }

  const answer: SubmissionAnswer = { ...built.answer, origin: "ADMIN", updatedAt: new Date().toISOString() }
  const answers = [...parseSubmissionAnswers(app.submissionAnswers, warn).filter((a) => a.key !== key), answer]

  await prisma.application.update({
    where: { id: applicationId },
    data: { submissionAnswers: answers, hasMissingAnswers: hasMissingRequired(fields, answers) },
  })
  revalidatePath(`/admin/applications/${applicationId}`)
  revalidatePath("/admin/applications")
  revalidatePath(`/admin/jobs/${app.jobId}`)
  return { success: true }
}
