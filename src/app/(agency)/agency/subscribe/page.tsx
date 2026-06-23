import Link from "next/link"
import { requireAgencyAdmin } from "@/lib/agency-auth"
import { CreditCard, CheckCircle2 } from "lucide-react"

export default async function AgencySubscribePage() {
  const agency = await requireAgencyAdmin()

  const priceId = process.env.AGENCY_STRIPE_PRICE_ID

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-6 rounded-xl border bg-white p-8 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">ステップ 2 / 3</span>
          </div>
          <h1 className="text-xl font-bold">お支払いプランの選択</h1>
          <p className="text-sm text-muted-foreground mt-1">{agency.name} 様</p>
        </div>

        {priceId ? (
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-primary p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">スタンダードプラン</span>
                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">おすすめ</span>
              </div>
              <p className="text-2xl font-bold">¥500 <span className="text-sm font-normal text-muted-foreground">/ タレント / 月</span></p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" />タレント管理</li>
                <li className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" />案件マッチング</li>
                <li className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" />LINE連携</li>
              </ul>
            </div>
            <form action="/api/agency/create-checkout" method="POST">
              <input type="hidden" name="agencyId" value={agency.id} />
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground"
              >
                <CreditCard className="h-4 w-4" />
                お支払い情報を入力する
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-5 space-y-3">
              <p className="font-semibold text-blue-900">ご登録ありがとうございます</p>
              <p className="text-sm text-blue-800">
                お支払いの設定については担当者よりご連絡いたします。
                下記のメールアドレスまでお問い合わせください。
              </p>
              <a
                href={`mailto:${process.env.AGENCY_CONTACT_EMAIL ?? "info@vozel.jp"}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:underline"
              >
                {process.env.AGENCY_CONTACT_EMAIL ?? "info@vozel.jp"}
              </a>
            </div>
            <Link
              href="/agency/dashboard"
              className="block w-full text-center rounded-md bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground"
            >
              ダッシュボードへ進む
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
