import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const result = await prisma.job.updateMany({
    where: {
      status: "OPEN",
      deadline: { lt: today },
    },
    data: {
      status: "CLOSED",
    },
  })

  return NextResponse.json({
    closed: result.count,
    timestamp: today.toISOString(),
  })
}
