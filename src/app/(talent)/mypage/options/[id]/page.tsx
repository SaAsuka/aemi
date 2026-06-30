import { notFound } from "next/navigation"
import { requireTalent } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { createOptionCheckout } from "@/lib/actions/option-purchase"
import { resolveStorageUrl } from "@/lib/storage-url"
import { TalentNav } from "@/components/talent-nav"
import { CheckCircle2, Clock, ArrowLeft } from "lucide-react"
import Link from "next/link"

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
    prisma.option.findFirst({ where: { id, status: "ACTIVE", ...(talent.agencyId ? { agencyId: talent.agencyId } : {}) } }),
    prisma.optionPurchase.findUnique({
      where: { optionId_talentId: { optionId: id, talentId: talent.id } },
      select: { status: true },
    }),
  ])

  if (!option) notFound()

  const purchaseStatus = purchase?.status ?? null
  const imageUrl = await resolveStorageUrl(option.imageUrl)

  return (
    <>
      <TalentNav talentName={talent.stageName || talent.name} />
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        <Link href="/mypage/options" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          レッスン一覧に戻る
        </Link>

        {option.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl!} alt={option.name} className="w-full rounded-lg aspect-video object-cover" />
        )}

        <div className="space-y-4">
          <h1 className="text-2xl font-bold">{option.name}</h1>
          <p className="text-2xl font-bold">¥{option.price.toLocaleString()}</p>

          {option.deadline && (
            <p className="text-sm text-muted-foreground">
              申込締切: {new Date(option.deadline).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          )}

          {option.description && (
            <div className="rounded-lg border p-4">
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{option.description}</p>
            </div>
          )}

          {error && errorMessages[error] && (
            <div className={`rounded-lg border p-4 text-sm ${error === "paid" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-red-200 bg-red-50 text-red-800"}`}>
              {errorMessages[error]}
            </div>
          )}

          {purchaseStatus === "PAID" ? (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">購入済み</p>
            </div>
          ) : purchaseStatus === "PENDING" ? (
            <div className="flex items-center gap-2 rounded-lg border p-4 text-muted-foreground">
              <Clock className="h-5 w-5 shrink-0" />
              <p className="text-sm">決済処理中</p>
            </div>
          ) : (
            <form action={createOptionCheckout.bind(null, option.id)}>
              <button
                type="submit"
                className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                購入する
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  )
}
