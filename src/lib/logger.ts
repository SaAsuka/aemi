import { Axiom } from "@axiomhq/js"

type LogFields = Record<string, unknown>
type Level = "info" | "warn" | "error"

function getClient(): { axiom: Axiom; dataset: string } | null {
  const token = process.env.AXIOM_TOKEN
  const dataset = process.env.AXIOM_DATASET
  if (!token || !dataset) return null
  return { axiom: new Axiom({ token }), dataset }
}

// AXIOM_TOKEN/AXIOM_DATASET が未設定の間はconsoleへフォールバックする。
// 環境変数を追加するだけで、コード変更なしにAxiom送信へ切り替わる。
async function send(level: Level, event: string, fields: LogFields = {}) {
  const client = getClient()

  if (!client) {
    const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log
    fn(`[${event}]`, fields)
    return
  }

  try {
    client.axiom.ingest(client.dataset, [
      { _time: new Date().toISOString(), level, event, ...fields },
    ])
    // Vercelのサーバーレス関数は応答後すぐに終了しうるため、
    // 送信を確実にするためここでflushする
    await client.axiom.flush()
  } catch (e) {
    console.error("[logger] Axiomへの送信に失敗しました:", e)
  }
}

export const logger = {
  info: (event: string, fields?: LogFields) => send("info", event, fields),
  warn: (event: string, fields?: LogFields) => send("warn", event, fields),
  error: (event: string, fields?: LogFields) => send("error", event, fields),
}
