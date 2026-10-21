import type { Metadata } from "next"
import { AlertCircle, Check } from "lucide-react"
import { AuthShell } from "@/components/auth/auth-shell"
import { AuthHeading } from "@/components/auth/auth-form"

export const metadata: Metadata = {
  title: "LINE連携 | VOZEL",
}

// LINE連携ボタンを押したのとは別のブラウザ（例：InstagramやLINEのアプリ内ブラウザから
// LINEアプリ経由でSafariに戻った場合）で連携を終えた人向けの画面。ログインは不要で、
// 個人情報は一切表示しない
export default async function LineConnectedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const failed = status === "error"

  return (
    <AuthShell>
      {failed ? (
        <div className="flex size-12 items-center justify-center rounded-full bg-red-50">
          <AlertCircle className="size-6 text-red-600" aria-hidden="true" />
        </div>
      ) : (
        <div className="flex size-12 items-center justify-center rounded-full bg-[#06C755]">
          <Check className="size-6 text-white" aria-hidden="true" />
        </div>
      )}
      <AuthHeading
        title={failed ? "LINE連携に失敗しました" : "LINE連携が完了しました"}
        description={
          failed ? (
            <>
              <span className="inline-block">時間が経ちすぎたか、</span>
              <span className="inline-block">途中で操作が中断された可能性があります。</span>
              <br />
              <span className="inline-block">お手数ですが、マイページの設定から</span>
              <span className="inline-block">もう一度お試しください。</span>
            </>
          ) : (
            <>
              <span className="inline-block">新しい案件が登録されると</span>
              <span className="inline-block">LINEで通知が届きます。</span>
            </>
          )
        }
        className="mt-6"
      />
      {!failed && (
        <p className="mt-8 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-700">
          <span className="inline-block">この画面は閉じて、</span>
          <span className="inline-block">元のアプリ・ブラウザに戻ってください。</span>
        </p>
      )}
    </AuthShell>
  )
}
