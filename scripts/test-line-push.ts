import "dotenv/config"

const LINE_API = "https://api.line.me/v2/bot/message/push"
const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN

const userId = process.argv[2]
if (!userId) {
  console.error("使い方: npx tsx scripts/test-line-push.ts <LINE_USER_ID>")
  process.exit(1)
}

const body = {
  to: userId,
  messages: [
    {
      type: "text",
      text: `【テスト通知】\nVOZELからのLINE通知テストです。\nこのメッセージが届いていれば成功です。`,
    },
  ],
}

async function main() {
  const res = await fetch(LINE_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify(body),
  })

  if (res.ok) {
    console.log("送信成功!")
  } else {
    const err = await res.json()
    console.error("送信失敗:", res.status, err)
  }
}

main()
