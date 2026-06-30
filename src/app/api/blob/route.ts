import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getIronSession } from "iron-session"
import { get } from "@vercel/blob"
import { isSupabaseStorageUrl, extractStoragePath, getSignedUrl } from "@/lib/supabase-storage"
import { sessionOptions, type SessionData } from "@/lib/session"

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
    return !!(session.role === "admin" || session.role === "agency_admin" || session.talentId)
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  if (!await isAuthenticated(request)) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const url = request.nextUrl.searchParams.get("url")
  const sign = request.nextUrl.searchParams.get("sign") === "true"

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 })
  }

  try {
    // Supabase Storage
    if (isSupabaseStorageUrl(url)) {
      const path = extractStoragePath(url)
      const signedUrl = await getSignedUrl(path, 60 * 60 * 24 * 7)
      // sign=true のときは署名付きURLをJSONで返す
      if (sign) return NextResponse.json({ url: signedUrl })
      // 画像等はコンテンツを直接プロキシ（リダイレクトだとブラウザが追えない場合がある）
      const upstream = await fetch(signedUrl)
      if (!upstream.ok) {
        console.error(`[BLOB_PROXY] Supabase fetch failed: ${upstream.status} ${path}`)
        return new NextResponse("Not found", { status: 404 })
      }
      const contentType = upstream.headers.get("content-type") ?? "application/octet-stream"
      return new NextResponse(upstream.body, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "private, max-age=3600",
        },
      })
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
