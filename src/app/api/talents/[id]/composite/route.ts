import { NextResponse } from "next/server"
import { renderToBuffer, Font } from "@react-pdf/renderer"
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
    return NextResponse.json({ errors: [`DB接続エラー: ${e instanceof Error ? e.message : String(e)}`] }, { status: 500 })
  }

  if (!talent) {
    return NextResponse.json({ errors: ["タレントが見つかりません"] }, { status: 404 })
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(React.createElement(CompositePDF, { talent }) as any)

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${encodeURIComponent(talent.name)}_composite.pdf"`,
      },
    })
  } catch (e) {
    const errors = [`PDF生成エラー: ${e instanceof Error ? e.message : String(e)}`]
    if (e instanceof Error && e.stack) {
      errors.push(`スタック: ${e.stack.split("\n").slice(0, 3).join(" | ")}`)
    }
    return NextResponse.json({ errors }, { status: 500 })
  }
}
