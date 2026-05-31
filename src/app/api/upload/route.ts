import { NextResponse } from "next/server"
import { uploadToStorage, generateStoragePath } from "@/lib/supabase-storage"

const ALLOWED_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "audio/mpeg",
  "audio/wav",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]

const MAX_SIZE = 100 * 1024 * 1024 // 100MB

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const category = (formData.get("category") as string | null) ?? "photos"
    const id = formData.get("id") as string | null

    if (!file) {
      return NextResponse.json({ error: "ファイルが指定されていません" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "このファイル形式はアップロードできません" }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "ファイルサイズが100MBを超えています" }, { status: 400 })
    }

    const validCategories = ["photos", "works", "applications", "pdfs"]
    const cat = validCategories.includes(category) ? category as "photos" | "works" | "applications" | "pdfs" : "photos"

    const buffer = Buffer.from(await file.arrayBuffer())
    const path = generateStoragePath(cat, file.name, id ?? undefined)
    const url = await uploadToStorage(buffer, path, file.type)

    return NextResponse.json({ url })
  } catch (error) {
    console.error("[UPLOAD]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "アップロードに失敗しました" },
      { status: 500 },
    )
  }
}
