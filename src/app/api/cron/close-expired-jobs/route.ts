import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()

  const result = await prisma.job.updateMany({
    where: {
      status: "OPEN",
      deadline: { lt: now },
    },
    data: {
      status: "CLOSED",
    },
  })

  return NextResponse.json({
    closed: result.count,
    timestamp: now.toISOString(),
  })
}
