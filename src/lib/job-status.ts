import "server-only"
import { prisma } from "@/lib/db"

// 募集中で締切を過ぎた案件を「募集終了」にする（管理画面を開いたときに呼ぶ。1日1回の cron と同じ処理）
// ※ 募集終了 → 募集中 に自動で戻すことはしない（人が早めに締めた案件まで戻ってしまうため）。
//    締切を延ばして保存したときだけ updateJob で戻す
export async function syncJobStatusByDeadline() {
  const closed = await prisma.job.updateMany({
    where: { status: "OPEN", deadline: { lt: new Date() } },
    data: { status: "CLOSED" },
  })
  return { closed: closed.count }
}
