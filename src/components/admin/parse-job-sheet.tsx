"use client"

import { useState, useTransition } from "react"
import { AlertCircle, FileText, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { BTN_GHOST, BTN_PRIMARY, BTN_SECONDARY, FIELD } from "@/components/admin/styles"
import { ParsedResultForm } from "@/components/admin/parsed-result-form"
import { parseJobText } from "@/lib/actions/parse-job"
import type { ParseResult } from "@/lib/validations/parsed-job"

export function ParseJobSheet({ className = BTN_SECONDARY }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState("")
  const [result, setResult] = useState<ParseResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isParsing, startTransition] = useTransition()

  const handleParse = () => {
    setError(null)
    startTransition(async () => {
      const res = await parseJobText(text)
      if (res.success) {
        setResult(res.data)
      } else {
        setError(res.error)
      }
    })
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
    setText("")
  }

  const handleClose = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setResult(null)
      setError(null)
      setText("")
    }
  }

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => setOpen(true)}
        title="キャスティング会社からのメールなどを貼り付けると、案件の内容を自動で読み取ります"
      >
        <FileText aria-hidden="true" />
        テキストから登録
      </button>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-h-[90dvh] gap-0 overflow-y-auto bg-white p-6 sm:max-w-2xl">
          <DialogTitle className="text-lg font-semibold">テキストから案件を登録</DialogTitle>
          <DialogDescription className="mt-1.5 text-sm text-neutral-500">
            {result
              ? `読み取った内容を確認・修正してから登録してください（${result.jobs.length}件の役柄）。`
              : "キャスティング会社からのメールやメッセージを貼り付けて「読み取る」を押すと、案件名・日程・報酬などを自動で読み取ります。"}
          </DialogDescription>

          {!result ? (
            <div className="mt-5 space-y-4">
              <label htmlFor="parse-job-text" className="sr-only">
                メール・メッセージの本文
              </label>
              <textarea
                id="parse-job-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="ここにメール・メッセージの本文を貼り付けてください"
                rows={14}
                className={`${FIELD} h-auto py-2.5 leading-relaxed`}
              />
              {error && (
                <p role="alert" className="flex items-start gap-1.5 break-all rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {error}
                </p>
              )}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" className={BTN_SECONDARY} onClick={() => handleClose(false)}>
                  キャンセル
                </button>
                <button type="button" className={BTN_PRIMARY} onClick={handleParse} disabled={isParsing || !text.trim()}>
                  {isParsing ? (
                    <>
                      <Loader2 className="animate-spin" aria-hidden="true" />
                      読み取り中…
                    </>
                  ) : (
                    "読み取る"
                  )}
                </button>
              </div>
              {isParsing && (
                <p role="status" className="text-right text-xs text-neutral-500">
                  内容によっては数十秒ほどかかります。このままお待ちください。
                </p>
              )}
            </div>
          ) : (
            <div className="mt-5">
              <div className="mb-4 flex justify-end">
                <button type="button" className={BTN_GHOST} onClick={handleReset}>
                  貼り付けからやり直す
                </button>
              </div>
              <ParsedResultForm data={result} onSuccess={() => handleClose(false)} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
