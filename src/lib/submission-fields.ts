// 案件ごとの自由な提出項目（jobs.submissionFields）と、その回答（applications.submissionAnswers）。
// DBでは JSON で持つので形はDBが守ってくれない。読み書きは必ずこのファイルの関数を通す。
// サーバーとブラウザの両方で使うため、サーバー専用のもの（logger・DB）はここで import しない。
import { z } from "zod"
import { isErrorCode } from "@/lib/error-code"

export const FIELD_KINDS = ["PHOTO", "FILE", "TEXT", "URL"] as const
export const AUTOFILLS = ["NAME", "AGE", "HEIGHT", "COMPOSITE"] as const
export const ANSWER_ORIGINS = ["INPUT", "PROFILE", "DEFERRED", "ADMIN"] as const
export const MAX_FIELDS = 50

export type FieldKind = (typeof FIELD_KINDS)[number]
export type Autofill = (typeof AUTOFILLS)[number]
export type AnswerOrigin = (typeof ANSWER_ORIGINS)[number]

const KEY_PATTERN = /^[kv]_[0-9a-z]{8}(_\d+)?$/

export const submissionFieldSchema = z
  .object({
    key: z.string().regex(KEY_PATTERN),
    label: z.string().trim().min(1).max(200),
    kind: z.enum(FIELD_KINDS),
    required: z.boolean(),
    note: z.string().max(1000).nullable().default(null),
    autofill: z.enum(AUTOFILLS).nullable().default(null),
    autofillOverridden: z.boolean().default(false),
    source: z.enum(["KAMITE", "VOZEL"]),
  })
  .transform((f) => ({ ...f, autofill: compatibleAutofill(f.autofill, f.kind) }))

export type SubmissionField = z.output<typeof submissionFieldSchema>

export const submissionFieldsSchema = z
  .array(submissionFieldSchema)
  .max(MAX_FIELDS)
  .refine((fields) => new Set(fields.map((f) => f.key)).size === fields.length, {
    message: "項目のキーが重複しています",
  })

export const submissionAnswerSchema = z
  .object({
    key: z.string().regex(KEY_PATTERN),
    label: z.string().min(1).max(200),
    kind: z.enum(FIELD_KINDS),
    value: z.string().nullable().default(null),
    fileUrl: z.string().max(2000).nullable().default(null),
    fileName: z.string().max(255).nullable().default(null),
    origin: z.enum(ANSWER_ORIGINS),
    errorCode: z.string().nullable().default(null),
    updatedAt: z.string().nullable().default(null),
  })
  .superRefine((a, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: "custom", message })

    if (a.origin === "ADMIN" ? !a.updatedAt : a.updatedAt !== null) {
      fail("updatedAt は管理者の登録のときだけ持つ")
    }

    if (a.origin === "DEFERRED") {
      if (a.kind !== "PHOTO" && a.kind !== "FILE") fail("別途送るは写真・ファイルの項目だけ")
      if (a.value !== null || a.fileUrl !== null) fail("別途送るの回答は中身を持たない")
      if (!isErrorCode(a.errorCode)) fail("別途送るには受付番号が要る")
      return
    }
    if (a.errorCode !== null) fail("受付番号は別途送るのときだけ持つ")

    if (a.kind === "TEXT") {
      if (!a.value || a.value.length > 2000) fail("文字は1〜2000文字")
    } else if (a.kind === "URL") {
      if (!a.value || a.value.length > 2000 || !isHttpUrl(a.value)) fail("リンクは http(s) のURL")
    } else {
      if (!a.fileUrl) fail("写真・ファイルはファイルが要る")
      if (a.value !== null) fail("写真・ファイルの回答は文字を持たない")
    }
  })

export type SubmissionAnswer = z.output<typeof submissionAnswerSchema>

type Warn = (message: string, detail: Record<string, unknown>) => void

// 1件ずつ確かめ、形が合わないものだけ外す（1件の不備で全部が見えなくならないように）
export function parseSubmissionFields(json: unknown, warn?: Warn): SubmissionField[] {
  if (!Array.isArray(json)) return []
  const out: SubmissionField[] = []
  const seen = new Set<string>()
  json.forEach((item, index) => {
    const parsed = submissionFieldSchema.safeParse(item)
    if (!parsed.success) {
      warn?.("submission_field_invalid", { index, issues: parsed.error.issues.map((i) => i.message) })
      return
    }
    if (seen.has(parsed.data.key)) {
      warn?.("submission_field_duplicate_key", { index, key: parsed.data.key })
      return
    }
    seen.add(parsed.data.key)
    out.push(parsed.data)
  })
  return out.slice(0, MAX_FIELDS)
}

export function parseSubmissionAnswers(json: unknown, warn?: Warn): SubmissionAnswer[] {
  if (!Array.isArray(json)) return []
  const out: SubmissionAnswer[] = []
  json.forEach((item, index) => {
    const parsed = submissionAnswerSchema.safeParse(item)
    if (!parsed.success) {
      warn?.("submission_answer_invalid", { index, issues: parsed.error.issues.map((i) => i.message) })
      return
    }
    out.push(parsed.data)
  })
  return out
}

// フォームに出す項目（コンポジの項目は出さない）
export function visibleFields(fields: SubmissionField[]): SubmissionField[] {
  return fields.filter((f) => f.autofill !== "COMPOSITE")
}

// 必須の自由項目に「回答なし」か「別途送付待ち」があるか。コンポジの項目は回答を持たないので見ない
export function hasMissingRequired(fields: SubmissionField[], answers: SubmissionAnswer[]): boolean {
  const byKey = new Map(answers.map((a) => [a.key, a]))
  return visibleFields(fields).some((f) => {
    if (!f.required) return false
    const a = byKey.get(f.key)
    return !a || a.origin === "DEFERRED"
  })
}

// ---- 項目名からの自動判定 ----

const NAME_EXCLUDES = ["保護者", "緊急", "連絡先", "事務所", "担当", "ふりがな", "フリガナ", "カナ", "ローマ字"]

function normalizeLabel(label: string): string {
  return label.normalize("NFKC").replace(/[\s\p{P}\p{S}]/gu, "")
}

export function detectAutofill(label: string, kind: FieldKind): Autofill | null {
  const norm = normalizeLabel(label)
  if (norm.includes("プロフィール") || norm.includes("コンポジ")) return "COMPOSITE"
  if (kind !== "TEXT") return null
  if (!NAME_EXCLUDES.some((w) => norm.includes(w))) {
    const core = norm.replace(/^[おご]/, "")
    if (core === "名前" || core === "氏名") return "NAME"
  }
  if (norm.includes("年齢")) return "AGE"
  if (norm.includes("身長")) return "HEIGHT"
  return null
}

function compatibleAutofill(autofill: Autofill | null, kind: FieldKind): Autofill | null {
  if (autofill && autofill !== "COMPOSITE" && kind !== "TEXT") return null
  return autofill
}

// ---- 項目のキー ----

// KAMITE は項目IDを送ってこないので、項目名から作る（送り直しで同じ項目名なら同じキー＝既存の回答と結び付いたまま）
function fnv1a(text: string): string {
  let h = 0x811c9dc5
  for (const ch of text) {
    h ^= ch.codePointAt(0)!
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(16).padStart(8, "0")
}

export function makeKamiteFieldKeys(labels: string[]): string[] {
  const counts = new Map<string, number>()
  return labels.map((label) => {
    const base = `k_${fnv1a(label.trim())}`
    const n = (counts.get(base) ?? 0) + 1
    counts.set(base, n)
    return n === 1 ? base : `${base}_${n}`
  })
}

export function makeVozelFieldKey(): string {
  const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz"
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  return "v_" + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("")
}

// ---- KAMITE から届いた提出物を項目にする ----

export type KamiteRequirement = { label: string; kind: FieldKind; required: boolean; note?: string | null }

// 送り直しでは丸ごと置き換える。ただし同じキーで管理者が自動判定を直していたものは、その判定を引き継ぐ
export function mergeKamiteFields(prev: SubmissionField[], incoming: KamiteRequirement[]): SubmissionField[] {
  const keys = makeKamiteFieldKeys(incoming.map((r) => r.label))
  const prevByKey = new Map(prev.map((f) => [f.key, f]))
  return incoming.slice(0, MAX_FIELDS).map((r, i) => {
    const label = r.label.trim().slice(0, 200)
    const old = prevByKey.get(keys[i])
    const keep = old?.autofillOverridden === true
    return {
      key: keys[i],
      label,
      kind: r.kind,
      required: r.required,
      note: r.note ? r.note.slice(0, 1000) : null,
      autofill: compatibleAutofill(keep ? old.autofill : detectAutofill(label, r.kind), r.kind),
      autofillOverridden: keep,
      source: "KAMITE" as const,
    }
  })
}

// ---- 応募フォームから届いた回答を組み立てる ----

export type BuiltAnswer = { ok: true; answer: SubmissionAnswer | null } | { ok: false; error: string }

// フォームの ans_{key}_* から1項目ぶんの回答を作る。空なら answer: null（必須かどうかは呼び出し側で見る）
export function buildAnswerFromForm(
  field: SubmissionField,
  get: (name: string) => string | null,
  owner: { talentId: string; jobId: string }
): BuiltAnswer {
  const base = { key: field.key, label: field.label, kind: field.kind, origin: "INPUT" as const, errorCode: null, updatedAt: null }

  if (field.kind === "PHOTO" || field.kind === "FILE") {
    const fileUrl = get(`ans_${field.key}_fileUrl`)?.trim() || null
    if (!fileUrl) return { ok: true, answer: null }
    if (!isSubmissionFileOf(fileUrl, owner.talentId, owner.jobId)) {
      return { ok: false, error: `「${field.label}」のファイルをもう一度アップロードしてください` }
    }
    const fileName = (get(`ans_${field.key}_fileName`) ?? "").slice(0, 255) || null
    return { ok: true, answer: { ...base, value: null, fileUrl, fileName } }
  }

  const value = get(`ans_${field.key}_value`)?.trim() || null
  if (!value) return { ok: true, answer: null }
  const answer = { ...base, value, fileUrl: null, fileName: null }
  if (!submissionAnswerSchema.safeParse(answer).success) {
    return {
      ok: false,
      error:
        field.kind === "URL"
          ? `「${field.label}」は https:// から始まるURLを入力してください`
          : `「${field.label}」は2000文字以内で入力してください`,
    }
  }
  return { ok: true, answer }
}

export function missingMessage(field: SubmissionField): string {
  return field.kind === "PHOTO" || field.kind === "FILE"
    ? `「${field.label}」をアップロードしてください`
    : `「${field.label}」を入力してください`
}

// フォームが表示していた項目と、案件の今の項目が同じか（入力中に KAMITE 再送・管理者の編集で変わっていないか）
export function sameFieldKeys(sentJson: string | null, fields: SubmissionField[]): boolean {
  let sent: unknown
  try {
    sent = sentJson ? JSON.parse(sentJson) : null
  } catch {
    return false
  }
  if (!Array.isArray(sent) || !sent.every((k) => typeof k === "string")) return false
  const now = new Set(fields.map((f) => f.key))
  return sent.length === now.size && new Set(sent).size === sent.length && sent.every((k) => now.has(k))
}

// ---- 管理画面の応募詳細に並べる行 ----

export type AnswerRowState = "COMPOSITE" | "ANSWERED" | "DEFERRED" | "MISSING"

export type AnswerRow = {
  key: string
  label: string
  kind: FieldKind
  required: boolean
  state: AnswerRowState
  answer: SubmissionAnswer | null
  // 回答した後で案件から消えた項目（回答時点の項目名で出す）
  removed: boolean
}

// 案件の項目順に並べる。コンポジの項目はタレントの登録済みコンポジットを出す行にする。
// 案件から消えた項目の回答は、最後に回答時点の項目名で並べる
export function buildAnswerRows(fields: SubmissionField[], answers: SubmissionAnswer[]): AnswerRow[] {
  const byKey = new Map(answers.map((a) => [a.key, a]))
  const rows: AnswerRow[] = fields.map((f) => {
    if (f.autofill === "COMPOSITE") {
      return { key: f.key, label: f.label, kind: f.kind, required: f.required, state: "COMPOSITE", answer: null, removed: false }
    }
    const a = byKey.get(f.key) ?? null
    const state: AnswerRowState = !a ? "MISSING" : a.origin === "DEFERRED" ? "DEFERRED" : "ANSWERED"
    return { key: f.key, label: f.label, kind: f.kind, required: f.required, state, answer: a, removed: false }
  })
  const current = new Set(fields.map((f) => f.key))
  for (const a of answers) {
    if (current.has(a.key)) continue
    rows.push({
      key: a.key,
      label: a.label,
      kind: a.kind,
      required: false,
      state: a.origin === "DEFERRED" ? "DEFERRED" : "ANSWERED",
      answer: a,
      removed: true,
    })
  }
  return rows
}

function safeFilePart(text: string): string {
  return text.replace(/[\\/:*?"<>|\s]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80) || "file"
}

function extensionOf(...candidates: (string | null | undefined)[]): string {
  for (const c of candidates) {
    const m = c?.split("?")[0].match(/\.([a-zA-Z0-9]{1,5})$/)
    if (m) return m[1].toLowerCase()
  }
  return "jpg"
}

// 写真のまとめてダウンロードで、ZIPの中のファイル名を決める（{タレント名}_{項目名}.{拡張子}、同名は _2, _3）
export function zipEntryNames(talentName: string, rows: AnswerRow[]): { fileUrl: string; name: string }[] {
  const used = new Map<string, number>()
  const out: { fileUrl: string; name: string }[] = []
  for (const row of rows) {
    if (row.kind !== "PHOTO" || row.state !== "ANSWERED" || !row.answer?.fileUrl) continue
    const ext = extensionOf(row.answer.fileUrl, row.answer.fileName)
    const base = `${safeFilePart(talentName)}_${safeFilePart(row.label)}`
    const n = (used.get(base) ?? 0) + 1
    used.set(base, n)
    out.push({ fileUrl: row.answer.fileUrl, name: n === 1 ? `${base}.${ext}` : `${base}_${n}.${ext}` })
  }
  return out
}

// ---- 提出物ファイルの置き場所 ----

export function submissionStoragePrefix(talentId: string, jobId: string): string {
  return `applications/${talentId}/${jobId}/`
}

// その応募者・その案件の提出物の置き場所にあるファイルか（他人のファイル・別案件のファイル・任意のURLを入れさせない）
export function isSubmissionFileOf(url: string, talentId: string, jobId: string): boolean {
  if (url.includes("..")) return false
  const m = url.match(/\/storage\/v1\/object\/[^/]+\/(.+)$/)
  return !!m && m[1].startsWith(submissionStoragePrefix(talentId, jobId))
}

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value)
    return u.protocol === "http:" || u.protocol === "https:"
  } catch {
    return false
  }
}
