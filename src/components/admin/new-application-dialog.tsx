"use client"

import { useState, useTransition, useMemo, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createApplication } from "@/lib/actions/application"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { ChevronDown } from "lucide-react"

function SearchableSelect({
  name,
  placeholder,
  options,
}: {
  name: string
  placeholder: string
  options: { value: string; label: string }[]
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<{ value: string; label: string } | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    if (!query) return options
    const q = query.toLowerCase()
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, query])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <input type="hidden" name={name} value={selected?.value ?? ""} />
      <button
        type="button"
        onClick={() => { setOpen(!open); setQuery("") }}
        className="flex w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-2 text-sm hover:bg-accent/50 transition-colors"
      >
        <span className={selected ? "" : "text-muted-foreground"}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg">
          <div className="p-2">
            <Input
              placeholder="検索..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="h-8"
            />
          </div>
          <div className="max-h-60 overflow-y-auto px-1 pb-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">該当なし</p>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => { setSelected(o); setOpen(false) }}
                  className="w-full text-left rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
                >
                  {o.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function NewApplicationDialog({
  talents,
  jobs,
}: {
  talents: { id: string; name: string; nameKana: string }[]
  jobs: { id: string; title: string }[]
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const talentOptions = useMemo(
    () => talents.map((t) => ({ value: t.id, label: `${t.name}（${t.nameKana}）` })),
    [talents]
  )
  const jobOptions = useMemo(
    () => jobs.map((j) => ({ value: j.id, label: j.title })),
    [jobs]
  )

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await createApplication(formData)
      if (result.error) {
        const firstError = Object.values(result.error)[0]
        setError(Array.isArray(firstError) ? firstError[0] : String(firstError))
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>新規応募</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>新規応募登録</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>タレント *</Label>
            <SearchableSelect name="talentId" placeholder="タレントを選択" options={talentOptions} />
          </div>

          <div className="space-y-2">
            <Label>案件 *</Label>
            <SearchableSelect name="jobId" placeholder="案件を選択" options={jobOptions} />
          </div>

          <div className="space-y-2">
            <Label>備考</Label>
            <Textarea name="note" />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "登録中..." : "登録"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
