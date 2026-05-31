const WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL

export async function sendSlackNotification(text: string): Promise<void> {
  if (!WEBHOOK_URL) {
    console.warn("[Slack] SLACK_WEBHOOK_URL未設定")
    return
  }

  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  })

  if (!res.ok) {
    console.error(`[Slack] 送信失敗: ${res.status}`)
  }
}

export function buildApplicationNotification(talentName: string, jobTitle: string): string {
  return `📋 新規応募がありました\n\n*タレント:* ${talentName}\n*案件:* ${jobTitle}`
}
