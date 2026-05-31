import { type NextRequest, NextResponse } from "next/server"
import { get } from "@vercel/blob"
import { isSupabaseStorageUrl, extractStoragePath, getSignedUrl } from "@/lib/supabase-storage"

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")
  const sign = request.nextUrl.searchParams.get("sign") === "true"

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 })
  }

  try {
    // Supabase Storage
    if (isSupabaseStorageUrl(url)) {
      const path = extractStoragePath(url)
      // sign=true のときは署名付きURLをJSONで返す（7日間有効）
      const signedUrl = await getSignedUrl(path, sign ? 60 * 60 * 24 * 7 : 3600)
      if (sign) return NextResponse.json({ url: signedUrl })
      return NextResponse.redirect(signedUrl)
    }

    // Vercel Blob（既存ファイルの後方互換）
    const result = await get(url, {
      access: "private",
      ifNoneMatch: request.headers.get("if-none-match") ?? undefined,
    })

    if (!result) {
      console.error(`[BLOB_PROXY] not found: ${url}`)
      return new NextResponse("Not found", { status: 404 })
    }

    if (result.statusCode === 304) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: result.blob.etag,
          "Cache-Control": "private, max-age=3600, must-revalidate",
        },
      })
    }

    const reader = result.stream.getReader()
    const chunks: Uint8Array[] = []
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }
    const buffer = Buffer.concat(chunks)

    const pathname = result.blob.pathname
    const filename = decodeURIComponent(pathname.split("/").pop() ?? "download")

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": result.blob.contentType,
        "Content-Length": String(buffer.length),
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "X-Content-Type-Options": "nosniff",
        ETag: result.blob.etag,
        "Cache-Control": "private, max-age=3600, must-revalidate",
      },
    })
  } catch (e) {
    console.error(`[BLOB_PROXY] error: ${url}`, e instanceof Error ? e.message : e)
    return new NextResponse("Not found", { status: 404 })
  }
}
