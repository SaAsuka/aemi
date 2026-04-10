import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const startOf2024 = new Date("2024-01-01T00:00:00Z")
  const endOf2024 = new Date("2024-12-31T23:59:59Z")

  const jobs = await prisma.job.findMany({
    where: { deadline: { gte: startOf2024, lte: endOf2024 } },
    select: { id: true, title: true, deadline: true },
  })

  const jobResults = []
  for (const job of jobs) {
    const oldDate = job.deadline!
    const newDate = new Date(oldDate)
    newDate.setFullYear(2026)
    await prisma.job.update({
      where: { id: job.id },
      data: { deadline: newDate },
    })
    jobResults.push({ title: job.title, from: oldDate.toISOString().split("T")[0], to: newDate.toISOString().split("T")[0] })
  }

  const jobDates = await prisma.jobDate.findMany({
    where: { date: { gte: startOf2024, lte: endOf2024 } },
    include: { job: { select: { title: true } } },
  })

  const dateResults = []
  for (const jd of jobDates) {
    const newDate = new Date(jd.date)
    newDate.setFullYear(2026)
    await prisma.jobDate.update({
      where: { id: jd.id },
      data: { date: newDate },
    })
    dateResults.push({ title: jd.job.title, type: jd.type, from: jd.date.toISOString().split("T")[0], to: newDate.toISOString().split("T")[0] })
  }

  return NextResponse.json({
    fixedJobs: jobResults.length,
    fixedDates: dateResults.length,
    jobs: jobResults,
    dates: dateResults,
  })
}
