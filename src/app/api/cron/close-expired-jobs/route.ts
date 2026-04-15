import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()

  const reopened = await prisma.job.updateMany({
    where: {
      status: "CLOSED",
      deadline: { gte: now },
    },
    data: {
      status: "OPEN",
    },
  })

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
    reopened: reopened.count,
    closed: closed.count,
    timestamp: new Date().toISOString(),
  })
}
