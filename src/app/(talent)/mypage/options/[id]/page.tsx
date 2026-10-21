import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { requireTalent } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { createOptionCheckout } from "@/lib/actions/option-purchase"
import { resolveStorageUrl } from "@/lib/storage-url"
import { isOptionClosed } from "@/lib/option-deadline"
import { TalentNav } from "@/components/talent-nav"
import { AlertCircle, AlertTriangle, CalendarClock, CheckCircle2, ChevronLeft, Clock, Lock } from "lucide-react"
import Link from "next/link"
import { PurchaseButton } from "./purchase-button"

export const metadata: Metadata = {
  title: "レッスン詳細 | VOZEL",
}

export default async function OptionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const talent = await requireTalent()
  const { id } = await params
  const { error } = await searchParams

  const errorMessages: Record<string, string> = {
    paid: "このオプションはすでに購入済みです",
    unavailable: "このオプションは現在購入できません",
    stripe: "決済の開始に失敗しました。しばらく時間をおいて再度お試しください",
  }

  const [option, purchase] = await Promise.all([
    prisma.option.findUnique({ where: { id, status: "ACTIVE" } }),
    prisma.optionPurchase.findUnique({
      where: { optionId_talentId: { optionId: id, talentId: talent.id } },
      select: { status: true },
    }),
  ])

  if (!option) notFound()

  const purchaseStatus = purchase?.status ?? null
  const closed = isOptionClosed(option.deadline)
  const imageUrl = await resolveStorageUrl(option.imageUrl)

  return (
    <div className="min-h-[100dvh] bg-white">
      <TalentNav talentName={talent.stageName || talent.name} />
      <main className="mx-auto max-w-2xl space-y-6 px-4 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-6 text-neutral-950 sm:pt-8">
        <Link
          href="/mypage/options"
          className="-ml-1 inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 text-sm text-neutral-500 transition-colors hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          レッスン一覧に戻る
        </Link>

        {option.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl!} alt="" className="aspect-video w-full rounded-xl bg-neutral-100 object-cover" />
        )}

        <div>
          <h1 className="text-2xl font-semibold leading-snug tracking-tight">{option.name}</h1>
          <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">¥{option.price.toLocaleString()}</p>
          {option.deadline && (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-neutral-500">
              <CalendarClock className="size-4" aria-hidden="true" />
              申込締切: {new Date(option.deadline).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          )}
        </div>

        {option.description && (
          <div className="rounded-xl border border-neutral-200 p-5">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">{option.description}</p>
          </div>
        )}

        {error && errorMessages[error] && (
          <div
            role="alert"
            className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${error === "paid" ? "border-amber-300 bg-amber-50 text-amber-900" : "border-red-200 bg-red-50 text-red-700"}`}
          >
            {error === "paid" ? (
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            )}
            {errorMessages[error]}
          </div>
        )}

        {purchaseStatus === "PAID" ? (
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3.5 text-green-800">
            <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />
            <p className="text-sm font-medium">購入済み</p>
          </div>
        ) : purchaseStatus === "PENDING" ? (
          <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-neutral-600">
            <Clock className="size-5 shrink-0" aria-hidden="true" />
            <p className="text-sm">決済処理中</p>
          </div>
        ) : closed ? (
          <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-neutral-600">
            <Clock className="size-5 shrink-0" aria-hidden="true" />
            <p className="text-sm">申込締切を過ぎたため、受付を終了しました</p>
          </div>
        ) : (
          <div>
            <form action={createOptionCheckout.bind(null, option.id)}>
              <PurchaseButton />
            </form>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-neutral-500">
              <Lock className="size-3.5" aria-hidden="true" />
              お支払いは Stripe の決済画面で行います
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
