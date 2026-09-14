import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { clientIp, logExternalJob, verifyExternalRequest } from "@/lib/external-job"

/**
 * 外部システム（KAMITE）から案件を受け取って、VOZELの案件として登録する口。
 *
 * できるのは案件の登録・更新だけ（POSTのみ・読み出しも削除もさせない）。
 * 入口の守りは lib/external-job.ts 側に置いてある。
 *
 * 同じ案件が二度送られてきても増やさない：送り元の管理番号（externalId）で突き合わせて上書きする。
 * ただし人が締め切った・取り下げた案件は勝手に復活させない。
 */

export const dynamic = "force-dynamic"

const roleSchema = z.object({
  label: z.string().min(1).max(200),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).nullish(),
  headcount: z.number().int().min(0).max(1000).nullish(),
  ageMin: z.number().int().min(0).max(120).nullish(),
  ageMax: z.number().int().min(0).max(120).nullish(),
  heightCm: z.number().int().min(0).max(300).nullish(),
  heightTolerance: z.number().int().min(0).max(50).nullish(),
  feeYen: z.number().int().min(0).nullish(),
  feeNote: z.string().max(500).nullish(),
  note: z.string().max(1000).nullish(),
})

const dateSchema = z.object({
  type: z.enum(["AUDITION", "SHOOTING", "OTHER"]).default("SHOOTING"),
  date: z.string().min(1),
  startTime: z.string().max(20).nullish(),
  endTime: z.string().max(20).nullish(),
  location: z.string().max(300).nullish(),
  note: z.string().max(500).nullish(),
})

const requirementSchema = z.object({
  label: z.string().min(1).max(200),
  kind: z.enum(["PHOTO", "FILE", "TEXT", "URL"]).default("PHOTO"),
  required: z.boolean().default(true),
  note: z.string().max(1000).nullish(),
})

const payloadSchema = z.object({
  externalId: z.string().min(1).max(100),
  sourceUrl: z.string().url().max(500).nullish(),
  title: z.string().min(1).max(300),
  description: z.string().max(5000).nullish(),
  location: z.string().max(300).nullish(),
  fee: z.number().int().min(0).nullish(),
  deadline: z.string().nullish(),
  capacity: z.number().int().min(0).max(1000).nullish(),
  status: z.enum(["DRAFT", "OPEN", "CLOSED", "CANCELLED"]).default("DRAFT"),
  note: z.string().max(5000).nullish(),
  roles: z.array(roleSchema).max(50).default([]),
  dates: z.array(dateSchema).max(50).default([]),
  requirements: z.array(requirementSchema).max(50).default([]),
})

type Payload = z.infer<typeof payloadSchema>

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * 募集枠と提出物を、そのまま読める文章にしてメモ欄へ入れる。
 * VOZEL側には枠ごとの入れ物が無いので、条件を落とさないよう全部ここに残す。
 */
function buildNote(p: Payload): string | null {
  const blocks: string[] = []

  if (p.roles.length > 0) {
    const lines = p.roles.map((r) => {
      const cond: string[] = []
      if (r.gender) cond.push(r.gender === "MALE" ? "男性" : r.gender === "FEMALE" ? "女性" : "性別不問")
      if (r.ageMin != null || r.ageMax != null) cond.push(`${r.ageMin ?? ""}〜${r.ageMax ?? ""}歳`)
      if (r.heightCm != null) cond.push(`身長${r.heightCm}cm${r.heightTolerance ? `±${r.heightTolerance}` : ""}`)
      if (r.headcount != null) cond.push(`${r.headcount}名`)
      if (r.feeYen != null) cond.push(`出演料${r.feeYen.toLocaleString("ja-JP")}円`)
      if (r.feeNote) cond.push(r.feeNote)
      if (r.note) cond.push(r.note)
      return `・${r.label}${cond.length ? `（${cond.join(" / ")}）` : ""}`
    })
    blocks.push(`【募集枠】\n${lines.join("\n")}`)
  }

  if (p.requirements.length > 0) {
    const lines = p.requirements.map(
      (r) => `・${r.label}${r.required ? "" : "（任意）"}${r.note ? ` — ${r.note}` : ""}`
    )
    blocks.push(`【提出物】\n${lines.join("\n")}`)
  }

  if (p.note) blocks.push(p.note)
  if (p.sourceUrl) blocks.push(`元の案件: ${p.sourceUrl}`)

  return blocks.length > 0 ? blocks.join("\n\n") : null
}

/** 枠が1つだけのときは、その条件をそのまま案件の条件として持たせる（絞り込みに効かせるため） */
function jobLevelConditions(p: Payload) {
  const single = p.roles.length === 1 ? p.roles[0]! : null
  const totalHeadcount = p.roles.reduce((sum, r) => sum + (r.headcount ?? 0), 0)
  const maxFee = p.roles.reduce<number | null>(
    (max, r) => (r.feeYen != null && (max == null || r.feeYen > max) ? r.feeYen : max),
    null
  )
  const height = single?.heightCm ?? null
  const tol = single?.heightTolerance ?? 0

  return {
    genderReq: single?.gender ?? null,
    ageMin: single?.ageMin ?? null,
    ageMax: single?.ageMax ?? null,
    heightMin: height != null ? height - tol : null,
    heightMax: height != null ? height + tol : null,
    capacity: p.capacity ?? (totalHeadcount > 0 ? totalHeadcount : null),
    fee: p.fee ?? maxFee,
  }
}

export async function POST(request: Request) {
  const ip = clientIp(request.headers)
  const rawBody = await request.text()

  const verified = await verifyExternalRequest(request.headers, rawBody)
  if (!verified.ok) {
    await logExternalJob({
      source: request.headers.get("x-kamite-source") || "KAMITE",
      ip,
      result: verified.result,
      httpStatus: verified.httpStatus,
      message: verified.message,
    })
    return NextResponse.json({ error: verified.message }, { status: verified.httpStatus })
  }
  const source = verified.source

  let payload: Payload
  try {
    payload = payloadSchema.parse(JSON.parse(rawBody))
  } catch (e) {
    const message = e instanceof Error ? e.message.slice(0, 500) : "解釈できない本文です"
    await logExternalJob({ source, ip, result: "INVALID", httpStatus: 400, message })
    return NextResponse.json({ error: "本文が不正です", detail: message }, { status: 400 })
  }

  try {
    // 送り元ごとに1社ぶんの取引先を用意して、その下に案件をぶら下げる
    const client =
      (await prisma.client.findFirst({ where: { companyName: source } })) ??
      (await prisma.client.create({
        data: { companyName: source, note: "外部システムからの自動登録" },
      }))

    const existing = await prisma.job.findUnique({
      where: { externalSource_externalId: { externalSource: source, externalId: payload.externalId } },
      select: { id: true, status: true },
    })

    const cond = jobLevelConditions(payload)
    const data = {
      clientId: client.id,
      title: payload.title,
      description: payload.description ?? null,
      location: payload.location ?? null,
      deadline: parseDate(payload.deadline),
      note: buildNote(payload),
      sourceUrl: payload.sourceUrl ?? null,
      ...cond,
    }

    let jobId: string
    let result: "OK_CREATED" | "OK_UPDATED"

    if (existing) {
      // 人が締め切った・取り下げた案件は勝手に募集中へ戻さない
      const keepStatus = existing.status === "CLOSED" || existing.status === "CANCELLED"
      await prisma.job.update({
        where: { id: existing.id },
        data: { ...data, ...(keepStatus ? {} : { status: payload.status }) },
      })
      await prisma.jobDate.deleteMany({ where: { jobId: existing.id } })
      jobId = existing.id
      result = "OK_UPDATED"
    } else {
      const created = await prisma.job.create({
        data: {
          ...data,
          status: payload.status,
          externalSource: source,
          externalId: payload.externalId,
        },
        select: { id: true },
      })
      jobId = created.id
      result = "OK_CREATED"
    }

    if (payload.dates.length > 0) {
      const rows = payload.dates
        .map((d) => ({ ...d, parsed: parseDate(d.date) }))
        .filter((d) => d.parsed !== null)
        .map((d) => ({
          jobId,
          type: d.type,
          date: d.parsed!,
          startTime: d.startTime ?? null,
          endTime: d.endTime ?? null,
          location: d.location ?? null,
          note: d.note ?? null,
        }))
      if (rows.length > 0) await prisma.jobDate.createMany({ data: rows })
    }

    await logExternalJob({
      source,
      externalId: payload.externalId,
      ip,
      result,
      httpStatus: 200,
      message: payload.title.slice(0, 200),
    })

    return NextResponse.json({ ok: true, jobId, created: result === "OK_CREATED" })
  } catch (e) {
    const message = e instanceof Error ? e.message.slice(0, 500) : "登録に失敗しました"
    await logExternalJob({
      source,
      externalId: payload.externalId,
      ip,
      result: "ERROR",
      httpStatus: 500,
      message,
    })
    return NextResponse.json({ error: "登録に失敗しました" }, { status: 500 })
  }
}
