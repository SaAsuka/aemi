import { formatShortDeadline } from "@/lib/utils/date"

const LINE_API = "https://api.line.me/v2/bot/message/push"
const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://app.vozel.jp"

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

type Schedule = {
  date: Date
  startTime: string | null
  endTime: string | null
  location: string | null
}

export function buildStatusMessage(
  status: string,
  jobTitle: string,
  jobId: string,
  schedule?: Schedule | null,
): string {
  const jobUrl = `${BASE_URL}/jobs/${jobId}`

  switch (status) {
    case "RESUME_SENT":
      return [
        "📄 書類を送付しました",
        "",
        `■ ${jobTitle}`,
        "",
        "クライアントへ書類を送付しました。結果が出ましたらお知らせします。",
        "",
        `案件詳細: ${jobUrl}`,
      ].join("\n")

    case "ACCEPTED": {
      const lines = [
        "🎉 合格おめでとうございます！",
        "",
        `■ ${jobTitle}`,
      ]
      if (schedule) {
        const date = new Date(schedule.date).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })
        lines.push("")
        lines.push(`日程: ${date}${schedule.startTime ? ` ${schedule.startTime}` : ""}${schedule.endTime ? `〜${schedule.endTime}` : ""}`)
        if (schedule.location) lines.push(`場所: ${schedule.location}`)
      }
      lines.push("", `案件詳細: ${jobUrl}`)
      return lines.join("\n")
    }

    case "REJECTED":
      return [
        `■ ${jobTitle}`,
        "",
        "選考の結果、今回は見送りとなりました。",
        "またの機会にぜひご応募ください。",
        "",
        `他の案件を探す: ${BASE_URL}/jobs`,
      ].join("\n")

    default:
      return `■ ${jobTitle}\nステータスが更新されました\n\n案件詳細: ${jobUrl}`
  }
}

export function buildDeadlineReminderMessage(jobTitle: string, jobId: string, deadlineDate: Date): string {
  const deadline = formatShortDeadline(deadlineDate)
  const jobUrl = `${BASE_URL}/jobs/${jobId}`

  return [
    `⏰ 応募締切が近づいています`,
    "",
    `■ ${jobTitle}`,
    `締切: ${deadline}`,
    "",
    `詳細・応募はこちら`,
    jobUrl,
  ].join("\n")
}
