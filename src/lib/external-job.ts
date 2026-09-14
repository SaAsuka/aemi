import { createHmac, timingSafeEqual } from "node:crypto"
import { prisma } from "@/lib/db"

/**
 * 外部システム（KAMITE）から案件を受け取る口の、入口チェックと記録。
 *
 * 外から叩ける口なので「認証がない前提」で組む：
 *  - Authorization のキー照合（文字数が漏れないよう定数時間で比べる）
 *  - 本文の署名検証（キーが漏れても本文を差し替えられない）
 *  - 時刻の検証（昔のリクエストを録って投げ直す攻撃を防ぐ）
 *  - 1分あたりの件数制限（暴走・総当たりを止める）
 *  - 送信元IPの限定（設定されているときだけ）
 *  - 弾いたものも含めて全部記録する（気づけるようにする）
 */

/** 署名に使う時刻のずれの許容幅（秒）。これより古い・未来のリクエストは受け取らない */
const TIMESTAMP_TOLERANCE_SEC = 5 * 60

/** 1分間に受け付ける最大件数。通常は1日10件前後なので、ここに当たるのは異常のとき */
const RATE_LIMIT_PER_MIN = 20

export type VerifyResult =
  | { ok: true; source: string }
  | { ok: false; result: string; httpStatus: number; message: string }

/** 送信元IPを読む。Vercelは x-forwarded-for の先頭が実IP */
export function clientIp(headers: Headers): string | null {
  const fwd = headers.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0]!.trim()
  return headers.get("x-real-ip")
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}

export function signPayload(secret: string, timestamp: string, rawBody: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex")
}

/**
 * リクエストを受け取ってよいかを判定する。
 * 通ったときだけ本文の中身を見る（中身の検証より先に、送り主の検証を終わらせる）。
 */
export async function verifyExternalRequest(
  headers: Headers,
  rawBody: string
): Promise<VerifyResult> {
  const apiKey = process.env.KAMITE_API_KEY
  const secret = process.env.KAMITE_API_SECRET
  if (!apiKey || !secret) {
    return {
      ok: false,
      result: "ERROR",
      httpStatus: 503,
      message: "受け口の鍵が設定されていません（KAMITE_API_KEY / KAMITE_API_SECRET）",
    }
  }

  // HTTPS以外は受けない。Vercelは常にHTTPSだが、別の場所に置かれたときの保険
  const proto = headers.get("x-forwarded-proto")
  if (proto && proto !== "https") {
    return { ok: false, result: "UNAUTHORIZED", httpStatus: 400, message: "HTTPS以外は受け付けません" }
  }

  // 送信元IPの限定。KAMITEはVercel（外向きIPが固定されない）ので、
  // 固定IPが取れる置き場に移したときだけ KAMITE_ALLOWED_IPS を入れて有効にする
  const allowList = (process.env.KAMITE_ALLOWED_IPS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  const ip = clientIp(headers)
  if (allowList.length > 0 && (!ip || !allowList.includes(ip))) {
    return { ok: false, result: "UNAUTHORIZED", httpStatus: 403, message: "許可されていない送信元です" }
  }

  const auth = headers.get("authorization") ?? ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : ""
  if (!token || !safeEqual(token, apiKey)) {
    return { ok: false, result: "UNAUTHORIZED", httpStatus: 401, message: "APIキーが違います" }
  }

  const timestamp = headers.get("x-kamite-timestamp") ?? ""
  const signature = headers.get("x-kamite-signature") ?? ""
  if (!timestamp || !signature) {
    return { ok: false, result: "BAD_SIGNATURE", httpStatus: 401, message: "署名がありません" }
  }

  const sent = Number(timestamp)
  if (!Number.isFinite(sent)) {
    return { ok: false, result: "STALE", httpStatus: 401, message: "時刻の形式が不正です" }
  }
  const diff = Math.abs(Math.floor(Date.now() / 1000) - sent)
  if (diff > TIMESTAMP_TOLERANCE_SEC) {
    return { ok: false, result: "STALE", httpStatus: 401, message: "古い（または先の）リクエストです" }
  }

  if (!safeEqual(signature, signPayload(secret, timestamp, rawBody))) {
    return { ok: false, result: "BAD_SIGNATURE", httpStatus: 401, message: "署名が一致しません" }
  }

  const source = headers.get("x-kamite-source") || "KAMITE"

  const recent = await prisma.externalJobLog.count({
    where: { source, createdAt: { gte: new Date(Date.now() - 60_000) } },
  })
  if (recent >= RATE_LIMIT_PER_MIN) {
    return { ok: false, result: "RATE_LIMITED", httpStatus: 429, message: "短時間に多すぎます" }
  }

  return { ok: true, source }
}

/** 受け付けた・弾いたリクエストを残す。記録に失敗しても本体の応答は変えない */
export async function logExternalJob(params: {
  source: string
  externalId?: string | null
  ip?: string | null
  result: string
  httpStatus: number
  message?: string | null
}): Promise<void> {
  try {
    await prisma.externalJobLog.create({
      data: {
        source: params.source,
        externalId: params.externalId ?? null,
        ip: params.ip ?? null,
        result: params.result,
        httpStatus: params.httpStatus,
        message: params.message ?? null,
      },
    })
  } catch {
    // 記録できないことを理由に案件の取り込みを止めない
  }
}
