import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const reopened = await prisma.job.updateMany({
    where: {
      status: "CLOSED",
      deadline: { gte: today },
    },
    data: {
      status: "OPEN",
    },
  })

  const closed = await prisma.job.updateMany({
    where: {
      status: "OPEN",
      deadline: { lt: today },
    },
    data: {
      status: "CLOSED",
    },
  })

  return NextResponse.json({
    reopened: reopened.count,
    closed: closed.count,
    timestamp: new Date().toISOString(),
  })
}
