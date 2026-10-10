import { type NextRequest, NextResponse } from "next/server"
import { get } from "@vercel/blob"
import { isSupabaseStorageUrl, extractStoragePath, getSignedUrl } from "@/lib/supabase-storage"
import { getSession } from "@/lib/auth"

function storagePathOf(url: string): string | null {
  if (isSupabaseStorageUrl(url)) return extractStoragePath(url)
  try {
    const u = new URL(url)
    if (u.hostname.endsWith("blob.vercel-storage.com")) return decodeURIComponent(u.pathname.replace(/^\//, ""))
  } catch {
    // URLとして読めないものは下の処理に任せる
  }
  return null
}

// 応募の提出物（applications/）だけは、管理者と本人以外に見せない。
// 新しい提出物は applications/{talentId}/... に置く。それ以前の applications/{時刻}-... は管理者だけ
async function canReadApplicationFile(path: string): Promise<boolean> {
  const session = await getSession()
  if (session.role === "admin") return true
  const ownerId = path.split("/")[1]
  return session.role === "talent" && !!session.talentId && session.talentId === ownerId
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")
  const sign = request.nextUrl.searchParams.get("sign") === "true"
  const download = request.nextUrl.searchParams.get("download") === "true"
  const filename = request.nextUrl.searchParams.get("filename") ?? "download.pdf"

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 })
  }

  const storagePath = storagePathOf(url)
  if (storagePath?.includes("..")) {
    return NextResponse.json({ error: "invalid_path" }, { status: 400 })
  }
  if (storagePath?.startsWith("applications/") && !(await canReadApplicationFile(storagePath))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  try {
    // Supabase Storage
    if (isSupabaseStorageUrl(url)) {
      const path = extractStoragePath(url)
      const downloadName = download ? decodeURIComponent(filename) : undefined
      const signedUrl = await getSignedUrl(path, 60 * 60 * 24 * 7, downloadName)
      // sign=true のときは署名付きURLをJSONで返す
      if (sign) return NextResponse.json({ url: signedUrl })
      // 画像等はコンテンツを直接プロキシ（リダイレクトだとブラウザが追えない場合がある）
      const upstream = await fetch(signedUrl)
      if (!upstream.ok) {
        console.error(`[BLOB_PROXY] Supabase fetch failed: ${upstream.status} ${path}`)
        const status = upstream.status === 404 ? 404 : 502
        return NextResponse.json({ error: status === 404 ? "not_found" : "upstream_error" }, { status })
      }
      const contentType = upstream.headers.get("content-type") ?? "application/octet-stream"
      const disposition = download
        ? `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`
        : "inline"
      return new NextResponse(upstream.body, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": disposition,
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
      return NextResponse.json({ error: "not_found" }, { status: 404 })
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
    const blobFilename = decodeURIComponent(pathname.split("/").pop() ?? "download")

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": result.blob.contentType,
        "Content-Length": String(buffer.length),
        "Content-Disposition": download
          ? `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`
          : `inline; filename*=UTF-8''${encodeURIComponent(blobFilename)}`,
        "X-Content-Type-Options": "nosniff",
        ETag: result.blob.etag,
        "Cache-Control": "private, max-age=3600, must-revalidate",
      },
    })
  } catch (e) {
    console.error(`[BLOB_PROXY] error: ${url}`, e instanceof Error ? e.message : e)
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
