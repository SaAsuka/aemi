import { createHmac, randomBytes, timingSafeEqual } from "crypto"

// LINE連携のstate。Cookieが読めない戻り方（ドメイン違い・アプリ内ブラウザから
// LINEアプリ経由でSafariに戻る等）でも本人を特定できるよう、talentIdを署名付きで埋め込む。
// lineUserIdは通知の宛先にしか使わずログインには使わないため、短い有効期限で十分安全。
export const LINE_STATE_TTL_MS = 3 * 60 * 1000

type Payload = { t: string; r: string; e: number; n: string }

function sign(body: string, secret: string): string {
  return createHmac("sha256", secret).update(`line-state:${body}`).digest("base64url")
}

function safeReturnTo(returnTo: string): string {
  return returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : ""
}

export function createLineState(talentId: string, returnTo: string, secret: string, now = Date.now()): string {
  const payload: Payload = {
    t: talentId,
    r: safeReturnTo(returnTo),
    e: now + LINE_STATE_TTL_MS,
    n: randomBytes(8).toString("hex"),
  }
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url")
  return `${body}.${sign(body, secret)}`
}

export function verifyLineState(
  state: string,
  secret: string,
  now = Date.now(),
): { talentId: string; returnTo: string } | null {
  const [body, signature, ...rest] = state.split(".")
  if (!body || !signature || rest.length > 0) return null

  const expected = Buffer.from(sign(body, secret))
  const actual = Buffer.from(signature)
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null

  let payload: Payload
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"))
  } catch {
    return null
  }
  if (typeof payload.t !== "string" || !payload.t || typeof payload.e !== "number") return null
  if (payload.e < now) return null

  return { talentId: payload.t, returnTo: safeReturnTo(typeof payload.r === "string" ? payload.r : "") }
}
