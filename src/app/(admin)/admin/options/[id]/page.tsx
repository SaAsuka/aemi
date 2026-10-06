import { notFound } from "next/navigation"
import Link from "next/link"
import { AlertTriangle, ChevronLeft, ShoppingBag } from "lucide-react"
import { getOption } from "@/lib/actions/option"
import { DeleteButton } from "@/components/admin/delete-button"
import { OptionEditSheet } from "@/components/admin/option-edit-sheet"
import { StatusChip, type ChipTone } from "@/components/admin/status-chip"
import { BTN_PRIMARY, PANEL } from "@/components/admin/styles"
import { OPTION_CATEGORY_LABELS, OPTION_PURCHASE_STATUS_LABELS, OPTION_STATUS_LABELS } from "@/types"
import { formatDate, formatDeadline } from "@/lib/utils/date"
import { blobProxyUrl } from "@/lib/utils/blob"

const DANGER_BUTTON =
  "inline-flex h-9 items-center justify-center rounded-lg border border-red-300 bg-white px-4 text-sm font-medium text-red-600 transition-colors hover:border-red-400 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/30"

// 一覧と同じ色：公開中＝緑・下書き＝黄・終了＝グレー
const OPTION_STATUS_TONE: Record<string, ChipTone> = { ACTIVE: "green", DRAFT: "yellow", CLOSED: "gray" }
// 支払済＝緑・未払い（手続きの途中）＝黄・失敗＝赤・返金済＝グレー
const PURCHASE_TONE: Record<string, ChipTone> = { PAID: "green", PENDING: "yellow", FAILED: "red", REFUNDED: "gray" }

// 締切まであと何日か（日本時間の日付で数える）
function daysUntil(date: Date) {
  const toJstDay = (d: Date) => Math.floor((d.getTime() + 9 * 60 * 60 * 1000) / 86_400_000)
  return toJstDay(date) - toJstDay(new Date())
}
function isPast(date: Date) {
  return date.getTime() < Date.now()
}

function Section({
  title,
  count,
  description,
  children,
}: {
  title: string
  count?: number
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className={`${PANEL} p-5 sm:p-6`}>
      <div className="flex items-baseline gap-2">
        <h2 className="text-base font-semibold text-neutral-950">{title}</h2>
        {count !== undefined && <span className="text-sm text-neutral-500">{count}</span>}
      </div>
      {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

export default async function OptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const option = await getOption(id)

  if (!option) notFound()

  const purchases = option.purchases
  const count = (s: string) => purchases.filter((p) => p.status === s).length
  const paid = count("PAID")

  const deadline = option.deadline
  const active = option.status === "ACTIVE"
  const deadlineNote =
    deadline && active && !isPast(deadline)
      ? (() => {
          const d = daysUntil(deadline)
          return d <= 0 ? "今日まで" : d <= 3 ? `あと${d}日` : null
        })()
      : null

  const facts = [
    { label: "支払済み", value: `${paid}名` },
    { label: "未払い（手続きの途中）", value: `${count("PENDING")}名` },
    { label: "失敗・返金", value: `${count("FAILED") + count("REFUNDED")}名` },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-4">
      <Link
        href="/admin/options"
        className="-ml-1 inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 text-sm text-neutral-500 transition-colors hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        オプション管理
      </Link>

      {/* 画像・名前・状態・要点 */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {option.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={blobProxyUrl(option.imageUrl)}
              alt=""
              className="aspect-video w-24 shrink-0 rounded-lg border border-neutral-200 bg-neutral-100 object-cover sm:w-48 sm:rounded-xl"
            />
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip tone={OPTION_STATUS_TONE[option.status] ?? "gray"} label={OPTION_STATUS_LABELS[option.status] ?? option.status} />
              <span className="inline-flex h-6 items-center rounded-full border border-neutral-300 px-2.5 text-xs text-neutral-600">
                {OPTION_CATEGORY_LABELS[option.category] ?? option.category}
              </span>
            </div>
            <h1 className="mt-2 text-xl font-semibold leading-snug tracking-tight text-neutral-950 sm:text-2xl">{option.name}</h1>
            <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <div className="flex items-baseline gap-1.5">
                <dt className="text-neutral-500">価格</dt>
                <dd className="font-medium tabular-nums text-neutral-950">¥{option.price.toLocaleString()}</dd>
              </div>
              <div className="flex items-baseline gap-1.5">
                <dt className="text-neutral-500">申込締切</dt>
                <dd className="font-medium tabular-nums text-neutral-950">
                  {deadline ? formatDeadline(deadline) : "なし"}
                  {deadlineNote && <span className="ml-1.5 text-xs font-medium text-red-600">{deadlineNote}</span>}
                  {deadline && active && isPast(deadline) && <span className="ml-1.5 text-xs text-neutral-500">締切済み</span>}
                </dd>
              </div>
              <div className="flex items-baseline gap-1.5">
                <dt className="text-neutral-500">表示順</dt>
                <dd className="font-medium tabular-nums text-neutral-950">{option.sortOrder}</dd>
              </div>
            </dl>
          </div>
        </div>
        <div className="shrink-0">
          <OptionEditSheet option={option} hasPurchases={purchases.length > 0} className={`${BTN_PRIMARY} h-10 w-full sm:h-9 sm:w-auto`} />
        </div>
      </div>

      {/* 公開中なのに決済の準備ができていないと、タレントは買えない */}
      {active && !option.stripePriceId && (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm leading-relaxed text-yellow-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          公開中ですが、決済の準備（Stripe）ができていないため、タレントは購入できません。「編集」からもう一度保存してください。
        </p>
      )}

      {/* 購入の数 */}
      <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-neutral-200 bg-neutral-200 sm:grid-cols-3">
        {facts.map((f) => (
          <div key={f.label} className="flex items-baseline justify-between bg-white px-4 py-3 sm:block sm:px-5 sm:py-3.5">
            <dt className="text-xs text-neutral-500">{f.label}</dt>
            <dd className="text-lg font-semibold tracking-tight text-neutral-950 sm:mt-1">{f.value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Section title="購入したタレント" count={purchases.length} description="購入の手続きをしたタレントです。新しい順に並んでいます。">
          {purchases.length === 0 ? (
            <div className="rounded-lg bg-neutral-50 px-4 py-10 text-center">
              <ShoppingBag className="mx-auto size-7 text-neutral-300" aria-hidden="true" />
              <p className="mt-2 text-sm text-neutral-500">
                {active ? "まだ購入はありません。" : "まだ購入はありません。「公開中」にすると、タレントが購入できるようになります。"}
              </p>
            </div>
          ) : (
            <>
              {/* 広い画面：表 */}
              <table className="hidden w-full text-sm sm:table">
                <thead>
                  <tr className="border-y border-neutral-200 bg-neutral-50 text-left text-xs text-neutral-500">
                    <th scope="col" className="px-3 py-2.5 font-medium">タレント</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">支払い</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">支払日</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">申込日</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {purchases.map((p) => (
                    <tr key={p.id}>
                      <td className="px-3 py-3 align-middle">
                        <Link href={`/admin/talents/${p.talent.id}`} className="font-medium text-neutral-950 underline-offset-4 hover:underline">
                          {p.talent.name}
                        </Link>
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <StatusChip tone={PURCHASE_TONE[p.status] ?? "gray"} label={OPTION_PURCHASE_STATUS_LABELS[p.status] ?? p.status} />
                      </td>
                      <td className="px-3 py-3 align-middle tabular-nums text-neutral-950">
                        {p.paidAt ? formatDate(p.paidAt) : <span className="text-neutral-400">−</span>}
                      </td>
                      <td className="px-3 py-3 align-middle tabular-nums text-neutral-600">{formatDate(p.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* スマホ：一覧 */}
              <ul className="-mx-5 divide-y divide-neutral-100 border-t border-neutral-100 sm:hidden">
                {purchases.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <Link href={`/admin/talents/${p.talent.id}`} className="text-sm font-medium text-neutral-950 underline-offset-4 hover:underline">
                        {p.talent.name}
                      </Link>
                      <p className="mt-0.5 text-xs tabular-nums text-neutral-500">
                        {p.paidAt ? `支払日 ${formatDate(p.paidAt)}` : `申込日 ${formatDate(p.createdAt)}`}
                      </p>
                    </div>
                    <StatusChip tone={PURCHASE_TONE[p.status] ?? "gray"} label={OPTION_PURCHASE_STATUS_LABELS[p.status] ?? p.status} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </Section>

        <aside className="min-w-0">
          <Section title="オプションの内容">
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-xs text-neutral-500">詳しい内容</dt>
                <dd className="mt-1 whitespace-pre-wrap leading-relaxed text-neutral-950">
                  {option.description || <span className="text-neutral-500">未入力</span>}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">タレントへの表示</dt>
                <dd className="mt-1 text-neutral-950">
                  {active ? "マイページに表示中" : option.status === "DRAFT" ? "表示されていません（下書き）" : "表示されていません（終了）"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-500">登録日</dt>
                <dd className="mt-1 tabular-nums text-neutral-950">{formatDate(option.createdAt)}</dd>
              </div>
            </dl>
          </Section>
        </aside>
      </div>

      {/* 削除はうっかり押さないよう、いちばん下に離して置く */}
      <section className="rounded-xl border border-red-200 bg-white p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6">
        <div>
          <h2 className="text-base font-semibold text-neutral-950">このオプションを削除</h2>
          <p className="mt-1 text-sm text-neutral-500">
            {paid > 0
              ? `支払済みの購入が${paid}件あるため削除できません。受付をやめる場合は「編集」で「終了」にしてください。`
              : purchases.length > 0
                ? `削除すると、購入の記録（${purchases.length}件・支払済みなし）も一緒に消え、元に戻せません。受付をやめるだけなら「編集」で「終了」にしてください。`
                : "削除すると元に戻せません。受付をやめるだけなら「編集」で「終了」にしてください。"}
          </p>
        </div>
        {paid === 0 && (
          <DeleteButton
            id={option.id}
            type="option"
            label="削除する"
            className={`${DANGER_BUTTON} mt-4 w-full sm:mt-0 sm:w-auto`}
            confirmMessage={`「${option.name}」を削除します。\n元に戻せません。本当に削除しますか？`}
          />
        )}
      </section>
    </div>
  )
}
