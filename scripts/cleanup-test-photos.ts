import pg from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"
import { del } from "@vercel/blob"

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL ?? "" })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

async function main() {
  const talents = await prisma.talent.findMany({
    where: {
      OR: [
        { name: { contains: "テスト", mode: "insensitive" } },
        { name: { contains: "test", mode: "insensitive" } },
        { stageName: { contains: "テスト", mode: "insensitive" } },
        { stageName: { contains: "test", mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      stageName: true,
      photos: { select: { id: true, url: true } },
      works: { select: { id: true, imageUrl: true } },
    },
  })

  console.log(`テストタレント ${talents.length} 件見つかりました:`)
  for (const t of talents) {
    console.log(`\n  [${t.id}] ${t.name} (${t.stageName ?? "-"})`)
    console.log(`    写真: ${t.photos.length} 件`)
    for (const p of t.photos) console.log(`      ${p.url}`)
    console.log(`    作品: ${t.works.length} 件`)
    for (const w of t.works) console.log(`      ${w.imageUrl}`)
  }

  const dryRun = process.argv.includes("--dry-run")
  if (dryRun) {
    console.log("\n[DRY RUN] 実際の削除は行いません。--executeを付けて再実行してください。")
    return
  }

  for (const t of talents) {
    const photoIds = t.photos.map((p) => p.id)
    const workIds = t.works.map((w) => w.id)

    if (photoIds.length > 0) {
      await prisma.talentPhoto.deleteMany({ where: { id: { in: photoIds } } })
      console.log(`\n[${t.name}] 写真 ${photoIds.length} 件をDBから削除`)

      const blobUrls = t.photos.map((p) => p.url).filter((u) => u.includes("blob.vercel-storage.com"))
      if (blobUrls.length > 0) {
        await del(blobUrls)
        console.log(`  Blob ${blobUrls.length} 件を削除`)
      }
    }

    if (workIds.length > 0) {
      await prisma.talentWork.deleteMany({ where: { id: { in: workIds } } })
      console.log(`[${t.name}] 作品 ${workIds.length} 件をDBから削除`)

      const blobUrls = t.works.map((w) => w.imageUrl).filter((u) => u.includes("blob.vercel-storage.com"))
      if (blobUrls.length > 0) {
        await del(blobUrls)
        console.log(`  Blob ${blobUrls.length} 件を削除`)
      }
    }
  }

  console.log("\n完了しました。")
}

main()
  .catch(console.error)
  .finally(() => pool.end())
