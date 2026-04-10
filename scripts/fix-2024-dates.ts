import pg from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client.js"

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const startOf2024 = new Date("2024-01-01T00:00:00Z")
  const endOf2024 = new Date("2024-12-31T23:59:59Z")

  const jobs = await prisma.job.findMany({
    where: {
      deadline: { gte: startOf2024, lte: endOf2024 },
    },
    select: { id: true, title: true, deadline: true, status: true },
  })

  console.log(`\n対象案件: ${jobs.length}件`)
  for (const job of jobs) {
    const oldDate = job.deadline!
    const newDate = new Date(oldDate)
    newDate.setFullYear(2026)

    await prisma.job.update({
      where: { id: job.id },
      data: { deadline: newDate },
    })
    console.log(`  ${job.title}: ${oldDate.toISOString().split("T")[0]} → ${newDate.toISOString().split("T")[0]}`)
  }

  const jobDates = await prisma.jobDate.findMany({
    where: {
      date: { gte: startOf2024, lte: endOf2024 },
    },
    include: { job: { select: { title: true } } },
  })

  console.log(`\n対象日程: ${jobDates.length}件`)
  for (const jd of jobDates) {
    const newDate = new Date(jd.date)
    newDate.setFullYear(2026)

    await prisma.jobDate.update({
      where: { id: jd.id },
      data: { date: newDate },
    })
    console.log(`  ${jd.job.title} [${jd.type}]: ${jd.date.toISOString().split("T")[0]} → ${newDate.toISOString().split("T")[0]}`)
  }

  console.log("\n完了")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
