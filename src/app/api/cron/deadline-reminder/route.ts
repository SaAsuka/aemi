import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { matchTalentToJob } from "@/lib/utils/job-matching"
import { sendLinePush, buildDeadlineReminderMessage } from "@/lib/line"

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  const jobs = await prisma.job.findMany({
    where: {
      status: "OPEN",
      deadline: { gte: now, lte: threeDaysLater },
    },
    select: {
      id: true,
      title: true,
      deadline: true,
      genderReq: true,
      ageMin: true,
      ageMax: true,
      heightMin: true,
      heightMax: true,
    },
  })

  if (jobs.length === 0) {
    return NextResponse.json({ sent: 0, jobs: 0, timestamp: now.toISOString() })
  }

  const talents = await prisma.talent.findMany({
    where: {
      status: "ACTIVE",
      lineUserId: { not: null },
      lineNotifyEnabled: true,
    },
    select: {
      id: true,
      gender: true,
      birthDate: true,
      height: true,
      lineUserId: true,
    },
  })

  let sentCount = 0

  for (const job of jobs) {
    const existingApplications = await prisma.application.findMany({
      where: { jobId: job.id },
      select: { talentId: true },
    })
    const appliedTalentIds = new Set(existingApplications.map((a) => a.talentId))

    const existingReminders = await prisma.deadlineReminder.findMany({
      where: { jobId: job.id },
      select: { talentId: true },
    })
    const remindedTalentIds = new Set(existingReminders.map((r) => r.talentId))

    for (const talent of talents) {
      if (appliedTalentIds.has(talent.id) || remindedTalentIds.has(talent.id)) continue

      const { matchStatus } = matchTalentToJob(talent, job)
      if (matchStatus !== "match") continue

      const message = buildDeadlineReminderMessage(job.title, job.id, job.deadline!)
      const sent = await sendLinePush(talent.lineUserId!, message)

      if (sent) {
        await prisma.deadlineReminder.create({
          data: { jobId: job.id, talentId: talent.id },
        })
        sentCount++
      }
    }
  }

  return NextResponse.json({
    sent: sentCount,
    jobs: jobs.length,
    timestamp: now.toISOString(),
  })
}
