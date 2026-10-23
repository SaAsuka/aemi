import { createHash } from "node:crypto";
import { composeSecretary, notifySecretary } from "@/lib/secretary-line";

// 本番で画面やAPIが落ちたら、齊藤さんの秘書LINEへ知らせる（2026-10-16。KAMITE の error-alert.ts と同じ考え方）。
// Vercel のログは1時間ほどで消えるので、ここで拾わないと現場から言われるまで気づけない。
// 同じ内容のエラーは、1通送ったら6時間は送らない（2026-10-23 本人指示。DBが落ちると全画面から同じエラーが出て、数分おきに届いていた）。
// 送った記録は Vercel の共有キャッシュに置く。関数の起動ごとの記憶だと、別の起動から来た同じエラーを止められなかった

const SAME_ERROR_INTERVAL_MS = 6 * 60 * 60 * 1000;

type SharedCache = {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: unknown, options?: { ttl?: number }) => Promise<void>;
};
const fallback = new Map<string, unknown>();

/** Vercel の共有キャッシュ（@vercel/functions の getCache と同じ取り方。依存を増やさないため直接読む）。無い環境では起動ごとの記憶で代わりにする */
function sharedCache(): SharedCache {
  const ctx = (globalThis as { [k: symbol]: { get?: () => { cache?: SharedCache } } | undefined })[
    Symbol.for("@vercel/request-context")
  ]?.get?.();
  return (
    ctx?.cache ?? {
      get: async (k) => fallback.get(k) ?? null,
      set: async (k, v) => void fallback.set(k, v),
    }
  );
}

type ErrorInfo = { message: string; digest?: string; method: string; path: string; routePath: string; routeType: string };
type Sent = { at: number; count: number };

/** 画面遷移や404は「エラーの形をした正常な動き」なので知らせない */
function isControlFlow(e: ErrorInfo): boolean {
  return /^NEXT_(REDIRECT|NOT_FOUND|HTTP_ERROR)/.test(e.digest ?? "") || /^NEXT_(REDIRECT|NOT_FOUND)/.test(e.message);
}

const jstNow = () => new Date(Date.now() + 9 * 3600_000).toISOString().slice(5, 16).replace("T", " ").replace("-", "/");

/** 送ってよければ true。止めたときは止めた回数を数えておき、次に送る通知に添える */
async function claim(key: string): Promise<{ ok: boolean; suppressed: number }> {
  const cache = sharedCache();
  key = `secretary-error-alert$${createHash("sha256").update(key).digest("hex").slice(0, 32)}`;
  const prev = ((await cache.get(key).catch(() => null)) as Sent | null) ?? null;
  const now = Date.now();
  // 記録は止める期間より長く残し、明けたあとの1通に「その間に何回出たか」を書けるようにする
  const ttl = (SAME_ERROR_INTERVAL_MS * 4) / 1000;
  if (prev && now - prev.at < SAME_ERROR_INTERVAL_MS) {
    await cache.set(key, { at: prev.at, count: prev.count + 1 }, { ttl }).catch(() => {});
    return { ok: false, suppressed: 0 };
  }
  await cache.set(key, { at: now, count: 0 }, { ttl }).catch(() => {});
  return { ok: true, suppressed: prev?.count ?? 0 };
}

export async function reportServerError(e: ErrorInfo): Promise<void> {
  if (isControlFlow(e)) return;
  // 画面が違っても中身が同じなら同じエラーとみなす（DBが落ちると全画面から同じ内容で出るため）
  const { ok, suppressed } = await claim(e.message);
  if (!ok) return;

  // クエリには鍵や個人を指す値が乗ることがあるので、パスだけ載せる
  const path = e.path.split("?")[0];
  const body = [
    `${jstNow()}  ${e.method} ${path}`,
    `内容: ${e.message.slice(0, 300)}`,
    e.digest ? `ERROR番号: ${e.digest}` : "",
    suppressed ? `※前回の通知のあと同じエラーが${suppressed}回出ています` : "",
    "※同じ内容はこの先6時間は通知しません",
  ]
    .filter(Boolean)
    .join("\n");
  const ask =
    `VOZELの本番で ${e.method} ${path}（${e.routePath}・${e.routeType}）がエラーになりました。内容「${e.message.slice(0, 200)}」${e.digest ? `／ERROR番号 ${e.digest}` : ""}。` +
    "`npx vercel logs` で該当のログを探し（1時間ほどで消える）、原因を特定して直してください。直したら本番に出して、同じ操作がエラーにならないことを確かめてください。";
  await notifySecretary(composeSecretary("【VOZEL】本番で画面が落ちました", body, ask));
}
