import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const TABLES = [
  "agencies",
  "agency_admins",
  "agency_relations",
  "talents",
  "talent_login_histories",
  "talent_bank_accounts",
  "talent_social_links",
  "talent_subscriptions",
  "talent_photos",
  "talent_works",
  "clients",
  "jobs",
  "external_job_logs",
  "job_dates",
  "applications",
  "schedules",
  "job_requirements",
  "auth_tokens",
  "application_submissions",
  "deadline_reminders",
  "options",
  "option_purchases",
  "production_companies",
  "invoices",
  "freee_tokens",
  "user_events",
]

async function main() {
  console.log(`接続先: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":***@")}`)
  for (const table of TABLES) {
    await prisma.$executeRawUnsafe(`ALTER TABLE public."${table}" ENABLE ROW LEVEL SECURITY;`)
    console.log(`✓ ${table}`)
  }
  console.log("完了")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
