import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const result = await prisma.application.updateMany({
    where: {
      status: "APPLIED",
      job: {
        deadline: { lt: sevenDaysAgo },
      },
    },
    data: {
      status: "AUTO_REJECTED",
      decidedAt: new Date(),
    },
  })

  return NextResponse.json({
    updated: result.count,
    timestamp: new Date().toISOString(),
  })
}
