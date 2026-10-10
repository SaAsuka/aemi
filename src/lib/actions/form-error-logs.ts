"use server"

import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { parseSubmissionFields } from "@/lib/submission-fields"

export type FormErrorLogFilter = { code?: string; form?: string; talentId?: string; jobId?: string }

// 管理画面「エラー記録」。直近の失敗を、タレント名・案件名・項目名つきで返す
export async function getFormErrorLogs(filter: FormErrorLogFilter) {
  await requireAdmin()
  const code = filter.code?.trim().toUpperCase()
  const logs = await prisma.formErrorLog.findMany({
    where: {
      ...(code ? { code: { contains: code.startsWith("E-") ? code : `E-${code}` } } : {}),
      ...(filter.form ? { form: filter.form } : {}),
      ...(filter.talentId ? { talentId: filter.talentId } : {}),
      ...(filter.jobId ? { jobId: filter.jobId } : {}),
    },
    orderBy: { occurredAt: "desc" },
    take: 200,
  })

  // 記録はタレント・案件の削除後も残すため外部キーを張っていない。名前は別に引く
  const talentIds = [...new Set(logs.map((l) => l.talentId).filter((v): v is string => !!v))]
  const jobIds = [...new Set(logs.map((l) => l.jobId).filter((v): v is string => !!v))]
  const [talents, jobs] = await Promise.all([
    prisma.talent.findMany({ where: { id: { in: talentIds } }, select: { id: true, name: true } }),
    prisma.job.findMany({ where: { id: { in: jobIds } }, select: { id: true, title: true, submissionFields: true } }),
  ])
  const talentName = new Map(talents.map((t) => [t.id, t.name]))
  const jobTitle = new Map(jobs.map((j) => [j.id, j.title]))
  const fieldLabel = new Map(
    jobs.flatMap((j) => parseSubmissionFields(j.submissionFields).map((f) => [`${j.id}:${f.key}`, f.label] as const))
  )

  return logs.map((l) => ({
    ...l,
    talentName: l.talentId ? talentName.get(l.talentId) ?? "（削除されたタレント）" : null,
    jobTitle: l.jobId ? jobTitle.get(l.jobId) ?? "（削除された案件）" : null,
    fieldLabel: l.jobId && l.field ? fieldLabel.get(`${l.jobId}:${l.field}`) ?? l.field : l.field,
  }))
}
