import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { renderToBuffer, Font } from "@react-pdf/renderer"
import { put, get } from "@vercel/blob"
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
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

  async function toDataUri(url: string): Promise<string> {
    try {
      const result = await get(url, { access: "private" })
      if (!result || result.statusCode !== 200) return url
      const chunks: Uint8Array[] = []
      const reader = result.stream!.getReader()
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
      }
      const buf = Buffer.concat(chunks)
      return `data:${result.blob.contentType};base64,${buf.toString("base64")}`
    } catch {
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

    let blobUrl: string | undefined
    let blobError: string | undefined
    try {
      stage = "BLOB_UPLOAD"
      const blob = await put(`${id}_composite.pdf`, Buffer.from(buffer), {
        access: "private",
        contentType: "application/pdf",
      })
      blobUrl = blob.url
      console.log(`[COMPOSITE] BLOB_DONE +${Date.now() - t0}ms url=${blobUrl}`)

      await prisma.talent.update({ where: { id }, data: { resume: blobUrl } })
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
        "Content-Disposition": `inline; filename="${encodeURIComponent(talent.name)}_composite.pdf"`,
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
