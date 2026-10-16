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
    <div className="flex min-h-[100dvh] items-center justify-center">
      <div className="w-full max-w-sm space-y-4 p-6 text-center">
        <h1 className="text-2xl font-bold">{failed ? "LINE連携に失敗しました" : "LINE連携が完了しました"}</h1>
        <p className="text-sm text-muted-foreground">
          {failed ? (
            <>
              時間が経ちすぎたか、途中で操作が中断された可能性があります。
              <br />
              お手数ですが、マイページの設定からもう一度お試しください。
            </>
          ) : (
            <>
              新しい案件が登録されるとLINEで通知が届きます。
              <br />
              この画面は閉じて、元のアプリ・ブラウザに戻ってください。
            </>
          )}
        </p>
      </div>
    </div>
  )
}
