import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log(`接続先: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":***@")}`)

  await prisma.$executeRawUnsafe(
    `ALTER TABLE "talent_subscriptions" ADD COLUMN IF NOT EXISTS "priceId" TEXT;`,
  )
  console.log("✓ priceId カラムを追加しました")

  // _prisma_migrations に適用済みとして記録する（migrate deployとの整合性のため）
  const existing: { id: string }[] = await prisma.$queryRawUnsafe(
    `SELECT id FROM _prisma_migrations WHERE migration_name = '20261002000000_add_subscription_price_id';`,
  )
  if (existing.length === 0) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
      VALUES (gen_random_uuid()::text, '', now(), '20261002000000_add_subscription_price_id', NULL, NULL, now(), 1);
    `)
    console.log("✓ _prisma_migrations に記録しました")
  } else {
    console.log("既に記録済みです")
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
