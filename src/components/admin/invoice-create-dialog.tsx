"use client"

import { useState, useTransition, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AlertCircle, AlertTriangle, ArrowUpRight, Check, ChevronDown, Loader2, Receipt, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { BTN_PRIMARY, BTN_SECONDARY, FIELD } from "@/components/admin/styles"
import { createInvoice } from "@/lib/actions/invoice"

type ProductionCompanyOption = {
  id: string
  companyName: string
}

const Required = () => (
  <span className="rounded bg-red-600 px-1.5 py-px text-[10px] font-semibold leading-4 text-white">必須</span>
)

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
  existingInvoice = null,
  triggerClassName,
}: {
  applicationId: string
  jobTitle: string
  jobFee: number | null
  talentName: string
  productionCompanies: ProductionCompanyOption[]
  // この応募にすでにある請求書（取消以外）。新しく作ると、これは取消になる
  existingInvoice?: { status: string; freeeInvoiceNumber: string | null } | null
  // ボタンの見た目を画面ごとに変えたいとき用（未指定なら従来どおり）
  triggerClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState("")
  const [taxRate, setTaxRate] = useState("10")
  // 税込の請求額を見せるためだけに持つ（送る金額は従来どおりフォームの値を使う）
  const [amountInput, setAmountInput] = useState(jobFee ?? 0)
  const [companySearch, setCompanySearch] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)
  const router = useRouter()

  const filteredCompanies = companySearch
    ? productionCompanies.filter((c) =>
        c.companyName.toLowerCase().includes(companySearch.toLowerCase())
      )
    : productionCompanies

  const selectedCompany = productionCompanies.find((c) => c.id === companyId)

  // 開くたびに前回の入力・エラーを消す
  function handleOpenChange(next: boolean) {
    if (next) {
      setError(null)
      setCompanySearch("")
      setCompanyId("")
      setShowDropdown(false)
      setAmountInput(jobFee ?? 0)
    }
    setOpen(next)
  }

  // エラーが出たら、下の固定ボタンに隠れないよう見える位置まで動かす
  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [error])

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
    if (!issueDate || !dueDate) {
      setError("請求日と支払期日を入れてください")
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

      toast.success("請求書を発行しました", {
        description: existingInvoice
          ? `${talentName}さん ／ ${jobTitle}。前の請求書は「取消」にしました。`
          : `${talentName}さん ／ ${jobTitle}`,
      })
      setOpen(false)
      router.refresh()
    })
  }

  const total = amountInput > 0 ? amountInput + Math.floor((amountInput * Number(taxRate)) / 100) : null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="outline" size="xs" className={`gap-1 ${triggerClassName ?? ""}`}>
            <Receipt className="h-3.5 w-3.5" />
            請求書作成
          </Button>
        }
      />
      <DialogContent className="max-h-[90dvh] gap-0 overflow-y-auto bg-white p-6 sm:max-w-lg">
        <DialogTitle className="text-lg font-semibold">請求書を発行</DialogTitle>
        <DialogDescription className="mt-1.5 text-sm text-neutral-500">
          {talentName}さん ／ {jobTitle}
        </DialogDescription>

        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-5">
          {/* 作り直すと前の請求書は取消になる。押す前に知らせる */}
          {existingInvoice && (
            <p className="flex items-start gap-2 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2.5 text-sm leading-relaxed text-yellow-900">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                この応募には請求書がすでにあります
                {existingInvoice.freeeInvoiceNumber ? `（No. ${existingInvoice.freeeInvoiceNumber}）` : ""}
                。新しく発行すると、前の請求書はこのシステム上で「取消」になります。freeeの請求書は取り消されないので、必要ならfreeeで取り消してください。
              </span>
            </p>
          )}

          {/* 宛先 */}
          <div ref={dropdownRef}>
            <label htmlFor="inv-company" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-neutral-900">
              請求先の制作会社
              <Required />
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
              <input
                id="inv-company"
                role="combobox"
                aria-expanded={showDropdown}
                aria-controls="inv-company-list"
                autoComplete="off"
                placeholder="会社名で探す"
                value={companyId ? (selectedCompany?.companyName ?? "") : companySearch}
                onChange={(e) => {
                  setCompanySearch(e.target.value)
                  setCompanyId("")
                  setShowDropdown(true)
                }}
                // 小窓を開いたときに自動で入るカーソルでは候補を開かない（下の欄が隠れるため）
                onClick={() => setShowDropdown(true)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") setShowDropdown(true)
                  if (e.key === "Escape" && showDropdown) {
                    e.stopPropagation()
                    setShowDropdown(false)
                  }
                }}
                className={`${FIELD} pl-9 ${companyId ? "font-medium" : ""}`}
              />
              {companyId && (
                <Check className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-green-700" aria-label="選択済み" />
              )}
              {showDropdown && (
                <ul
                  id="inv-company-list"
                  role="listbox"
                  className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-neutral-200 bg-white p-1 shadow-lg"
                >
                  {filteredCompanies.length === 0 ? (
                    <li className="px-3 py-2.5 text-sm text-neutral-500">「{companySearch}」に合う会社がありません</li>
                  ) : (
                    filteredCompanies.map((c) => (
                      <li key={c.id} role="option" aria-selected={companyId === c.id}>
                        <button
                          type="button"
                          className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-100 ${
                            companyId === c.id ? "font-medium text-neutral-950" : "text-neutral-800"
                          }`}
                          onClick={() => {
                            setCompanyId(c.id)
                            setCompanySearch("")
                            setShowDropdown(false)
                          }}
                        >
                          {c.companyName}
                          {companyId === c.id && <Check className="size-4 shrink-0" aria-hidden="true" />}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
            <a
              href="/admin/production-companies/new"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-center gap-0.5 text-xs font-medium text-neutral-700 underline-offset-4 hover:text-neutral-950 hover:underline"
            >
              一覧に無い会社を登録する
              <ArrowUpRight className="size-3.5 text-neutral-400" aria-hidden="true" />
              <span className="sr-only">（新しいタブで開きます）</span>
            </a>
          </div>

          {/* 内容 */}
          <div>
            <label htmlFor="inv-subject" className="mb-1.5 block text-sm font-medium text-neutral-900">
              件名
            </label>
            <input id="inv-subject" name="subject" defaultValue={jobTitle} autoComplete="off" className={FIELD} />
          </div>
          <div>
            <label htmlFor="inv-description" className="mb-1.5 block text-sm font-medium text-neutral-900">
              品目・説明
            </label>
            <textarea
              id="inv-description"
              name="description"
              rows={2}
              defaultValue={`${jobTitle} 出演料（${talentName}）`}
              className={`${FIELD} h-auto py-2 leading-relaxed`}
            />
          </div>

          {/* 金額 */}
          <div className="grid grid-cols-[minmax(0,1fr)_8.5rem] gap-3">
            <div>
              <label htmlFor="inv-amount" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-neutral-900">
                金額（税抜）
                <Required />
              </label>
              <div className="relative">
                <input
                  id="inv-amount"
                  name="amount"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  defaultValue={jobFee ?? ""}
                  onInput={(e) => setAmountInput(Number(e.currentTarget.value) || 0)}
                  required
                  className={`${FIELD} pr-9 tabular-nums`}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">円</span>
              </div>
            </div>
            <div>
              <label htmlFor="inv-taxRate" className="mb-1.5 block text-sm font-medium text-neutral-900">
                税率
              </label>
              <div className="relative">
                <select
                  id="inv-taxRate"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className={`${FIELD} appearance-none pr-9`}
                >
                  <option value="10">10%</option>
                  <option value="8">8%</option>
                  <option value="0">0%（非課税）</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
              </div>
            </div>
          </div>
          <div className="flex items-baseline justify-between rounded-lg bg-neutral-50 px-4 py-3">
            <span className="text-sm text-neutral-600">請求額（税込）</span>
            <span className="text-lg font-semibold tabular-nums tracking-tight text-neutral-950">
              {total !== null ? `¥${total.toLocaleString()}` : "—"}
            </span>
          </div>

          {/* 日付 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="inv-issueDate" className="mb-1.5 block text-sm font-medium text-neutral-900">
                請求日
              </label>
              <input id="inv-issueDate" name="issueDate" type="date" defaultValue={formatDateInput(new Date())} required className={FIELD} />
            </div>
            <div>
              <label htmlFor="inv-dueDate" className="mb-1.5 block text-sm font-medium text-neutral-900">
                支払期日
              </label>
              <input id="inv-dueDate" name="dueDate" type="date" defaultValue={getNextMonthEnd()} required className={FIELD} />
            </div>
          </div>

          {error && (
            <p ref={errorRef} role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}

          <div className="sticky -bottom-6 z-10 -mx-6 -mb-6 flex flex-col-reverse gap-2 border-t border-neutral-200 bg-white px-6 py-3 sm:flex-row sm:justify-end">
            <button type="button" className={`${BTN_SECONDARY} h-10 sm:h-9`} onClick={() => handleOpenChange(false)}>
              キャンセル
            </button>
            <button type="submit" disabled={isPending} className={`${BTN_PRIMARY} h-10 sm:h-9 sm:px-6`}>
              {isPending ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  発行中…
                </>
              ) : (
                <>
                  <Receipt aria-hidden="true" />
                  freeeで請求書を発行
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
