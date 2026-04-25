"use client"

import { useState, useTransition, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Receipt, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createInvoice } from "@/lib/actions/invoice"

type ProductionCompanyOption = {
  id: string
  companyName: string
}

function formatDateInput(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function getNextMonthEnd(): string {
  const now = new Date()
  const next = new Date(now.getFullYear(), now.getMonth() + 2, 0)
  return formatDateInput(next)
}

export function InvoiceCreateDialog({
  applicationId,
  jobTitle,
  jobFee,
  talentName,
  productionCompanies,
}: {
  applicationId: string
  jobTitle: string
  jobFee: number | null
  talentName: string
  productionCompanies: ProductionCompanyOption[]
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState("")
  const [taxRate, setTaxRate] = useState("10")
  const [companySearch, setCompanySearch] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const filteredCompanies = companySearch
    ? productionCompanies.filter((c) =>
        c.companyName.toLowerCase().includes(companySearch.toLowerCase())
      )
    : productionCompanies

  const selectedCompany = productionCompanies.find((c) => c.id === companyId)

  useEffect(() => {
    if (open) {
      setError(null)
      setCompanySearch("")
      setCompanyId("")
      setShowDropdown(false)
    }
  }, [open])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    const subject = formData.get("subject") as string
    const description = formData.get("description") as string
    const amount = parseInt(formData.get("amount") as string, 10)
    const parsedTaxRate = parseInt(taxRate, 10)
    const issueDate = formData.get("issueDate") as string
    const dueDate = formData.get("dueDate") as string

    if (!companyId) {
      setError("制作会社を選択してください")
      return
    }
    if (!amount || amount <= 0) {
      setError("金額を正しく入力してください")
      return
    }

    startTransition(async () => {
      const result = await createInvoice({
        applicationId,
        productionCompanyId: companyId,
        subject,
        description,
        amount,
        taxRate: parsedTaxRate,
        issueDate,
        dueDate,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="xs" className="gap-1">
            <Receipt className="h-3.5 w-3.5" />
            請求書作成
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>請求書作成</DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {talentName} / {jobTitle}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2" ref={dropdownRef}>
            <Label>制作会社 *</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="会社名で検索..."
                value={companyId ? (selectedCompany?.companyName ?? "") : companySearch}
                onChange={(e) => {
                  setCompanySearch(e.target.value)
                  setCompanyId("")
                  setShowDropdown(true)
                }}
                onFocus={() => setShowDropdown(true)}
                className="pl-8"
              />
              {showDropdown && (
                <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border bg-popover shadow-md">
                  {filteredCompanies.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">該当なし</div>
                  ) : (
                    filteredCompanies.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors ${
                          companyId === c.id ? "bg-accent font-medium" : ""
                        }`}
                        onClick={() => {
                          setCompanyId(c.id)
                          setCompanySearch("")
                          setShowDropdown(false)
                        }}
                      >
                        {c.companyName}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <a
              href="/admin/production-companies/new"
              target="_blank"
              className="text-xs text-primary hover:underline"
            >
              新しい制作会社を登録
            </a>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inv-subject">件名</Label>
            <Input
              id="inv-subject"
              name="subject"
              defaultValue={jobTitle}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inv-description">品目・説明</Label>
            <Textarea
              id="inv-description"
              name="description"
              rows={2}
              defaultValue={`${jobTitle} 出演料（${talentName}）`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inv-amount">金額（税抜）*</Label>
              <Input
                id="inv-amount"
                name="amount"
                type="number"
                min={1}
                defaultValue={jobFee ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-taxRate">税率（%）</Label>
              <Select value={taxRate} onValueChange={(v) => setTaxRate(v ?? "10")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10%</SelectItem>
                  <SelectItem value="8">8%</SelectItem>
                  <SelectItem value="0">0%（非課税）</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inv-issueDate">請求日</Label>
              <Input
                id="inv-issueDate"
                name="issueDate"
                type="date"
                defaultValue={formatDateInput(new Date())}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-dueDate">支払期日</Label>
              <Input
                id="inv-dueDate"
                name="dueDate"
                type="date"
                defaultValue={getNextMonthEnd()}
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isPending} className="gap-1">
              <Receipt className="h-4 w-4" />
              {isPending ? "発行中..." : "Freeeで請求書を発行"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
