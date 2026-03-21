import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const client1 = await prisma.client.create({
    data: {
      companyName: "株式会社サンプルプロダクション",
      contactName: "田中太郎",
      contactEmail: "tanaka@sample-prod.co.jp",
      contactPhone: "03-1234-5678",
    },
  })

  const client2 = await prisma.client.create({
    data: {
      companyName: "株式会社クリエイティブエージェンシー",
      contactName: "佐藤花子",
      contactEmail: "sato@creative-agency.co.jp",
      contactPhone: "03-9876-5432",
    },
  })

  const talent1 = await prisma.talent.create({
    data: {
      name: "山田美咲",
      nameKana: "ヤマダミサキ",
      email: "misaki@example.com",
      phone: "090-1111-2222",
      gender: "FEMALE",
      birthDate: new Date("2000-05-15"),
      height: 168,
      status: "ACTIVE",
    },
  })

  const talent2 = await prisma.talent.create({
    data: {
      name: "鈴木健太",
      nameKana: "スズキケンタ",
      email: "kenta@example.com",
      phone: "090-3333-4444",
      gender: "MALE",
      birthDate: new Date("1998-11-20"),
      height: 178,
      status: "ACTIVE",
    },
  })

  const talent3 = await prisma.talent.create({
    data: {
      name: "高橋あおい",
      nameKana: "タカハシアオイ",
      email: "aoi@example.com",
      phone: "090-5555-6666",
      gender: "FEMALE",
      birthDate: new Date("2002-03-10"),
      height: 162,
      status: "ACTIVE",
    },
  })

  const job1 = await prisma.job.create({
    data: {
      clientId: client1.id,
      title: "春コレクション広告モデル",
      description: "アパレルブランドの春コレクション広告撮影。屋外ロケ。",
      location: "東京都渋谷区",
      fee: 50000,
      genderReq: "FEMALE",
      ageMin: 18,
      ageMax: 30,
      heightMin: 160,
      heightMax: 175,
      startsAt: new Date("2026-04-10"),
      endsAt: new Date("2026-04-10"),
      deadline: new Date("2026-03-31"),
      capacity: 2,
      status: "OPEN",
    },
  })

  const job2 = await prisma.job.create({
    data: {
      clientId: client2.id,
      title: "Web CM出演",
      description: "ITサービスのWeb CM撮影。スタジオ撮影。",
      location: "東京都港区",
      fee: 80000,
      ageMin: 20,
      ageMax: 35,
      startsAt: new Date("2026-04-15"),
      endsAt: new Date("2026-04-16"),
      deadline: new Date("2026-04-05"),
      capacity: 3,
      status: "OPEN",
    },
  })

  await prisma.application.create({
    data: {
      talentId: talent1.id,
      jobId: job1.id,
      status: "APPLIED",
    },
  })

  await prisma.application.create({
    data: {
      talentId: talent2.id,
      jobId: job2.id,
      status: "RESUME_SENT",
    },
  })

  await prisma.application.create({
    data: {
      talentId: talent3.id,
      jobId: job1.id,
      status: "ACCEPTED",
    },
  })

  console.log("シードデータ投入完了")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
