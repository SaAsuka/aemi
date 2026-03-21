import { NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { put } from "@vercel/blob"
import { prisma } from "@/lib/db"
import { CompositePDF } from "@/lib/pdf/composite-pdf"
import React from "react"

export const maxDuration = 60

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const errors: string[] = []

  let talent
  try {
    talent = await prisma.talent.findUnique({
      where: { id },
      include: {
        photos: { orderBy: { sortOrder: "asc" } },
        works: { orderBy: { sortOrder: "asc" } },
      },
    })
  } catch (e) {
    errors.push(`DB接続エラー: ${e instanceof Error ? e.message : String(e)}`)
    return NextResponse.json({ errors }, { status: 500 })
  }

  if (!talent) {
    return NextResponse.json({ errors: ["タレントが見つかりません"] }, { status: 404 })
  }

  let buffer: Buffer
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    buffer = await renderToBuffer(React.createElement(CompositePDF, { talent }) as any)
  } catch (e) {
    errors.push(`PDF描画エラー: ${e instanceof Error ? e.message : String(e)}`)
    if (e instanceof Error && e.stack) {
      errors.push(`スタック: ${e.stack.split("\n").slice(0, 3).join(" | ")}`)
    }
    return NextResponse.json({ errors }, { status: 500 })
  }

  try {
    const fileName = `composites/${talent.id}/${Date.now()}.pdf`
    const blob = await put(fileName, buffer, { access: "public", contentType: "application/pdf" })

    await prisma.talent.update({
      where: { id },
      data: { resume: blob.url },
    })
  } catch (e) {
    errors.push(`Blob保存/DB更新エラー: ${e instanceof Error ? e.message : String(e)}`)
    return NextResponse.json({ errors }, { status: 500 })
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${encodeURIComponent(talent.name)}_composite.pdf"`,
    },
  })
}
