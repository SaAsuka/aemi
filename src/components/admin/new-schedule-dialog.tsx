"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AlertCircle, ChevronDown, Loader2, Plus } from "lucide-react"
import { createSchedule } from "@/lib/actions/schedule"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { BTN_PRIMARY, BTN_SECONDARY, FIELD } from "@/components/admin/styles"

type AcceptedApp = {
  id: string
  talent: { name: string }
  job: { title: string }
}

const Required = () => (
  <span className="rounded bg-red-600 px-1.5 py-px text-[10px] font-semibold leading-4 text-white">必須</span>
)

export function NewScheduleDialog({
  applications,
  className = BTN_PRIMARY,
}: {
  applications: AcceptedApp[]
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const errs: Record<string, string> = {}
    if (!formData.get("applicationId")) errs.applicationId = "予定を入れる応募を選んでください"
    if (!formData.get("date")) errs.date = "日付を選んでください"
    const start = String(formData.get("startTime") ?? "")
    const end = String(formData.get("endTime") ?? "")
    if (start && end && start > end) errs.endTime = "終了は開始より後の時刻にしてください"
    setErrors(errs)
    if (Object.keys(errs).length) return
    const app = applications.find((a) => a.id === formData.get("applicationId"))
    startTransition(async () => {
      const result = await createSchedule(formData)
      if (result.error) {
        const next: Record<string, string> = {}
        for (const [k, v] of Object.entries(result.error)) {
          const msg = Array.isArray(v) ? v[0] : String(v)
          if (msg) next[k] = msg
        }
        setErrors(next)
        return
      }
      toast.success(app ? `${app.talent.name}さんの予定を登録しました` : "予定を登録しました")
      setOpen(false)
      router.refresh()
    })
  }

  const err = (key: string) =>
    errors[key] ? (
      <p className="mt-1.5 flex items-start gap-1 text-xs text-red-600">
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
          setErrors({})
          setOpen(true)
        }}
      >
        <Plus aria-hidden="true" />
        予定を登録
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 bg-white p-6 sm:max-w-lg">
          <DialogTitle className="text-lg font-semibold">予定を登録</DialogTitle>
          <DialogDescription className="mt-1.5 text-sm text-neutral-500">
            合格した応募に、撮影などの予定（日時・場所）を登録します。
          </DialogDescription>

          {applications.length === 0 ? (
            <div className="mt-5 space-y-4">
              <p className="rounded-lg bg-neutral-50 px-4 py-5 text-sm leading-relaxed text-neutral-600">
                予定を登録できる応募がありません。応募管理で「合格」にすると、ここで予定を登録できるようになります（すでに予定がある応募は出てきません）。
              </p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" className={BTN_SECONDARY} onClick={() => setOpen(false)}>
                  閉じる
                </button>
                <Link href="/admin/applications?status=ACCEPTED" className={BTN_PRIMARY}>
                  合格した応募を見る
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
              <div>
                <label htmlFor="ns-app" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-neutral-900">
                  応募（タレント・案件）
                  <Required />
                </label>
                <div className="relative">
                  <select
                    id="ns-app"
                    name="applicationId"
                    defaultValue=""
                    aria-invalid={Boolean(errors.applicationId) || undefined}
                    className={`${FIELD} appearance-none pr-9`}
                  >
                    <option value="">選んでください</option>
                    {applications.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.talent.name} − {a.job.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
                </div>
                {err("applicationId") ?? <p className="mt-1.5 text-xs text-neutral-500">合格していて、まだ予定がない応募だけが出てきます</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <label htmlFor="ns-date" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-neutral-900">
                    日付
                    <Required />
                  </label>
                  <input id="ns-date" name="date" type="date" aria-invalid={Boolean(errors.date) || undefined} className={FIELD} />
                  {err("date")}
                </div>
                <div>
                  <label htmlFor="ns-start" className="mb-1.5 block text-sm font-medium text-neutral-900">
                    開始
                  </label>
                  <input id="ns-start" name="startTime" type="time" className={FIELD} />
                </div>
                <div>
                  <label htmlFor="ns-end" className="mb-1.5 block text-sm font-medium text-neutral-900">
                    終了
                  </label>
                  <input id="ns-end" name="endTime" type="time" aria-invalid={Boolean(errors.endTime) || undefined} className={FIELD} />
                  {err("endTime")}
                </div>
              </div>

              <div>
                <label htmlFor="ns-location" className="mb-1.5 block text-sm font-medium text-neutral-900">
                  場所
                </label>
                <input id="ns-location" name="location" placeholder="例: 渋谷スタジオ" className={FIELD} />
              </div>

              <div>
                <label htmlFor="ns-note" className="mb-1.5 block text-sm font-medium text-neutral-900">
                  備考
                </label>
                <textarea id="ns-note" name="note" rows={3} placeholder="集合時間・持ち物など" className={`${FIELD} h-auto py-2 leading-relaxed`} />
              </div>

              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
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
                    "予定を登録する"
                  )}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
