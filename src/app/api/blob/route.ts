import { type NextRequest, NextResponse } from "next/server"
import { get } from "@vercel/blob"

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 })
  }

  try {
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
