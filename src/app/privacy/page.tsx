import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "プライバシーポリシー | VOZEL",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link href="/" className="text-lg font-bold tracking-wider">VOZEL</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-2">プライバシーポリシー</h1>
        <p className="text-sm text-gray-500 mb-10">制定日：2026年　○月　○日</p>

        <div className="space-y-10 text-sm leading-relaxed text-gray-800">
          <section>
            <h2 className="text-base font-semibold mb-3">1. 事業者情報</h2>
            <div className="text-gray-700 space-y-1">
              <p>商号　　：○○株式会社</p>
              <p>住所　　：〒○○○-○○○○ ○○県○○市○○</p>
              <p>代表者　：○○ ○○</p>
              <p>お問い合わせ：<a href="mailto:privacy@vozel.jp" className="underline text-primary">privacy@vozel.jp</a></p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">2. 取得する個人情報の種類</h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <p className="font-medium mb-2">■ タレントから取得するもの</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>氏名・フリガナ・ローマ字</li>
                  <li>メールアドレス・電話番号</li>
                  <li>生年月日・性別・出身地・住所</li>
                  <li>身長・体重・スリーサイズ・靴サイズ</li>
                  <li>宣材写真・プロフィール画像</li>
                  <li>銀行口座情報（振込先として利用）</li>
                  <li>LINEユーザーID（LINE通知連携）</li>
                  <li>SNSアカウント情報</li>
                  <li>応募・案件履歴</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">■ 代理店・担当者から取得するもの</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>事務所名・担当者氏名</li>
                  <li>メールアドレス・電話番号・住所</li>
                  <li>クレジットカード情報（Stripe経由で処理。当社では保持しません）</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">3. 利用目的</h2>
            <p className="text-gray-700 mb-2">取得した個人情報は以下の目的のために利用します。</p>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>タレント管理・案件マッチングサービスの提供</li>
              <li>LINEによる通知・連絡の送信</li>
              <li>請求書発行・経理処理（Freee連携）</li>
              <li>カスタマーサポートの提供</li>
              <li>サービス改善・機能開発</li>
              <li>重要事項・規約変更等のご連絡</li>
            </ol>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">4. 第三者提供</h2>
            <p className="text-gray-700 mb-3">当社は、以下のサービスにおいてデータを提供する場合があります。各社のプライバシーポリシーもあわせてご確認ください。</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Stripe, Inc.（クレジットカード決済処理）</li>
              <li>LINE株式会社（メッセージ通知）</li>
              <li>Resend, Inc.（メール送信）</li>
              <li>Vercel, Inc.（サーバーホスティング・ファイルストレージ）</li>
              <li>Supabase, Inc.（データベース・ファイルストレージ）</li>
              <li>freee株式会社（会計・請求書作成）</li>
            </ul>
            <p className="text-gray-700 mt-3">上記以外の第三者への提供は、法令に基づく場合または利用者の同意がある場合を除き行いません。</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">5. 共同利用</h2>
            <p className="text-gray-700">本サービスにおいて、親代理店と子代理店間でタレント情報を共有する機能があります。共有範囲はシステム設定により制御されます。</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">6. 保存期間</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>利用中：サービス提供のために必要な期間</li>
              <li>解約後：○ヶ月間保持したうえで完全削除</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">7. 安全管理措置</h2>
            <p className="text-gray-700 mb-2">当社は取得した個人情報に対して以下の安全管理措置を講じています。</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>通信のSSL/TLS暗号化</li>
              <li>アクセス権限の最小化・管理</li>
              <li>不正アクセス防止のための認証管理</li>
              <li>外部サービスはいずれも高水準のセキュリティ認証取得済み</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">8. Cookie・アクセスログの取得</h2>
            <p className="text-gray-700">本サービスではセッション管理のためにCookieを使用しています。ブラウザの設定からCookieを無効化できますが、その場合ログインができなくなります。アクセスログはサービス改善・不正アクセス検知のために収集します。</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">9. 個人情報の開示・訂正・削除の請求</h2>
            <p className="text-gray-700">ご本人から個人情報の開示・訂正・削除の請求があった場合、本人確認のうえ、合理的な期間（通常○営業日以内）に対応いたします。</p>
            <p className="text-gray-700 mt-2">請求先：<a href="mailto:privacy@vozel.jp" className="underline text-primary">privacy@vozel.jp</a></p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-3">10. プライバシーポリシーの変更</h2>
            <p className="text-gray-700">本ポリシーを変更する場合は、変更内容と施行日をサービス上またはメールにてお知らせします。重要な変更については14日以上前に通知します。</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t text-xs text-gray-400 space-y-1">
          <p>○○株式会社</p>
          <p>〒○○○-○○○○ ○○県○○市○○</p>
          <p>お問い合わせ：<a href="mailto:privacy@vozel.jp" className="underline">privacy@vozel.jp</a></p>
        </div>
      </main>
    </div>
  )
}
