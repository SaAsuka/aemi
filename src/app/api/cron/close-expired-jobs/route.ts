import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()

  // 募集終了 → 募集中 に自動で戻すことはしない（人が早めに締めた案件まで戻ってしまうため）。
  // 締切を延ばして保存したときだけ updateJob で戻す
  const closed = await prisma.job.updateMany({
    where: {
      status: "OPEN",
      deadline: { lt: now },
    },
    data: {
      status: "CLOSED",
    },
  })

  return NextResponse.json({
    closed: closed.count,
    timestamp: new Date().toISOString(),
  })
}
