import { NextResponse } from "next/server"
import { uploadToStorage, generateStoragePath } from "@/lib/supabase-storage"

const ALLOWED_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "audio/mpeg",
  "audio/wav",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
]

const EXT_TYPE_MAP: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  gif: "image/gif",
  pdf: "application/pdf",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mp3: "audio/mpeg",
  wav: "audio/wav",
}

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

    // iOSのHEIC等でfile.typeが空になる場合、ファイル名の拡張子から補完する
    const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
    const contentType = file.type || EXT_TYPE_MAP[ext] || "application/octet-stream"

    if (!ALLOWED_TYPES.includes(contentType)) {
      console.warn("[UPLOAD] rejected:", { name: file.name, type: file.type, resolvedType: contentType })
      return NextResponse.json({ error: "このファイル形式はアップロードできません" }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "ファイルサイズが100MBを超えています" }, { status: 400 })
    }

    const validCategories = ["photos", "works", "applications", "pdfs"]
    const cat = validCategories.includes(category) ? category as "photos" | "works" | "applications" | "pdfs" : "photos"

    const buffer = Buffer.from(await file.arrayBuffer())
    const path = generateStoragePath(cat, file.name, id ?? undefined)
    const url = await uploadToStorage(buffer, path, contentType)

    return NextResponse.json({ url })
  } catch (error) {
    console.error("[UPLOAD] error:", error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "アップロードに失敗しました" },
      { status: 500 },
    )
  }
}
