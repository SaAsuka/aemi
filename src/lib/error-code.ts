// 受付番号（例: E-7K2X9Q）。サーバーとブラウザの両方で使う。
// 電話やLINEで読み上げても取り違えないよう、0/O と 1/I は使わない
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"

export function makeErrorCode(): string {
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  return "E-" + Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("")
}

export function isErrorCode(value: unknown): value is string {
  return typeof value === "string" && /^E-[2-9A-HJ-NP-Z]{6}$/.test(value)
}
