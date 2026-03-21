import crypto from "crypto"

export function generateReviewToken(): string {
  return crypto.randomBytes(32).toString("base64url")
}
