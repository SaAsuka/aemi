"use client"

import { useState, useTransition } from "react"
import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ParsedResultForm } from "@/components/admin/parsed-result-form"
import { parseJobText } from "@/lib/actions/parse-job"
import type { ParseResult } from "@/lib/validations/parsed-job"

export function ParseJobSheet() {
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger render={<Button variant="outline" />}>
        <FileText className="h-4 w-4" />
        テキストから登録
      </DialogTrigger>
      <DialogContent className="overflow-y-auto max-h-[85vh] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>テキストから案件登録</DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>メール・メッセージを貼り付け</Label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="キャスティング会社からのメール・Slackメッセージをここに貼り付けてください..."
                rows={15}
              />
            </div>
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 break-all">
                {error}
              </div>
            )}
            <Button onClick={handleParse} disabled={isParsing || !text.trim()}>
              {isParsing ? "解析中..." : "解析する"}
            </Button>
          </div>
        ) : (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">
                解析結果を確認・修正してください（{result.jobs.length}役柄）
              </p>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                やり直す
              </Button>
            </div>
            <ParsedResultForm
              data={result}
              onSuccess={() => handleClose(false)}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
