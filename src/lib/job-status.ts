import "server-only"
import { prisma } from "@/lib/db"

// 締切に合わせて案件の状態をそろえる（管理画面を開いたときに呼ぶ。1日1回の cron と同じ処理）
// - 募集中で締切を過ぎた案件 → 募集終了
// - 募集終了で締切が先にある案件（締切を延ばした等） → 募集中に戻す
export async function syncJobStatusByDeadline() {
  const now = new Date()
  const [closed, reopened] = await prisma.$transaction([
    prisma.job.updateMany({ where: { status: "OPEN", deadline: { lt: now } }, data: { status: "CLOSED" } }),
    prisma.job.updateMany({ where: { status: "CLOSED", deadline: { gte: now } }, data: { status: "OPEN" } }),
  ])
  return { closed: closed.count, reopened: reopened.count }
}
