// テスト環境専用。本番へは移植しない（本番反映時はこのファイルを除く）。
// KAMITE の受け口（POST /api/external/jobs）へ、署名つきで案件を1件送る。
//
// 使い方：
//   npx tsx scripts/send-test-kamite-job.ts <本文のJSONファイル> [送り先のURL]
//   送り先の既定は http://localhost:3000/api/external/jobs
//   .env.local の KAMITE_API_KEY / KAMITE_API_SECRET を使う

import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { readFileSync } from "node:fs"
import { createHmac } from "node:crypto"

async function main() {
  const [file, url = "http://localhost:3000/api/external/jobs"] = process.argv.slice(2)
  if (!file) {
    console.error("使い方: npx tsx scripts/send-test-kamite-job.ts <本文のJSONファイル> [送り先のURL]")
    process.exit(1)
  }
  const apiKey = process.env.KAMITE_API_KEY
  const secret = process.env.KAMITE_API_SECRET
  if (!apiKey || !secret) {
    console.error(".env.local に KAMITE_API_KEY / KAMITE_API_SECRET がありません")
    process.exit(1)
  }

  const body = JSON.stringify(JSON.parse(readFileSync(file, "utf-8")))
  const timestamp = String(Math.floor(Date.now() / 1000))
  const signature = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex")

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Kamite-Source": "KAMITE",
      "X-Kamite-Timestamp": timestamp,
      "X-Kamite-Signature": signature,
    },
    body,
  })
  console.log(res.status, await res.text())
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
