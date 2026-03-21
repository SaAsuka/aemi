import { NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { put } from "@vercel/blob"
import { prisma } from "@/lib/db"
import { CompositePDF } from "@/lib/pdf/composite-pdf"
import React from "react"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const talent = await prisma.talent.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
      works: { orderBy: { sortOrder: "asc" } },
    },
  })

  if (!talent) {
    return NextResponse.json({ error: "タレントが見つかりません" }, { status: 404 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(React.createElement(CompositePDF, { talent }) as any)

  const fileName = `composites/${talent.id}/${Date.now()}.pdf`
  const blob = await put(fileName, buffer, { access: "public", contentType: "application/pdf" })

  await prisma.talent.update({
    where: { id },
    data: { resume: blob.url },
  })

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${encodeURIComponent(talent.name)}_composite.pdf"`,
    },
  })
}
