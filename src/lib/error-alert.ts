import { composeSecretary, notifySecretary } from "@/lib/secretary-line";

// 本番で画面やAPIが落ちたら、齊藤さんの秘書LINEへ知らせる（2026-10-16。KAMITE の error-alert.ts と同じ考え方）。
// Vercel のログは1時間ほどで消えるので、ここで拾わないと現場から言われるまで気づけない。
// LINE は月200通までなので、同じエラーは1時間に1通まで（関数の起動ごとの記憶なので、厳密ではない）

const SAME_ERROR_INTERVAL_MS = 60 * 60 * 1000;
const lastSent = new Map<string, { at: number; count: number }>();

type ErrorInfo = { message: string; digest?: string; method: string; path: string; routePath: string; routeType: string };

/** 画面遷移や404は「エラーの形をした正常な動き」なので知らせない */
function isControlFlow(e: ErrorInfo): boolean {
  return /^NEXT_(REDIRECT|NOT_FOUND|HTTP_ERROR)/.test(e.digest ?? "") || /^NEXT_(REDIRECT|NOT_FOUND)/.test(e.message);
}

const jstNow = () => new Date(Date.now() + 9 * 3600_000).toISOString().slice(5, 16).replace("T", " ").replace("-", "/");

export async function reportServerError(e: ErrorInfo): Promise<void> {
  if (isControlFlow(e)) return;
  const key = `${e.routePath}\n${e.message}`;
  const prev = lastSent.get(key);
  if (prev && Date.now() - prev.at < SAME_ERROR_INTERVAL_MS) {
    prev.count += 1;
    return;
  }
  lastSent.set(key, { at: Date.now(), count: 0 });

  // クエリには鍵や個人を指す値が乗ることがあるので、パスだけ載せる
  const path = e.path.split("?")[0];
  const body = [
    `${jstNow()}  ${e.method} ${path}`,
    `内容: ${e.message.slice(0, 300)}`,
    e.digest ? `ERROR番号: ${e.digest}` : "",
    prev?.count ? `※前回の通知のあと同じエラーが${prev.count}回出ています` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const ask =
    `VOZELの本番で ${e.method} ${path}（${e.routePath}・${e.routeType}）がエラーになりました。内容「${e.message.slice(0, 200)}」${e.digest ? `／ERROR番号 ${e.digest}` : ""}。` +
    "`npx vercel logs` で該当のログを探し（1時間ほどで消える）、原因を特定して直してください。直したら本番に出して、同じ操作がエラーにならないことを確かめてください。";
  await notifySecretary(composeSecretary("【VOZEL】本番で画面が落ちました", body, ask));
}
