"use client"

import { useState, useTransition } from "react"
import { FileText } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ParsedResultForm } from "@/components/admin/parsed-result-form"
import { parseJobText } from "@/lib/actions/parse-job"
import type { ParseResult } from "@/lib/validations/parsed-job"

type ClientOption = { id: string; companyName: string }
type TalentOption = { id: string; name: string; nameKana: string }

export function ParseJobSheet({
  clientOptions,
  talentOptions,
}: {
  clientOptions: ClientOption[]
  talentOptions: TalentOption[]
}) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState("")
  const [result, setResult] = useState<ParseResult | null>(null)
  const [isParsing, startTransition] = useTransition()

  const handleParse = () => {
    startTransition(async () => {
      const res = await parseJobText(text)
      if (res.success) {
        setResult(res.data)
      } else {
        toast.error(res.error)
      }
    })
  }

  const handleReset = () => {
    setResult(null)
    setText("")
  }

  const handleClose = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setResult(null)
      setText("")
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetTrigger render={<Button variant="outline" />}>
        <FileText className="h-4 w-4" />
        テキストから登録
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-[70vw] p-6">
        <SheetHeader>
          <SheetTitle>テキストから案件登録</SheetTitle>
        </SheetHeader>

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
            <Button onClick={handleParse} disabled={isParsing || !text.trim()}>
              {isParsing ? "解析中..." : "解析する"}
            </Button>
          </div>
        ) : (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">解析結果を確認・修正してください</p>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                やり直す
              </Button>
            </div>
            <ParsedResultForm
              data={result}
              clientOptions={clientOptions}
              talentOptions={talentOptions}
              onSuccess={() => handleClose(false)}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
