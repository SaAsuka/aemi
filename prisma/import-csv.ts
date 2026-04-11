import "dotenv/config"
import { readFileSync } from "fs"
import { resolve } from "path"
import Papa from "papaparse"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"

const CSV_PATH = resolve(
  process.env.HOME!,
  "Downloads/VOZELコンポジット作成フォーム（回答） - コンポジット情報.csv"
)

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

type CsvRow = Record<string, string>

function parseTimestamp(raw: string): Date {
  // "2025/07/11 10:16:35 午前 GMT+9" or "2025/09/11 0:05:19"
  const m = raw.match(
    /^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{1,2}):(\d{2}):(\d{2})\s*(午前|午後)?\s*(GMT\+\d+)?$/
  )
  if (!m) return new Date(raw)
  const [, y, mo, d, hRaw, min, sec, ampm] = m
  let h = parseInt(hRaw)
  if (ampm === "午後" && h < 12) h += 12
  if (ampm === "午前" && h === 12) h = 0
  return new Date(`${y}-${mo}-${d}T${String(h).padStart(2, "0")}:${min}:${sec}+09:00`)
}

function parseBirthDate(raw: string): Date | null {
  if (!raw) return null
  const normalized = raw.replace(/\//g, "-")
  const m = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  return new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00+09:00`)
}

function parseGender(raw: string): "MALE" | "FEMALE" | null {
  if (raw === "女" || raw === "女性") return "FEMALE"
  if (raw === "男" || raw === "男性") return "MALE"
  return null
}

function parseHeight(raw: string): number | null {
  if (!raw) return null
  const m = raw.match(/(\d+(?:\.\d+)?)\s*(?:cm|㎝|センチ)?/)
  if (!m) return null
  return Math.floor(parseFloat(m[1]))
}

function parseSize(raw: string): {
  bust: number | null
  waist: number | null
  hip: number | null
  shoeSize: number | null
} {
  const none = { bust: null, waist: null, hip: null, shoeSize: null }
  if (!raw || /分からない|わからない/i.test(raw)) return none

  let bust: number | null = null
  let waist: number | null = null
  let hip: number | null = null
  let shoeSize: number | null = null

  // ラベル付き: "B:76.5cn W:65.5cm H:85.0cm Shoes:23.5cm" or "B 79 W54.5 H 78 23cm"
  // or "B 87cm / W 70cm / H89cm / Shoes 27cm" or "B 75/W64/H88/22-23cm"
  const bMatch = raw.match(/B\s*[:/]?\s*(\d+(?:\.\d+)?)/i)
  const wMatch = raw.match(/W\s*[:/]?\s*(\d+(?:\.\d+)?)/i)
  const hMatch = raw.match(/H\s*[:/]?\s*(\d+(?:\.\d+)?)/i)
  const sMatch = raw.match(/Shoes?\s*[:/]?\s*(\d+(?:\.\d+)?)/i)

  if (bMatch || wMatch || hMatch) {
    bust = bMatch ? parseFloat(bMatch[1]) : null
    waist = wMatch ? parseFloat(wMatch[1]) : null
    hip = hMatch ? parseFloat(hMatch[1]) : null
    shoeSize = sMatch ? parseFloat(sMatch[1]) : null

    // 靴サイズがなくても末尾の数値を探す
    if (!shoeSize) {
      const trailing = raw.match(/(?:^|[\s/])(\d{2}(?:\.\d+)?)\s*(?:cm)?$/i)
      if (trailing) {
        const v = parseFloat(trailing[1])
        if (v >= 20 && v <= 30) shoeSize = v
      }
    }

    return {
      bust: bust ? Math.round(bust) : null,
      waist: waist ? Math.round(waist) : null,
      hip: hip ? Math.round(hip) : null,
      shoeSize,
    }
  }

  // スラッシュ区切り: "86/60/88/24" or "80/70/88/24"
  const slashMatch = raw.match(
    /(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*(?:\/\s*(\d+(?:\.\d+)?))?/
  )
  if (slashMatch) {
    bust = Math.round(parseFloat(slashMatch[1]))
    waist = Math.round(parseFloat(slashMatch[2]))
    hip = Math.round(parseFloat(slashMatch[3]))
    shoeSize = slashMatch[4] ? parseFloat(slashMatch[4]) : null

    // 末尾に靴サイズ "24.5cm" 等
    if (!shoeSize) {
      const after = raw.slice(raw.indexOf(slashMatch[0]) + slashMatch[0].length)
      const sAfter = after.match(/(\d+(?:\.\d+)?)\s*(?:cm)?/i)
      if (sAfter) {
        const v = parseFloat(sAfter[1])
        if (v >= 20 && v <= 30) shoeSize = v
      }
    }
    return { bust, waist, hip, shoeSize }
  }

  // ハイフン区切り: "80-70-90   26.0"
  const dashMatch = raw.match(
    /(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/
  )
  if (dashMatch) {
    return {
      bust: Math.round(parseFloat(dashMatch[1])),
      waist: Math.round(parseFloat(dashMatch[2])),
      hip: Math.round(parseFloat(dashMatch[3])),
      shoeSize: parseFloat(dashMatch[4]),
    }
  }

  // 靴サイズのみ: "27.5cm"
  const shoeOnly = raw.match(/^(\d+(?:\.\d+)?)\s*(?:cm)?$/i)
  if (shoeOnly) {
    const v = parseFloat(shoeOnly[1])
    if (v >= 20 && v <= 30) return { bust: null, waist: null, hip: null, shoeSize: v }
  }

  return none
}

function extractUrl(raw: string): string | null {
  if (!raw) return null
  if (/^(無し|なし|ナシ|無)$/i.test(raw.trim())) return null

  const urlMatch = raw.match(/https?:\/\/[^\s,，、\n]+/)
  if (urlMatch) return urlMatch[0]

  // ハンドルのみ (@xxx)
  const handleMatch = raw.match(/@[\w.]+/)
  if (handleMatch) return handleMatch[0]

  return raw.trim() || null
}

function extractSnsUrls(raw: string): { instagram: string | null; x: string | null; tiktok: string | null } {
  const urls = raw.match(/https?:\/\/[^\s,，、\n]+/g) || []
  let instagram: string | null = null
  let x: string | null = null
  let tiktok: string | null = null

  for (const url of urls) {
    if (url.includes("instagram.com")) instagram = url
    else if (url.includes("x.com") || url.includes("twitter.com")) x = url
    else if (url.includes("tiktok.com")) tiktok = url
  }
  return { instagram, x, tiktok }
}

function isNashi(raw: string): boolean {
  return /^(無し|なし|ナシ|無|特になし)$/i.test(raw.trim())
}

function nullIfEmpty(raw: string): string | null {
  if (!raw || raw.trim() === "") return null
  return raw.trim()
}

function nullIfNashi(raw: string): string | null {
  if (!raw || raw.trim() === "" || isNashi(raw)) return null
  return raw.trim()
}

async function main() {
  const csvText = readFileSync(CSV_PATH, "utf-8")
  const { data } = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  })

  console.log(`CSV読み込み完了: ${data.length}件`)

  // タレントデータを依存順に全削除（クライアント・案件は残す）
  const delSchedule = await prisma.schedule.deleteMany()
  const delApp = await prisma.application.deleteMany()
  const delSubmission = await prisma.applicationSubmission.deleteMany()
  const delPhoto = await prisma.talentPhoto.deleteMany()
  const delWork = await prisma.talentWork.deleteMany()
  const delToken = await prisma.authToken.deleteMany()
  const delTalent = await prisma.talent.deleteMany()
  console.log(
    `既存タレントデータ削除: talent=${delTalent.count}, photo=${delPhoto.count}, work=${delWork.count}, app=${delApp.count}, schedule=${delSchedule.count}`
  )

  let count = 0
  for (const row of data) {
    const cols = Object.keys(row)
    const timestamp = row[cols[0]] || ""
    const name = row[cols[1]] || ""
    const email = row[cols[2]] || ""
    const birthDateRaw = row[cols[3]] || ""
    const sizeRaw = row[cols[4]] || ""
    const genderRaw = row[cols[5]] || ""
    const category = row[cols[6]] || ""
    const birthplace = row[cols[7]] || ""
    const address = row[cols[8]] || ""
    const heightRaw = row[cols[9]] || ""
    const skills = row[cols[10]] || ""
    const hobbies = row[cols[11]] || ""
    const qualifications = row[cols[12]] || ""
    const career = row[cols[13]] || ""
    const representativeWork = row[cols[14]] || ""
    const instagramRaw = row[cols[15]] || ""
    const xRaw = row[cols[16]] || ""
    const tiktokRaw = row[cols[17]] || ""
    const bankName = row[cols[18]] || ""
    const bankBranch = row[cols[19]] || ""
    const bankAccountType = row[cols[20]] || ""
    const bankAccountNumber = row[cols[21]] || ""
    const bankAccountHolder = row[cols[22]] || ""

    if (!name.trim()) continue

    const size = parseSize(sizeRaw)

    // Instagram欄に複数SNSが混在している場合
    let instagramUrl = extractUrl(instagramRaw)
    let xUrl = extractUrl(xRaw)
    let tiktokUrl = extractUrl(tiktokRaw)

    // Instagram欄に複数URLが入っている場合の処理
    if (instagramRaw.includes("tiktok.com") || instagramRaw.includes("x.com") || instagramRaw.includes("twitter.com")) {
      const multi = extractSnsUrls(instagramRaw)
      instagramUrl = multi.instagram || instagramUrl
      if (!xUrl && multi.x) xUrl = multi.x
      if (!tiktokUrl && multi.tiktok) tiktokUrl = multi.tiktok
    }

    // X欄にTikTokが入っている場合もチェック
    if (xRaw.includes("tiktok.com")) {
      const multi = extractSnsUrls(xRaw)
      if (!tiktokUrl && multi.tiktok) tiktokUrl = multi.tiktok
      if (multi.x) xUrl = multi.x
    }

    // nameKana: 口座名義（カタカナ）があればそれを使用
    const nameKana = bankAccountHolder.trim()
      ? bankAccountHolder.trim()
      : "未設定"

    const talent = await prisma.talent.create({
      data: {
        name: name.trim(),
        nameKana,
        stageName: name.trim(),
        email: nullIfEmpty(email),
        gender: parseGender(genderRaw),
        birthDate: parseBirthDate(birthDateRaw),
        height: parseHeight(heightRaw),
        bust: size.bust,
        waist: size.waist,
        hip: size.hip,
        shoeSize: size.shoeSize,
        skills: nullIfEmpty(skills),
        hobbies: nullIfEmpty(hobbies),
        qualifications: nullIfEmpty(qualifications),
        career: nullIfEmpty(career),
        category: nullIfEmpty(category),
        representativeWork: nullIfNashi(representativeWork),
        birthplace: nullIfEmpty(birthplace),
        address: nullIfEmpty(address),
        status: "ACTIVE",
        createdAt: timestamp ? parseTimestamp(timestamp) : new Date(),
      },
    })
    count++
    console.log(`  [${count}] ${talent.name}`)
  }

  console.log(`\nインポート完了: ${count}件のタレントを登録しました`)
}

main()
  .catch((e) => {
    console.error("エラー:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
