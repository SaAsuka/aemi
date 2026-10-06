import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowRight, ChevronLeft, FileText, Mail, Phone } from "lucide-react"
import { getProductionCompany } from "@/lib/actions/production-company"
import { DeleteButton } from "@/components/admin/delete-button"
import { CompanyEditSheet } from "@/components/admin/company-edit-sheet"
import { CompanyMark } from "@/components/admin/company-mark"
import { StatusChip, type ChipTone } from "@/components/admin/status-chip"
import { BTN_PRIMARY, PANEL } from "@/components/admin/styles"
import { formatDate } from "@/lib/utils/date"

const DANGER_BUTTON =
  "inline-flex h-9 items-center justify-center rounded-lg border border-red-300 bg-white px-4 text-sm font-medium text-red-600 transition-colors hover:border-red-400 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/30"

const INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "下書き",
  ISSUED: "発行済",
  SENT: "送付済",
  PAID: "入金済",
  CANCELLED: "取消",
}
// 色の意味は従来と同じ：下書き＝グレー・発行済＝青・送付済＝黄・入金済＝緑・取消＝赤
const INVOICE_TONE: Record<string, ChipTone> = { DRAFT: "gray", ISSUED: "blue", SENT: "yellow", PAID: "green", CANCELLED: "red" }

const yen = (n: number) => `¥${n.toLocaleString()}`

function Section({
  title,
  count,
  description,
  action,
  children,
}: {
  title: string
  count?: number
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className={`${PANEL} p-5 sm:p-6`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-base font-semibold text-neutral-950">{title}</h2>
            {count !== undefined && <span className="text-sm text-neutral-500">{count}</span>}
          </div>
          {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-neutral-500">{label}</dt>
      <dd className="mt-1 text-neutral-950">{children}</dd>
    </div>
  )
}

const Empty = () => <span className="text-neutral-400">未登録</span>

export default async function ProductionCompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const company = await getProductionCompany(id)

  if (!company) notFound()

  const invoices = company.invoices
  const sum = (statuses: string[]) => invoices.filter((i) => statuses.includes(i.status)).reduce((a, i) => a + i.amount, 0)
  const unpaid = sum(["ISSUED", "SENT"])
  const facts = [
    { label: "請求書", value: `${invoices.length}件`, note: null },
    { label: "入金待ち（発行済・送付済）", value: yen(unpaid), note: unpaid > 0 ? "text-blue-700" : null },
    { label: "入金済み", value: yen(sum(["PAID"])), note: null },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-4">
      <Link
        href="/admin/production-companies"
        className="-ml-1 inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 text-sm text-neutral-500 transition-colors hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        制作会社管理
      </Link>

      {/* 会社名・freee・連絡先 */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <CompanyMark name={company.companyName} className="size-14 rounded-xl text-xl" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {company.freeePartnerId ? (
                <StatusChip tone="green" label="freee連携済み" />
              ) : (
                <span className="inline-flex h-6 items-center rounded-full border border-neutral-300 px-2.5 text-xs text-neutral-500">freee 未連携</span>
              )}
            </div>
            <h1 className="mt-2 text-xl font-semibold leading-snug tracking-tight text-neutral-950 sm:text-2xl">{company.companyName}</h1>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-neutral-700">
              <span>{company.contactName ?? <span className="text-neutral-400">担当者 未登録</span>}</span>
              {company.contactEmail && (
                <a href={`mailto:${company.contactEmail}`} className="inline-flex min-w-0 items-center gap-1.5 underline-offset-4 hover:text-neutral-950 hover:underline">
                  <Mail className="size-4 shrink-0 text-neutral-400" aria-hidden="true" />
                  <span className="truncate">{company.contactEmail}</span>
                </a>
              )}
              {company.contactPhone && (
                <a
                  href={`tel:${company.contactPhone.replace(/[^\d+]/g, "")}`}
                  className="inline-flex items-center gap-1.5 tabular-nums underline-offset-4 hover:text-neutral-950 hover:underline"
                >
                  <Phone className="size-4 shrink-0 text-neutral-400" aria-hidden="true" />
                  {company.contactPhone}
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="shrink-0">
          <CompanyEditSheet company={company} className={`${BTN_PRIMARY} h-10 w-full sm:h-9 sm:w-auto`} />
        </div>
      </div>

      {/* 請求の状況 */}
      <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-neutral-200 bg-neutral-200 sm:grid-cols-3">
        {facts.map((f) => (
          <div key={f.label} className="flex items-baseline justify-between bg-white px-4 py-3 sm:block sm:px-5 sm:py-3.5">
            <dt className="text-xs text-neutral-500">{f.label}</dt>
            <dd className={`text-lg font-semibold tabular-nums tracking-tight sm:mt-1 ${f.note ?? "text-neutral-950"}`}>{f.value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Section
          title="請求書"
          count={invoices.length}
          description="この会社あての請求書です。新しい順に並んでいます。"
          action={
            invoices.length > 0 ? (
              <Link
                href="/admin/invoices"
                className="inline-flex shrink-0 items-center gap-1 rounded-md text-sm font-medium text-neutral-700 underline-offset-4 hover:text-neutral-950 hover:underline"
              >
                請求書管理へ
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            ) : null
          }
        >
          {invoices.length === 0 ? (
            <div className="rounded-lg bg-neutral-50 px-4 py-10 text-center">
              <FileText className="mx-auto size-7 text-neutral-300" aria-hidden="true" />
              <p className="mt-2 text-sm text-neutral-500">まだ請求書はありません。請求書は「請求書」のページから作成できます。</p>
            </div>
          ) : (
            <>
              {/* 広い画面：表 */}
              <table className="hidden w-full text-sm md:table">
                <thead>
                  <tr className="border-y border-neutral-200 bg-neutral-50 text-left text-xs text-neutral-500">
                    <th scope="col" className="px-3 py-2.5 font-medium">件名</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">状態</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">金額</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">発行日</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">支払期限</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="max-w-[18rem] px-3 py-3 align-middle">
                        <p className="truncate font-medium text-neutral-950">{inv.subject || inv.application.job.title}</p>
                        <p className="mt-0.5 truncate text-xs text-neutral-500">{inv.application.talent.name}</p>
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <StatusChip tone={INVOICE_TONE[inv.status] ?? "gray"} label={INVOICE_STATUS_LABELS[inv.status] ?? inv.status} />
                      </td>
                      <td
                        className={`px-3 py-3 text-right align-middle tabular-nums ${
                          inv.status === "CANCELLED" ? "text-neutral-400 line-through" : "font-medium text-neutral-950"
                        }`}
                      >
                        {yen(inv.amount)}
                      </td>
                      <td className="px-3 py-3 align-middle tabular-nums text-neutral-700">
                        {inv.issueDate ? formatDate(inv.issueDate) : <span className="text-neutral-400">−</span>}
                      </td>
                      <td className="px-3 py-3 align-middle tabular-nums text-neutral-700">
                        {inv.dueDate ? formatDate(inv.dueDate) : <span className="text-neutral-400">−</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* スマホ：一覧 */}
              <ul className="-mx-5 divide-y divide-neutral-100 border-t border-neutral-100 md:hidden">
                {invoices.map((inv) => (
                  <li key={inv.id} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-snug text-neutral-950">{inv.subject || inv.application.job.title}</p>
                        <p className="mt-0.5 text-xs text-neutral-500">{inv.application.talent.name}</p>
                      </div>
                      <StatusChip tone={INVOICE_TONE[inv.status] ?? "gray"} label={INVOICE_STATUS_LABELS[inv.status] ?? inv.status} />
                    </div>
                    <div className="mt-1.5 flex items-baseline justify-between gap-3 text-xs text-neutral-500">
                      <span className="tabular-nums">
                        {inv.issueDate ? `発行 ${formatDate(inv.issueDate)}` : "未発行"}
                        {inv.dueDate && ` ・ 期限 ${formatDate(inv.dueDate)}`}
                      </span>
                      <span
                        className={`text-sm tabular-nums ${inv.status === "CANCELLED" ? "text-neutral-400 line-through" : "font-medium text-neutral-950"}`}
                      >
                        {yen(inv.amount)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Section>

        <aside className="min-w-0">
          <Section title="会社の情報">
            <dl className="space-y-4 text-sm">
              <Info label="住所">
                {company.zipCode || company.address ? (
                  <>
                    {company.zipCode && <span className="block tabular-nums">〒{company.zipCode}</span>}
                    {company.address && <span className="block leading-relaxed">{company.address}</span>}
                  </>
                ) : (
                  <Empty />
                )}
              </Info>
              <Info label="担当者">{company.contactName ?? <Empty />}</Info>
              <Info label="メールアドレス">
                {company.contactEmail ? <span className="break-all">{company.contactEmail}</span> : <Empty />}
              </Info>
              <Info label="電話番号">{company.contactPhone ? <span className="tabular-nums">{company.contactPhone}</span> : <Empty />}</Info>
              {company.note && (
                <Info label="備考（社内用）">
                  <span className="whitespace-pre-wrap leading-relaxed">{company.note}</span>
                </Info>
              )}
              <Info label="freee">
                {company.freeePartnerId ? (
                  <>
                    連携済み<span className="ml-1.5 text-xs tabular-nums text-neutral-500">取引先ID {company.freeePartnerId}</span>
                  </>
                ) : (
                  <span className="text-neutral-500">未連携</span>
                )}
              </Info>
              <Info label="登録日">
                <span className="tabular-nums">{formatDate(company.createdAt)}</span>
              </Info>
            </dl>
          </Section>
        </aside>
      </div>

      {/* 削除はうっかり押さないよう、いちばん下に離して置く */}
      <section className="rounded-xl border border-red-200 bg-white p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6">
        <div>
          <h2 className="text-base font-semibold text-neutral-950">この制作会社を削除</h2>
          <p className="mt-1 text-sm text-neutral-500">
            {invoices.length > 0
              ? `請求書が${invoices.length}件あるため削除できません。`
              : company.freeePartnerId
                ? "削除すると元に戻せません。freeeの取引先は消えずに残ります。"
                : "削除すると元に戻せません。"}
          </p>
        </div>
        {invoices.length === 0 && (
          <DeleteButton
            id={company.id}
            type="production-company"
            label="削除する"
            className={`${DANGER_BUTTON} mt-4 w-full sm:mt-0 sm:w-auto`}
            confirmMessage={`「${company.companyName}」を削除します。\n元に戻せません。本当に削除しますか？`}
          />
        )}
      </section>
    </div>
  )
}
