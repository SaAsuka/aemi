// ブラウザ用。応募フォームの入力を端末に途中保存する（画面を閉じた・ブラウザが落ちたときに戻すため）。
// 保存するのは文字・リンクの値と、アップロード済みファイルの場所だけ。使えない端末でも応募はできる
export type DraftEntry = { value?: string; fileUrl?: string | null; fileName?: string | null }
export type Draft = Record<string, DraftEntry>

const keyOf = (talentId: string, jobId: string) => `apply-draft:${talentId}:${jobId}`

export function loadDraft(talentId: string, jobId: string): Draft {
  try {
    const raw = localStorage.getItem(keyOf(talentId, jobId))
    const parsed = raw ? JSON.parse(raw) : null
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

export function saveDraft(talentId: string, jobId: string, draft: Draft) {
  try {
    const hasContent = Object.values(draft).some((d) => d.value || d.fileUrl)
    if (hasContent) localStorage.setItem(keyOf(talentId, jobId), JSON.stringify(draft))
    else localStorage.removeItem(keyOf(talentId, jobId))
  } catch {
    // 保存できない端末（プライベートブラウズ・容量いっぱい等）では途中保存しない
  }
}

export function clearDraft(talentId: string, jobId: string) {
  try {
    localStorage.removeItem(keyOf(talentId, jobId))
  } catch {
    // 何もしない
  }
}
