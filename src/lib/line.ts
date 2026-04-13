const LINE_API = "https://api.line.me/v2/bot/message/push"
const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN

export async function sendLinePush(userId: string, text: string) {
  if (!TOKEN) {
    console.warn("[LINE] LINE_CHANNEL_ACCESS_TOKEN未設定")
    return false
  }

  const res = await fetch(LINE_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({
      to: userId,
      messages: [{ type: "text", text }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error(`[LINE] 送信失敗 userId=${userId}`, res.status, err)
    return false
  }
  return true
}
