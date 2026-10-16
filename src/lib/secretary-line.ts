// 齊藤さん専用の通知LINE「秘書」（Xedge の公式アカウント @979gkmuw）へ1通送る。2026-10-16 追加。
// 文面は「LINEを丸ごとコピー → 書いてあるフォルダで Claude を起動して貼れば対応が始まる」形にそろえる（composeSecretary）。
// 鍵が無い環境（手元・テスト環境）では何もしない。失敗しても呼び出し元は止めない。個人情報は入れない。

/** この画面のプロジェクトのフォルダ（「Claudeに貼る」の起動場所） */
export const SECRETARY_FOLDER = "~/develop/aemi";

export function composeSecretary(title: string, body: string, ask: string): string {
  return [title, body, `▼ Claudeに貼る（cd ${SECRETARY_FOLDER}）\n${ask}`].filter(Boolean).join("\n\n");
}

export async function notifySecretary(text: string): Promise<void> {
  const token = process.env.LINE_SECRETARY_TOKEN?.trim();
  const to = process.env.LINE_SECRETARY_TO?.trim();
  if (!token || !to) return;
  try {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ to, messages: [{ type: "text", text: text.slice(0, 4900) }] }),
    });
    if (!res.ok) console.error("秘書LINEへの通知に失敗", res.status);
  } catch (e) {
    console.error("秘書LINEへの通知に失敗", e instanceof Error ? e.message : e);
  }
}
