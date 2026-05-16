import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { del } from "@vercel/blob"

const urls = [
  "https://rr6tqvw6blwsbhmt.private.blob.vercel-storage.com/test-talent/photo-1.svg",
  "https://rr6tqvw6blwsbhmt.private.blob.vercel-storage.com/test-talent/photo-2.svg",
  "https://rr6tqvw6blwsbhmt.private.blob.vercel-storage.com/test-talent/photo-3.svg",
  "https://rr6tqvw6blwsbhmt.private.blob.vercel-storage.com/test-talent/photo-4.svg",
  "https://rr6tqvw6blwsbhmt.private.blob.vercel-storage.com/test-talent/photo-5.svg",
  "https://rr6tqvw6blwsbhmt.private.blob.vercel-storage.com/test-talent/photo-6.svg",
]

async function main() {
  console.log(`BLOB_READ_WRITE_TOKEN: ${process.env.BLOB_READ_WRITE_TOKEN ? "あり" : "なし"}`)
  await del(urls)
  console.log(`Blob ${urls.length} 件を削除しました`)
}

main().catch(console.error)
