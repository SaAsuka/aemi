// ブラウザ用。タレントの案件一覧から案件ページへ行くとき、一覧のURL（絞り込み・並び順つき）と
// スクロール位置を覚えておき、「案件一覧に戻る」で同じ一覧・同じ位置に戻すためのもの。
// sessionStorage が使えない端末では何もしない（今までどおり一覧の先頭に戻るだけ）
const KEY = "talent-job-list:return"

export type JobListReturn = { url: string; scrollY: number }

// 戻り先はタレントの案件一覧だけ（外のサイトや別の画面へ飛ばさない）
export function isJobListUrl(url: unknown): url is string {
  return typeof url === "string" && /^\/jobs(\?[^#]*)?$/.test(url)
}

export function saveJobListReturn(value: JobListReturn) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(value))
  } catch {
    // 保存できなくても困らない
  }
}

export function readJobListReturn(): JobListReturn | null {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(KEY) ?? "null")
    if (!parsed || !isJobListUrl(parsed.url) || typeof parsed.scrollY !== "number") return null
    return { url: parsed.url, scrollY: Math.max(0, parsed.scrollY) }
  } catch {
    return null
  }
}

export function clearJobListReturn() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // 何もしない
  }
}
