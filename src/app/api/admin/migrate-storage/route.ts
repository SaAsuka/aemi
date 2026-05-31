import { NextRequest, NextResponse } from "next/server"
import { get } from "@vercel/blob"
import { uploadToStorage, isSupabaseStorageUrl, generateStoragePath } from "@/lib/supabase-storage"
import { prisma } from "@/lib/db"
import { getSession } from "@/lib/auth"

async function downloadVercelBlob(url: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const result = await get(url, { access: "private" })
    if (!result || result.statusCode !== 200) return null
    const chunks: Uint8Array[] = []
    const reader = result.stream.getReader()
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }
    return { buffer: Buffer.concat(chunks), contentType: result.blob.contentType }
  } catch {
    return null
  }
}

function detectCategory(url: string): "photos" | "works" | "applications" | "pdfs" {
  if (url.includes(".pdf")) return "pdfs"
  if (url.includes("application")) return "applications"
  if (url.includes("work")) return "works"
  return "photos"
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (session.role !== "admin") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 })
  }

  const dryRun = req.nextUrl.searchParams.get("dry") === "true"

  const [photos, works, submissions, talents] = await Promise.all([
    prisma.talentPhoto.findMany({ select: { id: true, url: true, talentId: true } }),
    prisma.talentWork.findMany({ select: { id: true, imageUrl: true, talentId: true } }),
    prisma.applicationSubmission.findMany({ select: { id: true, fileUrl: true } }),
    prisma.talent.findMany({ select: { id: true, resume: true, profileImage: true } }),
  ])

  const tasks: { type: string; id: string; url: string; field: string; talentId?: string }[] = []

  for (const p of photos) {
    if (p.url.includes("blob.vercel-storage.com")) tasks.push({ type: "photo", id: p.id, url: p.url, field: "url", talentId: p.talentId })
  }
  for (const w of works) {
    if (w.imageUrl.includes("blob.vercel-storage.com")) tasks.push({ type: "work", id: w.id, url: w.imageUrl, field: "imageUrl", talentId: w.talentId })
  }
  for (const s of submissions) {
    if (s.fileUrl?.includes("blob.vercel-storage.com")) tasks.push({ type: "submission", id: s.id, url: s.fileUrl, field: "fileUrl" })
  }
  for (const t of talents) {
    if (t.resume?.includes("blob.vercel-storage.com")) tasks.push({ type: "resume", id: t.id, url: t.resume, field: "resume" })
    if (t.profileImage?.includes("blob.vercel-storage.com")) tasks.push({ type: "profileImage", id: t.id, url: t.profileImage, field: "profileImage" })
  }

  if (dryRun) {
    return NextResponse.json({ total: tasks.length, tasks: tasks.map((t) => ({ type: t.type, url: t.url })) })
  }

  let migrated = 0
  let failed = 0
  const errors: string[] = []

  for (const task of tasks) {
    if (isSupabaseStorageUrl(task.url)) { migrated++; continue }

    const downloaded = await downloadVercelBlob(task.url)
    if (!downloaded) {
      failed++
      errors.push(`DL失敗: ${task.url}`)
      continue
    }

    try {
      const filename = task.url.split("/").pop() ?? "file"
      const cat = detectCategory(task.url)
      const path = generateStoragePath(cat, filename, task.talentId ?? task.id)
      const newUrl = await uploadToStorage(downloaded.buffer, path, downloaded.contentType)

      switch (task.type) {
        case "photo":
          await prisma.talentPhoto.update({ where: { id: task.id }, data: { url: newUrl } })
          break
        case "work":
          await prisma.talentWork.update({ where: { id: task.id }, data: { imageUrl: newUrl } })
          break
        case "submission":
          await prisma.applicationSubmission.update({ where: { id: task.id }, data: { fileUrl: newUrl } })
          break
        case "resume":
          await prisma.talent.update({ where: { id: task.id }, data: { resume: newUrl } })
          break
        case "profileImage":
          await prisma.talent.update({ where: { id: task.id }, data: { profileImage: newUrl } })
          break
      }
      migrated++
    } catch (e) {
      failed++
      errors.push(`移行失敗: ${task.url} - ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return NextResponse.json({ total: tasks.length, migrated, failed, errors })
}
