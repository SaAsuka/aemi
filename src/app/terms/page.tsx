import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "利用規約 | VOZEL",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link href="/" className="text-lg font-bold tracking-wider">VOZEL</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-2">利用規約</h1>
        <p className="text-sm text-gray-500 mb-10">制定日：2026年　○月　○日</p>

        <div className="space-y-10 text-sm leading-relaxed text-gray-800">
          <section>
            <h2 className="text-base font-semibold mb-3">第1条（サービスの概要）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>本規約は、○○株式会社（以下「当社」）が提供する「VOZEL」（以下「本サービス」）の利用条件を定めるものです。</li>
              <li>本サービスは、タレント事務所・代理店向けに、タレント管理・案件管理・LINE通知連携・経理連携（Freee）等の機能を提供するSaaSプラットフォームです。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">第2条（利用資格・アカウント）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>本サービスはタレント事務所および代理店を対象としており、個人の利用はできません。</li>
              <li>アカウント登録にあたり、正確な情報を入力する義務があります。虚偽の情報を登録した場合、当社はアカウントを停止または削除できるものとします。</li>
              <li>アカウントの管理責任はご利用者にあります。ID・パスワードの第三者への開示・貸与は禁止します。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">第3条（料金・支払い）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>本サービスの利用料金は、タレント1名あたり月額○○円（税込）です。</li>
              <li>支払いはクレジットカードのみとし、Stripe株式会社が提供する決済サービスを通じて処理されます。</li>
              <li>料金は毎月○日に自動更新・請求されます。</li>
              <li>一度支払われた利用料金は、原則として返金いたしません。ただし、当社の重大な過失によりサービスが提供できなかった場合はこの限りではありません。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">第4条（契約期間・解約）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>契約期間は月単位とし、解約の申し出がない限り自動更新されます。</li>
              <li>解約はマイページの解約手続きまたは当社へのメール連絡（○○@○○）により受け付けます。</li>
              <li>解約申し出は次回更新日の○日前までに行う必要があります。</li>
              <li>解約後、登録データは○ヶ月間保持された後、完全に削除されます。データのエクスポートは解約前に行ってください。</li>
              <li>当社は、利用者が本規約に違反した場合、事前通知なくアカウントを停止・解約できるものとします。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">第5条（禁止事項）</h2>
            <p className="text-gray-700 mb-2">利用者は以下の行為を行ってはなりません。</p>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>他の利用者・第三者へのなりすまし・不正アクセス</li>
              <li>虚偽の情報の登録</li>
              <li>反社会的勢力による利用</li>
              <li>システムへの不正操作・リバースエンジニアリング・過度な負荷</li>
              <li>その他当社が不適切と判断する行為</li>
            </ol>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">第6条（知的財産権）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>本サービスに関するシステム・デザイン・コンテンツの著作権は当社に帰属します。</li>
              <li>利用者が本サービスに登録したデータ（タレント情報・写真等）の著作権は利用者に帰属します。当社は、サービス提供に必要な範囲でのみこれらのデータを利用します。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">第7条（免責事項）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>当社は、システム障害・メンテナンス・第三者サービス（Stripe・LINE・Freee等）の障害による損害について、当社の故意・重過失による場合を除き責任を負いません。</li>
              <li>本サービスはタレントと仕事のマッチングを保証するものではありません。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">第8条（損害賠償の上限）</h2>
            <p className="text-gray-700">当社が利用者に対して損害賠償責任を負う場合、その上限は損害発生時における直近3ヶ月分の利用料金の合計額とします。</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">第9条（サービスの変更・終了）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>機能変更・料金改定は、原則として変更の30日前までにメールまたはサービス内で通知します。</li>
              <li>サービスを終了する場合は、60日前までに通知し、データのエクスポート期間を設けます。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">第10条（準拠法・管轄裁判所）</h2>
            <p className="text-gray-700">本規約は日本法に準拠するものとし、本サービスに関する紛争については東京地方裁判所を第一審の専属的合意管轄裁判所とします。</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t text-xs text-gray-400 space-y-1">
          <p>○○株式会社</p>
          <p>〒○○○-○○○○ ○○県○○市○○</p>
          <p>お問い合わせ：<a href="mailto:info@vozel.jp" className="underline">info@vozel.jp</a></p>
        </div>
      </main>
    </div>
  )
}
