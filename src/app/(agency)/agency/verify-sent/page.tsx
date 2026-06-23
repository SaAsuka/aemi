import Link from "next/link"
import { MailCheck } from "lucide-react"

export default function VerifySentPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-white p-8 shadow-sm text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <MailCheck className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div>
          <h1 className="text-xl font-bold">確認メールを送信しました</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            登録したメールアドレスに確認メールを送信しました。
            メール内のリンクをクリックして登録を完了してください。
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          メールが届かない場合は迷惑メールフォルダをご確認ください。
        </p>
        <Link href="/agency/login" className="block text-sm text-primary hover:underline">
          ログインページへ戻る
        </Link>
      </div>
    </div>
  )
}
