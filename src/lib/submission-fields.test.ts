import { describe, it, expect, vi } from "vitest"
import {
  detectAutofill,
  makeKamiteFieldKeys,
  makeVozelFieldKey,
  mergeKamiteFields,
  parseSubmissionFields,
  parseSubmissionAnswers,
  submissionFieldsSchema,
  submissionAnswerSchema,
  hasMissingRequired,
  visibleFields,
  isSubmissionFileOf,
  buildAnswerFromForm,
  sameFieldKeys,
  type SubmissionField,
  type SubmissionAnswer,
} from "./submission-fields"

const field = (over: Partial<SubmissionField> = {}): SubmissionField => ({
  key: "k_00000001",
  label: "最寄駅",
  kind: "TEXT",
  required: true,
  note: null,
  autofill: null,
  autofillOverridden: false,
  source: "KAMITE",
  ...over,
})

const answer = (over: Partial<SubmissionAnswer> = {}): SubmissionAnswer => ({
  key: "k_00000001",
  label: "最寄駅",
  kind: "TEXT",
  value: "渋谷駅",
  fileUrl: null,
  fileName: null,
  origin: "INPUT",
  errorCode: null,
  updatedAt: null,
  ...over,
})

describe("detectAutofill", () => {
  it("本人の名前の項目を NAME にする", () => {
    expect(detectAutofill("お名前", "TEXT")).toBe("NAME")
    expect(detectAutofill("氏名", "TEXT")).toBe("NAME")
    expect(detectAutofill("ご氏名", "TEXT")).toBe("NAME")
    expect(detectAutofill("名前", "TEXT")).toBe("NAME")
    expect(detectAutofill("【お名前】", "TEXT")).toBe("NAME")
  })

  it("本人以外の名前・読み仮名は NAME にしない", () => {
    expect(detectAutofill("保護者氏名", "TEXT")).toBeNull()
    expect(detectAutofill("緊急連絡先の氏名", "TEXT")).toBeNull()
    expect(detectAutofill("フリガナ（名前）", "TEXT")).toBeNull()
    expect(detectAutofill("お名前（ふりがな）", "TEXT")).toBeNull()
    expect(detectAutofill("事務所名", "TEXT")).toBeNull()
    expect(detectAutofill("担当者名", "TEXT")).toBeNull()
  })

  it("年齢・身長を判定する", () => {
    expect(detectAutofill("年齢", "TEXT")).toBe("AGE")
    expect(detectAutofill("現在の年齢", "TEXT")).toBe("AGE")
    expect(detectAutofill("身長", "TEXT")).toBe("HEIGHT")
    expect(detectAutofill("身長（cm）", "TEXT")).toBe("HEIGHT")
  })

  it("「プロフィール」「コンポジ」は種類に関わらず COMPOSITE", () => {
    expect(detectAutofill("プロフィール資料", "FILE")).toBe("COMPOSITE")
    expect(detectAutofill("コンポジ", "PHOTO")).toBe("COMPOSITE")
    expect(detectAutofill("プロフィール写真", "PHOTO")).toBe("COMPOSITE")
    expect(detectAutofill("プロフィール", "TEXT")).toBe("COMPOSITE")
    expect(detectAutofill("ﾌﾟﾛﾌｨｰﾙ", "URL")).toBe("COMPOSITE")
  })

  it("名前・年齢・身長は文字の項目のときだけ", () => {
    expect(detectAutofill("お名前", "PHOTO")).toBeNull()
    expect(detectAutofill("年齢", "FILE")).toBeNull()
    expect(detectAutofill("身長", "URL")).toBeNull()
  })

  it("どれにも当たらなければ null", () => {
    expect(detectAutofill("最寄駅", "TEXT")).toBeNull()
    expect(detectAutofill("近影写真", "PHOTO")).toBeNull()
  })
})

describe("項目のキー", () => {
  it("同じ項目名なら同じキーになる（送り直しで回答と結び付いたまま）", () => {
    expect(makeKamiteFieldKeys(["最寄駅"])).toEqual(makeKamiteFieldKeys(["最寄駅"]))
    expect(makeKamiteFieldKeys([" 最寄駅 "])[0]).toBe(makeKamiteFieldKeys(["最寄駅"])[0])
  })

  it("違う項目名なら違うキー", () => {
    const [a, b] = makeKamiteFieldKeys(["最寄駅", "近影写真"])
    expect(a).not.toBe(b)
  })

  it("同じ項目名が複数あれば出現順に番号を付ける", () => {
    const [a, b, c] = makeKamiteFieldKeys(["写真", "写真", "写真"])
    expect(b).toBe(`${a}_2`)
    expect(c).toBe(`${a}_3`)
  })

  it("キーの形", () => {
    expect(makeKamiteFieldKeys(["最寄駅"])[0]).toMatch(/^k_[0-9a-f]{8}$/)
    expect(makeVozelFieldKey()).toMatch(/^v_[0-9a-z]{8}$/)
    expect(makeVozelFieldKey()).not.toBe(makeVozelFieldKey())
  })
})

describe("mergeKamiteFields", () => {
  const reqs = [
    { label: "プロフィール写真", kind: "PHOTO" as const, required: false },
    { label: "最寄駅", kind: "TEXT" as const, required: true, note: "路線名も" },
  ]

  it("新規は自動判定する", () => {
    const fields = mergeKamiteFields([], reqs)
    expect(fields.map((f) => f.autofill)).toEqual(["COMPOSITE", null])
    expect(fields.every((f) => f.source === "KAMITE" && !f.autofillOverridden)).toBe(true)
    expect(fields[1].note).toBe("路線名も")
  })

  it("管理者が直した自動判定は送り直しでも引き継ぐ", () => {
    const first = mergeKamiteFields([], reqs)
    const edited = first.map((f) => (f.label === "プロフィール写真" ? { ...f, autofill: null, autofillOverridden: true } : f))
    const resent = mergeKamiteFields(edited, reqs)
    expect(resent[0].autofill).toBeNull()
    expect(resent[0].autofillOverridden).toBe(true)
  })

  it("直していない項目は送り直しで判定し直す", () => {
    const first = mergeKamiteFields([], reqs)
    const resent = mergeKamiteFields(first, reqs)
    expect(resent[0].autofill).toBe("COMPOSITE")
  })

  it("消えた項目はなくなり、増えた項目は足される", () => {
    const first = mergeKamiteFields([], reqs)
    const resent = mergeKamiteFields(first, [{ label: "最寄りのバス停", kind: "TEXT", required: true }])
    expect(resent).toHaveLength(1)
    expect(resent[0].label).toBe("最寄りのバス停")
  })

  it("引き継いだ判定でも種類に合わなければ外す", () => {
    const first = mergeKamiteFields([], [{ label: "身長", kind: "TEXT", required: true }])
    const edited = [{ ...first[0], autofillOverridden: true }]
    const resent = mergeKamiteFields(edited, [{ label: "身長", kind: "PHOTO", required: true }])
    expect(resent[0].autofill).toBeNull()
  })
})

describe("submissionFieldsSchema", () => {
  it("正しい形は通る", () => {
    expect(submissionFieldsSchema.safeParse([field()]).success).toBe(true)
  })

  it("必須の欠落・形の違いは通さない", () => {
    expect(submissionFieldsSchema.safeParse([{ ...field(), label: "" }]).success).toBe(false)
    expect(submissionFieldsSchema.safeParse([{ ...field(), kind: "VIDEO" }]).success).toBe(false)
    expect(submissionFieldsSchema.safeParse([{ ...field(), key: "x_1" }]).success).toBe(false)
    const { required: _r, ...noRequired } = field()
    expect(submissionFieldsSchema.safeParse([noRequired]).success).toBe(false)
  })

  it("境界値", () => {
    const many = (n: number) => Array.from({ length: n }, (_, i) => field({ key: `v_${String(i).padStart(8, "0")}` }))
    expect(submissionFieldsSchema.safeParse(many(50)).success).toBe(true)
    expect(submissionFieldsSchema.safeParse(many(51)).success).toBe(false)
    expect(submissionFieldsSchema.safeParse([field({ label: "あ".repeat(200) })]).success).toBe(true)
    expect(submissionFieldsSchema.safeParse([field({ label: "あ".repeat(201) })]).success).toBe(false)
    expect(submissionFieldsSchema.safeParse([field({ note: "あ".repeat(1000) })]).success).toBe(true)
    expect(submissionFieldsSchema.safeParse([field({ note: "あ".repeat(1001) })]).success).toBe(false)
  })

  it("キーの重複は通さない", () => {
    expect(submissionFieldsSchema.safeParse([field(), field()]).success).toBe(false)
  })

  it("種類に合わない自動判定は null に落とす", () => {
    const r = submissionFieldsSchema.parse([field({ kind: "PHOTO", autofill: "NAME" })])
    expect(r[0].autofill).toBeNull()
  })
})

describe("submissionAnswerSchema", () => {
  const ok = (a: Partial<SubmissionAnswer>) => submissionAnswerSchema.safeParse(answer(a)).success

  it("文字は1〜2000文字", () => {
    expect(ok({ value: "あ".repeat(2000) })).toBe(true)
    expect(ok({ value: "あ".repeat(2001) })).toBe(false)
    expect(ok({ value: "" })).toBe(false)
    expect(ok({ value: null })).toBe(false)
  })

  it("リンクは http(s) のURLだけ", () => {
    expect(ok({ kind: "URL", value: "https://youtube.com/watch?v=x" })).toBe(true)
    expect(ok({ kind: "URL", value: "javascript:alert(1)" })).toBe(false)
    expect(ok({ kind: "URL", value: "youtube.com" })).toBe(false)
  })

  it("写真・ファイルはファイルが要る", () => {
    expect(ok({ kind: "PHOTO", value: null, fileUrl: "https://x/a.jpg" })).toBe(true)
    expect(ok({ kind: "PHOTO", value: null, fileUrl: null })).toBe(false)
    expect(ok({ kind: "FILE", value: "x", fileUrl: "https://x/a.pdf" })).toBe(false)
  })

  it("別途送るは写真・ファイルで、中身なし・受付番号あり", () => {
    expect(ok({ kind: "PHOTO", value: null, origin: "DEFERRED", errorCode: "E-7K2X9Q" })).toBe(true)
    expect(ok({ kind: "PHOTO", value: null, origin: "DEFERRED", errorCode: null })).toBe(false)
    expect(ok({ kind: "TEXT", value: null, origin: "DEFERRED", errorCode: "E-7K2X9Q" })).toBe(false)
    expect(ok({ kind: "PHOTO", value: null, fileUrl: "https://x/a.jpg", origin: "DEFERRED", errorCode: "E-7K2X9Q" })).toBe(false)
  })

  it("updatedAt は管理者の登録のときだけ", () => {
    expect(ok({ origin: "ADMIN", updatedAt: "2026-10-11T00:00:00.000Z" })).toBe(true)
    expect(ok({ origin: "ADMIN", updatedAt: null })).toBe(false)
    expect(ok({ origin: "INPUT", updatedAt: "2026-10-11T00:00:00.000Z" })).toBe(false)
  })
})

describe("parse は1件ずつ確かめる", () => {
  it("不正な1件だけ外れて、残りは読める", () => {
    const warn = vi.fn()
    const result = parseSubmissionAnswers([answer(), { key: "k_00000002", kind: "TEXT" }, answer({ key: "k_00000003" })], warn)
    expect(result.map((a) => a.key)).toEqual(["k_00000001", "k_00000003"])
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it("配列でなければ空", () => {
    expect(parseSubmissionAnswers(null)).toEqual([])
    expect(parseSubmissionFields({})).toEqual([])
  })

  it("項目のキーが重複したら後のものを外す", () => {
    const result = parseSubmissionFields([field(), field({ label: "別" })])
    expect(result).toHaveLength(1)
    expect(result[0].label).toBe("最寄駅")
  })
})

describe("hasMissingRequired / visibleFields", () => {
  const fields = [
    field({ key: "k_00000001", required: true }),
    field({ key: "k_00000002", required: false }),
    field({ key: "k_00000003", required: true, kind: "FILE", autofill: "COMPOSITE" }),
  ]

  it("必須に回答があれば false（コンポジの項目は見ない）", () => {
    expect(hasMissingRequired(fields, [answer({ key: "k_00000001" })])).toBe(false)
  })

  it("必須に回答がなければ true", () => {
    expect(hasMissingRequired(fields, [])).toBe(true)
  })

  it("必須が別途送付待ちなら true", () => {
    const f = [field({ key: "k_00000001", kind: "PHOTO" })]
    const a = [answer({ key: "k_00000001", kind: "PHOTO", value: null, origin: "DEFERRED", errorCode: "E-7K2X9Q" })]
    expect(hasMissingRequired(f, a)).toBe(true)
  })

  it("任意だけが空なら false", () => {
    expect(hasMissingRequired([field({ required: false })], [])).toBe(false)
  })

  it("コンポジの項目はフォームに出さない", () => {
    expect(visibleFields(fields).map((f) => f.key)).toEqual(["k_00000001", "k_00000002"])
  })
})

describe("buildAnswerFromForm", () => {
  const owner = { talentId: "t1", jobId: "j1" }
  const fileBase = "https://abc.supabase.co/storage/v1/object/talent-files/applications/t1/j1"
  const getter = (values: Record<string, string>) => (name: string) => values[name] ?? null

  it("文字の回答を作る（前後の空白は除く）", () => {
    const r = buildAnswerFromForm(field(), getter({ "ans_k_00000001_value": "  渋谷駅 " }), owner)
    expect(r).toEqual({ ok: true, answer: expect.objectContaining({ value: "渋谷駅", origin: "INPUT", label: "最寄駅" }) })
  })

  it("空なら answer: null", () => {
    expect(buildAnswerFromForm(field(), getter({}), owner)).toEqual({ ok: true, answer: null })
    expect(buildAnswerFromForm(field(), getter({ "ans_k_00000001_value": "   " }), owner)).toEqual({ ok: true, answer: null })
  })

  it("URLでないリンク・長すぎる文字はエラー", () => {
    const url = field({ kind: "URL", label: "参考動画" })
    expect(buildAnswerFromForm(url, getter({ "ans_k_00000001_value": "youtube.com" }), owner).ok).toBe(false)
    expect(buildAnswerFromForm(field(), getter({ "ans_k_00000001_value": "あ".repeat(2001) }), owner).ok).toBe(false)
  })

  it("写真は本人のこの案件の置き場所のファイルだけ受け付ける", () => {
    const photo = field({ kind: "PHOTO", label: "近影写真" })
    const ok = buildAnswerFromForm(photo, getter({ "ans_k_00000001_fileUrl": `${fileBase}/k_00000001-1.jpg`, "ans_k_00000001_fileName": "IMG.HEIC" }), owner)
    expect(ok).toEqual({ ok: true, answer: expect.objectContaining({ fileName: "IMG.HEIC", value: null }) })
    const other = buildAnswerFromForm(photo, getter({ "ans_k_00000001_fileUrl": "https://abc.supabase.co/storage/v1/object/talent-files/applications/t2/j1/a.jpg" }), owner)
    expect(other.ok).toBe(false)
  })
})

describe("sameFieldKeys", () => {
  const fields = [field({ key: "k_00000001" }), field({ key: "k_00000002" })]
  it("同じ組なら true（順番は問わない）", () => {
    expect(sameFieldKeys(JSON.stringify(["k_00000002", "k_00000001"]), fields)).toBe(true)
  })
  it("増えた・減った・重複・壊れた値は false", () => {
    expect(sameFieldKeys(JSON.stringify(["k_00000001"]), fields)).toBe(false)
    expect(sameFieldKeys(JSON.stringify(["k_00000001", "k_00000002", "k_00000003"]), fields)).toBe(false)
    expect(sameFieldKeys(JSON.stringify(["k_00000001", "k_00000001"]), fields)).toBe(false)
    expect(sameFieldKeys("not json", fields)).toBe(false)
    expect(sameFieldKeys(null, fields)).toBe(false)
  })
})

describe("isSubmissionFileOf", () => {
  const base = "https://abc.supabase.co/storage/v1/object/talent-files"
  it("その応募者・その案件の置き場所なら true", () => {
    expect(isSubmissionFileOf(`${base}/applications/t1/j1/k_x-1.jpg`, "t1", "j1")).toBe(true)
  })
  it("他人・別案件・別の場所・任意URLなら false", () => {
    expect(isSubmissionFileOf(`${base}/applications/t2/j1/k_x-1.jpg`, "t1", "j1")).toBe(false)
    expect(isSubmissionFileOf(`${base}/applications/t1/j2/k_x-1.jpg`, "t1", "j1")).toBe(false)
    expect(isSubmissionFileOf(`${base}/photos/t1/j1/a.jpg`, "t1", "j1")).toBe(false)
    expect(isSubmissionFileOf(`${base}/applications/t1/j1/../../t2/a.jpg`, "t1", "j1")).toBe(false)
    expect(isSubmissionFileOf("https://evil.example.com/a.jpg", "t1", "j1")).toBe(false)
  })
})
