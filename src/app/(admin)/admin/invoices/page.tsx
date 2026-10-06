import Link from "next/link"
import { AlertTriangle, ArrowRight, FileText } from "lucide-react"
import { getInvoices } from "@/lib/actions/invoice"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusChip, type ChipTone } from "@/components/admin/status-chip"
import { BTN_SECONDARY, PANEL } from "@/components/admin/styles"
import { formatDate } from "@/lib/utils/date"

const STATUS_TABS = [
  { value: "ALL", label: "すべて" },
  { value: "DRAFT", label: "下書き" },
  { value: "ISSUED", label: "発行済" },
  { value: "SENT", label: "送付済" },
  { value: "PAID", label: "入金済" },
  { value: "CANCELLED", label: "取消" },
]
const STATUS_LABELS: Record<string, string> = Object.fromEntries(STATUS_TABS.map((t) => [t.value, t.label]))
// 色の意味は従来と同じ：下書き＝グレー・発行済＝青・送付済＝黄・入金済＝緑・取消＝赤
const STATUS_TONE: Record<string, ChipTone> = { DRAFT: "gray", ISSUED: "blue", SENT: "yellow", PAID: "green", CANCELLED: "red" }
// 入金を待っている状態
const WAITING = ["ISSUED", "SENT"]

const HEAD = "-top-3 h-11 bg-neutral-50 px-4 text-xs font-medium text-neutral-500 sm:-top-6"
const CELL = "px-4 py-3 align-middle"

const yen = (n: number) => `¥${n.toLocaleString()}`
const withTax = (amount: number, taxRate: number) => amount + Math.floor((amount * taxRate) / 100)

// 支払期限まであと何日か（日本時間の日付で数える。過ぎていればマイナス）
function daysUntil(date: Date) {
  const toJstDay = (d: Date) => Math.floor((d.getTime() + 9 * 60 * 60 * 1000) / 86_400_000)
  return toJstDay(date) - toJstDay(new Date())
}

type Invoice = Awaited<ReturnType<typeof getInvoices>>[number]

function DueDate({ inv }: { inv: Invoice }) {
  if (!inv.dueDate) return <span className="text-neutral-400">−</span>
  const days = WAITING.includes(inv.status) ? daysUntil(inv.dueDate) : null
  return (
    <span className="block">
      <span className={`tabular-nums ${days !== null && days < 0 ? "font-medium text-red-600" : "text-neutral-700"}`}>
        {formatDate(inv.dueDate)}
      </span>
      {days !== null && days < 0 && <span className="mt-0.5 block text-xs font-medium text-red-600">{-days}日過ぎています</span>}
      {days !== null && days >= 0 && days <= 7 && (
        <span className="mt-0.5 block text-xs text-neutral-500">{days === 0 ? "今日が期限" : `あと${days}日`}</span>
      )}
    </span>
  )
}

function Amount({ inv, align = "right" }: { inv: Invoice; align?: "right" | "left" }) {
  const cancelled = inv.status === "CANCELLED"
  return (
    <span className={`block ${align === "right" ? "text-right" : ""}`}>
      <span className={`tabular-nums ${cancelled ? "text-neutral-400 line-through" : "font-medium text-neutral-950"}`}>
        {yen(withTax(inv.amount, inv.taxRate))}
      </span>
      <span className="mt-0.5 block text-xs tabular-nums text-neutral-400">税抜 {yen(inv.amount)}</span>
    </span>
  )
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  // 件数と合計を出すため、いったん全件を取ってからこの画面で絞り込む
  const all = await getInvoices()
  const activeStatus = status && STATUS_LABELS[status] ? status : "ALL"
  const invoices = activeStatus === "ALL" ? all : all.filter((i) => i.status === activeStatus)

  const countOf = (s: string) => (s === "ALL" ? all.length : all.filter((i) => i.status === s).length)
  const waiting = all.filter((i) => WAITING.includes(i.status))
  const overdue = waiting.filter((i) => i.dueDate && daysUntil(i.dueDate) < 0)
  const paid = all.filter((i) => i.status === "PAID")
  const total = (list: Invoice[]) => list.reduce((a, i) => a + withTax(i.amount, i.taxRate), 0)

  const summary = [
    { label: "入金待ち（発行済・送付済）", value: yen(total(waiting)), sub: `${waiting.length}件`, alert: false },
    { label: "うち支払期限を過ぎたもの", value: yen(total(overdue)), sub: `${overdue.length}件`, alert: overdue.length > 0 },
    { label: "入金済み", value: yen(total(paid)), sub: `${paid.length}件`, alert: false },
  ]

  const subjectOf = (inv: Invoice) => inv.subject || inv.application.job.title
  const tabHref = (value: string) => (value === "ALL" ? "/admin/invoices" : `/admin/invoices?status=${value}`)
  const chip = (inv: Invoice) => <StatusChip tone={STATUS_TONE[inv.status] ?? "gray"} label={STATUS_LABELS[inv.status] ?? inv.status} />

  return (
    <div className="space-y-6 pb-4">
      {/* 見出し */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">請求書管理</h1>
        <p className="mt-1 text-sm text-neutral-500">
          制作会社あてに発行した請求書です。
          <span className="inline-block">請求書は「応募管理」で合格した応募から作成できます。金額は税込です。</span>
        </p>
      </div>

      {/* 入金の状況 */}
      <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-neutral-200 bg-neutral-200 sm:grid-cols-3">
        {summary.map((s) => (
          <div key={s.label} className="flex items-baseline justify-between gap-3 bg-white px-4 py-3 sm:block sm:px-5 sm:py-4">
            <dt className={`flex items-center gap-1 text-xs ${s.alert ? "font-medium text-red-600" : "text-neutral-500"}`}>
              {s.alert && <AlertTriangle className="size-3.5" aria-hidden="true" />}
              {s.label}
            </dt>
            <dd className="text-right sm:mt-1 sm:text-left">
              <span className={`text-lg font-semibold tabular-nums tracking-tight sm:text-xl ${s.alert ? "text-red-600" : "text-neutral-950"}`}>
                {s.value}
              </span>
              <span className="ml-1.5 text-xs text-neutral-500">{s.sub}</span>
            </dd>
          </div>
        ))}
      </dl>

      {/* 状態で絞り込む */}
      <nav aria-label="状態で絞り込む" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5">
        {STATUS_TABS.map((tab) => {
          const active = tab.value === activeStatus
          const count = countOf(tab.value)
          return (
            <Link
              key={tab.value}
              href={tabHref(tab.value)}
              aria-current={active ? "page" : undefined}
              className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30 ${
                active ? "bg-neutral-950 font-medium text-white" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
              }`}
            >
              {tab.label}
              <span className={`text-xs tabular-nums ${active ? "text-white/70" : "text-neutral-400"}`}>{count}</span>
            </Link>
          )
        })}
      </nav>

      {/* 一覧 */}
      <section aria-label="請求書一覧" className={`${PANEL} overflow-clip`}>
        {invoices.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <FileText className="mx-auto size-8 text-neutral-300" aria-hidden="true" />
            {activeStatus !== "ALL" ? (
              <>
                <p className="mt-4 text-sm font-medium text-neutral-950">「{STATUS_LABELS[activeStatus]}」の請求書はありません</p>
                <Link href="/admin/invoices" className={`${BTN_SECONDARY} mt-6`}>
                  すべての請求書を見る
                </Link>
              </>
            ) : (
              <>
                <p className="mt-4 text-sm font-medium text-neutral-950">まだ請求書がありません</p>
                <p className="mt-1 text-sm text-neutral-500">「応募管理」で合格にした応募の「請求書作成」から発行できます。</p>
                <Link href="/admin/applications?status=ACCEPTED" className={`${BTN_SECONDARY} mt-6`}>
                  合格した応募を見る
                  <ArrowRight aria-hidden="true" />
                </Link>
              </>
            )}
          </div>
        ) : (
          <>
            {/* 広い画面：表 */}
            <div className="hidden xl:block">
              <Table>
                <TableHeader className="[&_tr]:border-neutral-200">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className={HEAD}>件名</TableHead>
                    <TableHead className={HEAD}>制作会社</TableHead>
                    <TableHead className={HEAD}>状態</TableHead>
                    <TableHead className={`${HEAD} text-right`}>金額（税込）</TableHead>
                    <TableHead className={HEAD}>発行日</TableHead>
                    <TableHead className={HEAD}>支払期限</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id} className="border-neutral-100 hover:bg-neutral-50">
                      <TableCell className={`${CELL} max-w-[22rem] whitespace-normal`}>
                        <p className="text-sm font-medium leading-snug text-neutral-950">{subjectOf(inv)}</p>
                        <p className="mt-0.5 text-xs text-neutral-500">
                          {inv.application.talent.name}
                          {inv.freeeInvoiceNumber && <span className="ml-2 font-mono text-neutral-400">No. {inv.freeeInvoiceNumber}</span>}
                        </p>
                      </TableCell>
                      <TableCell className={`${CELL} max-w-[16rem] whitespace-normal`}>
                        <Link
                          href={`/admin/production-companies/${inv.productionCompany.id}`}
                          className="text-sm text-neutral-950 underline-offset-4 hover:underline"
                        >
                          {inv.productionCompany.companyName}
                        </Link>
                      </TableCell>
                      <TableCell className={CELL}>{chip(inv)}</TableCell>
                      <TableCell className={CELL}>
                        <Amount inv={inv} />
                      </TableCell>
                      <TableCell className={`${CELL} tabular-nums text-neutral-700`}>
                        {inv.issueDate ? formatDate(inv.issueDate) : <span className="text-neutral-400">未発行</span>}
                      </TableCell>
                      <TableCell className={CELL}>
                        <DueDate inv={inv} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* スマホ・タブレット・狭いPC：カード */}
            <ul className="divide-y divide-neutral-100 xl:hidden">
              {invoices.map((inv) => (
                <li key={inv.id} className="px-4 py-4 sm:px-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug text-neutral-950">{subjectOf(inv)}</p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        <Link
                          href={`/admin/production-companies/${inv.productionCompany.id}`}
                          className="text-neutral-700 underline-offset-4 hover:underline"
                        >
                          {inv.productionCompany.companyName}
                        </Link>
                        <span className="mx-1.5 text-neutral-300">／</span>
                        {inv.application.talent.name}
                      </p>
                    </div>
                    {chip(inv)}
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <dl className="grid grid-cols-2 gap-x-5 text-xs">
                      <div>
                        <dt className="text-neutral-500">発行日</dt>
                        <dd className="mt-0.5 tabular-nums text-neutral-700">
                          {inv.issueDate ? formatDate(inv.issueDate) : <span className="text-neutral-400">未発行</span>}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-neutral-500">支払期限</dt>
                        <dd className="mt-0.5">
                          <DueDate inv={inv} />
                        </dd>
                      </div>
                    </dl>
                    <div className="text-sm">
                      <Amount inv={inv} />
                    </div>
                  </div>
                  {inv.freeeInvoiceNumber && (
                    <p className="mt-2 font-mono text-[11px] text-neutral-400">No. {inv.freeeInvoiceNumber}</p>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  )
}
