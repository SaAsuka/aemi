import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記 | VOZEL",
}

const items: { label: string; value: string }[] = [
  { label: "販売業者", value: "○○株式会社" },
  { label: "代表者名", value: "○○ ○○" },
  { label: "所在地", value: "〒○○○-○○○○ ○○県○○市○○" },
  { label: "電話番号", value: "○○-○○○○-○○○○（受付時間：平日10:00〜18:00）" },
  { label: "メールアドレス", value: "info@vozel.jp" },
  { label: "サービスURL", value: "https://app.vozel.jp" },
  {
    label: "販売価格",
    value: "タレント1名あたり月額○○円（税込）\n※ご利用のプランにより異なります。登録時にご確認ください。",
  },
  {
    label: "支払い方法",
    value: "クレジットカード（Visa・Mastercard・American Express・JCB）",
  },
  {
    label: "支払い時期",
    value: "登録時に初回課金が発生し、以降は毎月同日に自動で請求されます。",
  },
  {
    label: "サービス提供時期",
    value: "お支払い完了後、直ちにご利用いただけます。",
  },
  {
    label: "キャンセル・解約",
    value:
      "マイページまたはメール（info@vozel.jp）にてお申し出ください。解約申し出は次回更新日の○日前までに受け付けます。既にお支払いいただいた料金の返金はいたしません。",
  },
  {
    label: "動作環境",
    value: "最新バージョンのGoogle Chrome・Safari・Microsoft Edge（インターネット接続が必要です）",
  },
]

export default function TokushoPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link href="/" className="text-lg font-bold tracking-wider">VOZEL</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-2">特定商取引法に基づく表記</h1>
        <p className="text-sm text-gray-500 mb-10">最終更新日：2026年　○月　○日</p>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                  <th className="text-left align-top px-5 py-4 font-medium text-gray-700 w-36 whitespace-nowrap border-b">
                    {item.label}
                  </th>
                  <td className="align-top px-5 py-4 text-gray-800 border-b whitespace-pre-line">
                    {item.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
