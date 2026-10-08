"use client"

import { useState, useTransition, useMemo, useRef, useEffect, useId } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AlertCircle, Check, ChevronDown, Loader2, Plus, Search, X } from "lucide-react"
import { createApplication } from "@/lib/actions/application"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { BTN_PRIMARY, BTN_SECONDARY, FIELD } from "@/components/admin/styles"

type Option = { value: string; label: string; sub?: string }

// 文字を打って候補を絞り込み、クリックかキーボード（↑↓・Enter）で選ぶ欄
function SearchableSelect({
  id,
  name,
  placeholder,
  options,
  value,
  onChange,
  invalid,
  describedBy,
}: {
  id: string
  name: string
  placeholder: string
  options: Option[]
  value: Option | null
  onChange: (o: Option | null) => void
  invalid?: boolean
  describedBy?: string
}) {
  const listId = useId()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q) || o.sub?.toLowerCase().includes(q))
  }, [options, query])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function choose(o: Option) {
    onChange(o)
    setOpen(false)
    setQuery("")
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setOpen(true)
      setActive((a) => Math.min(a + 1, filtered.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === "Enter") {
      if (open && filtered[active]) {
        e.preventDefault()
        choose(filtered[active])
      }
    } else if (e.key === "Escape" && open) {
      e.preventDefault()
      e.stopPropagation()
      setOpen(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      <input type="hidden" name={name} value={value?.value ?? ""} />
      {value && !open ? (
        <div
          className={`flex h-11 items-center gap-2 rounded-lg border bg-white px-3 ${invalid ? "border-red-600" : "border-neutral-300"}`}
        >
          <Check className="size-4 shrink-0 text-green-600" aria-hidden="true" />
          <button
            type="button"
            id={id}
            onClick={() => {
              setOpen(true)
              requestAnimationFrame(() => inputRef.current?.focus())
            }}
            className="min-w-0 flex-1 truncate text-left text-sm text-neutral-950"
            aria-describedby={describedBy}
          >
            {value.label}
            {value.sub && <span className="ml-2 text-xs text-neutral-500">{value.sub}</span>}
          </button>
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="選び直す"
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-950"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
          <input
            ref={inputRef}
            id={value ? undefined : id}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
              setActive(0)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            className={`${FIELD} h-11 pl-9 pr-9`}
          />
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
        </div>
      )}
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-neutral-200 bg-white p-1 shadow-xl"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-3 text-sm text-neutral-500">見つかりませんでした</li>
          ) : (
            filtered.map((o, i) => (
              <li key={o.value} role="option" aria-selected={value?.value === o.value}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(o)}
                  className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm ${
                    i === active ? "bg-neutral-100" : ""
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-neutral-950">{o.label}</span>
                    {o.sub && <span className="block truncate text-xs text-neutral-500">{o.sub}</span>}
                  </span>
                  {value?.value === o.value && <Check className="size-4 shrink-0 text-neutral-950" aria-hidden="true" />}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

export function NewApplicationDialog({
  talents,
  jobs,
  className = BTN_PRIMARY,
}: {
  talents: { id: string; name: string; nameKana: string }[]
  jobs: { id: string; title: string }[]
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [talent, setTalent] = useState<Option | null>(null)
  const [job, setJob] = useState<Option | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()

  const talentOptions = useMemo(() => talents.map((t) => ({ value: t.id, label: t.name, sub: t.nameKana })), [talents])
  const jobOptions = useMemo(() => jobs.map((j) => ({ value: j.id, label: j.title })), [jobs])

  function reset() {
    setTalent(null)
    setJob(null)
    setErrors({})
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!talent) errs.talentId = "タレントを選んでください"
    if (!job) errs.jobId = "案件を選んでください"
    setErrors(errs)
    if (Object.keys(errs).length) return
    const formData = new FormData(e.currentTarget)
    const talentName = talent?.label
    startTransition(async () => {
      const result = await createApplication(formData)
      if (result.error) {
        const next: Record<string, string> = {}
        for (const [k, v] of Object.entries(result.error)) {
          const msg = Array.isArray(v) ? v[0] : String(v)
          if (msg) next[k === "talentId" || k === "jobId" ? k : "form"] = msg
        }
        setErrors(next)
        return
      }
      toast.success(`${talentName}さんの応募を登録しました`)
      setOpen(false)
      reset()
      router.refresh()
    })
  }

  const fieldError = (key: string) =>
    errors[key] ? (
      <p id={`new-app-${key}-error`} className="mt-1.5 flex items-start gap-1 text-xs text-red-600">
        <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
        {errors[key]}
      </p>
    ) : null

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => {
          reset()
          setOpen(true)
        }}
      >
        <Plus aria-hidden="true" />
        新規応募
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 bg-white p-6 sm:max-w-lg">
          <DialogTitle className="text-lg font-semibold">応募を登録</DialogTitle>
          <DialogDescription className="mt-1.5 text-sm text-neutral-500">
            タレントの代わりに、事務所から応募を登録します。
          </DialogDescription>
          <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-5">
            <div>
              <label htmlFor="new-app-talent" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-neutral-900">
                タレント
                <span className="rounded bg-red-600 px-1.5 py-px text-[10px] font-semibold leading-4 text-white">必須</span>
              </label>
              <SearchableSelect
                id="new-app-talent"
                name="talentId"
                placeholder="名前かフリガナで探す"
                options={talentOptions}
                value={talent}
                onChange={(o) => {
                  setTalent(o)
                  setErrors((e) => ({ ...e, talentId: "", form: "" }))
                }}
                invalid={Boolean(errors.talentId)}
                describedBy={errors.talentId ? "new-app-talentId-error" : undefined}
              />
              {fieldError("talentId")}
              {!errors.talentId && <p className="mt-1.5 text-xs text-neutral-500">アクティブなタレントだけ選べます</p>}
            </div>

            <div>
              <label htmlFor="new-app-job" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-neutral-900">
                案件
                <span className="rounded bg-red-600 px-1.5 py-px text-[10px] font-semibold leading-4 text-white">必須</span>
              </label>
              <SearchableSelect
                id="new-app-job"
                name="jobId"
                placeholder="案件名で探す"
                options={jobOptions}
                value={job}
                onChange={(o) => {
                  setJob(o)
                  setErrors((e) => ({ ...e, jobId: "", form: "" }))
                }}
                invalid={Boolean(errors.jobId)}
                describedBy={errors.jobId ? "new-app-jobId-error" : undefined}
              />
              {fieldError("jobId")}
              {!errors.jobId && <p className="mt-1.5 text-xs text-neutral-500">募集中の案件だけ選べます</p>}
            </div>

            <div>
              <label htmlFor="new-app-note" className="mb-1.5 block text-sm font-medium text-neutral-900">
                備考
              </label>
              <textarea id="new-app-note" name="note" rows={3} placeholder="社内用のメモ（任意）" className={`${FIELD} h-auto py-2 leading-relaxed`} />
            </div>

            {errors.form && (
              <p role="alert" className="flex items-start gap-1.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {errors.form}
              </p>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" className={BTN_SECONDARY} onClick={() => setOpen(false)}>
                キャンセル
              </button>
              <button type="submit" disabled={isPending} className={`${BTN_PRIMARY} sm:px-6`}>
                {isPending ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden="true" />
                    登録中…
                  </>
                ) : (
                  "応募を登録する"
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
