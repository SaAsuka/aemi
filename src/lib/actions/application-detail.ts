"use server"

import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { logger } from "@/lib/logger"
import { parseSubmissionAnswers, parseSubmissionFields } from "@/lib/submission-fields"

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
