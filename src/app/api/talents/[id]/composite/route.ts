import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { renderToBuffer, Font } from "@react-pdf/renderer"
import { put, get, del } from "@vercel/blob"
import sharp from "sharp"
import { prisma } from "@/lib/db"
import { CompositePDF } from "@/lib/pdf/composite-pdf"
import React from "react"

Font.register({
  family: "NotoSansJP",
  fonts: [
    { src: "https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/SubsetOTF/JP/NotoSansJP-Regular.otf", fontWeight: 400 },
    { src: "https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/SubsetOTF/JP/NotoSansJP-Bold.otf", fontWeight: 700 },
  ],
})
Font.registerHyphenationCallback(word => [word])

export const maxDuration = 60

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const force = new URL(req.url).searchParams.get("force") === "true"
  const t0 = Date.now()
  let stage = "INIT"

  console.log(`[COMPOSITE] START id=${id}`)

  let talent
  try {
    stage = "DB"
    talent = await prisma.talent.findUnique({
      where: { id },
      include: {
        photos: { orderBy: { sortOrder: "asc" } },
        works: { orderBy: { sortOrder: "asc" } },
        socialLinks: true,
      },
    })
    console.log(`[COMPOSITE] DB_DONE +${Date.now() - t0}ms photos=${talent?.photos?.length ?? 0} works=${talent?.works?.length ?? 0}`)
  } catch (e) {
    console.error(`[COMPOSITE] ERROR stage=${stage} +${Date.now() - t0}ms error=${e instanceof Error ? e.message : String(e)}`)
    return NextResponse.json({ errors: [`DB接続エラー: ${e instanceof Error ? e.message : String(e)}`, `stage=${stage}`] }, { status: 500 })
  }

  if (!talent) {
    return NextResponse.json({ errors: ["タレントが見つかりません"] }, { status: 404 })
  }

  if (talent.resumeSource === "manual" && !force) {
    return NextResponse.json({ errors: ["手動アップロードされたPDFがあります。上書きするには force=true を指定してください。"] }, { status: 409 })
  }

  const photoCount = talent.photos.length
  if (photoCount < 6) {
    return NextResponse.json({ errors: [`宣材写真が${photoCount}枚しか登録されていません。コンポジ生成には6枚以上必要です。`] }, { status: 400 })
  }

  talent.photos = talent.photos.slice(0, 6)

  async function toDataUri(url: string): Promise<string> {
    try {
      let buf: Buffer
      if (url.includes("blob.vercel-storage.com")) {
        const result = await get(url, { access: "private" })
        if (!result || result.statusCode !== 200) return url
        const chunks: Uint8Array[] = []
        const reader = result.stream!.getReader()
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          chunks.push(value)
        }
        buf = Buffer.concat(chunks)
      } else {
        const res = await fetch(url)
        if (!res.ok) return url
        buf = Buffer.from(await res.arrayBuffer())
      }
      const compressed = await sharp(buf)
        .resize(1200, 1600, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer()
      return `data:image/jpeg;base64,${compressed.toString("base64")}`
    } catch {
      console.error(`[COMPOSITE] toDataUri failed: ${url}`)
      return url
    }
  }

  for (const photo of talent.photos) {
    photo.url = await toDataUri(photo.url)
  }
  for (const work of talent.works) {
    work.imageUrl = await toDataUri(work.imageUrl)
  }
  if (talent.profileImage) {
    talent.profileImage = await toDataUri(talent.profileImage)
  }

  try {
    stage = "RENDER"
    console.log(`[COMPOSITE] RENDER_START +${Date.now() - t0}ms (フォントDL含む)`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(React.createElement(CompositePDF, { talent }) as any)
    console.log(`[COMPOSITE] RENDER_DONE +${Date.now() - t0}ms size=${buffer.byteLength} bytes`)

    const now = new Date()
    const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`
    const displayName = talent.stageName || talent.name
    const fileName = `【${displayName}】タレントプロフィール${yyyymm}`

    let blobUrl: string | undefined
    let blobError: string | undefined
    try {
      stage = "BLOB_UPLOAD"
      if (talent.resume) {
        try { await del(talent.resume) } catch {}
      }
      const blob = await put(`${fileName}.pdf`, Buffer.from(buffer), {
        access: "private",
        contentType: "application/pdf",
        addRandomSuffix: false,
      })
      blobUrl = blob.url
      console.log(`[COMPOSITE] BLOB_DONE +${Date.now() - t0}ms url=${blobUrl}`)

      await prisma.talent.update({ where: { id }, data: { resume: blobUrl, resumeSource: "auto" } })
      revalidatePath("/admin/talents")
      revalidatePath(`/admin/talents/${id}`)
      console.log(`[COMPOSITE] DB_SAVE_DONE +${Date.now() - t0}ms`)
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e)
      console.warn(`[COMPOSITE] BLOB_UPLOAD失敗: ${errMsg}`)
      blobError = errMsg
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${encodeURIComponent(fileName)}.pdf"`,
        "X-Composite-Time": `${Date.now() - t0}ms`,
        "X-Composite-Size": `${buffer.byteLength}`,
        ...(blobUrl ? { "X-Blob-Url": blobUrl } : {}),
        ...(blobError ? { "X-Blob-Error": blobError } : {}),
      },
    })
  } catch (e) {
    console.error(`[COMPOSITE] ERROR stage=${stage} +${Date.now() - t0}ms error=${e instanceof Error ? e.message : String(e)}`)
    const errors = [`PDF生成エラー (stage=${stage}, +${Date.now() - t0}ms): ${e instanceof Error ? e.message : String(e)}`]
    if (e instanceof Error && e.stack) {
      errors.push(`スタック: ${e.stack.split("\n").slice(0, 3).join(" | ")}`)
    }
    return NextResponse.json({ errors }, { status: 500 })
  }
}
