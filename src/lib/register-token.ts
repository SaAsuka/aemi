import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto"

const ALGORITHM = "aes-256-gcm"

function getKey() {
  return createHash("sha256").update(process.env.SESSION_SECRET!).digest()
}

export function encryptPriceId(priceId: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(priceId, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString("base64url")
}

export function decryptPriceId(token: string): string | null {
  try {
    const buf = Buffer.from(token, "base64url")
    const iv = buf.subarray(0, 12)
    const tag = buf.subarray(12, 28)
    const encrypted = buf.subarray(28)
    const decipher = createDecipheriv(ALGORITHM, getKey(), iv)
    decipher.setAuthTag(tag)
    return decipher.update(encrypted).toString("utf8") + decipher.final("utf8")
  } catch {
    return null
  }
}
