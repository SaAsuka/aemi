import { isFreeeConnected } from "@/lib/freee"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FreeeConnectButton } from "@/components/admin/freee-connect-button"

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ freee?: string }>
}) {
  const { freee } = await searchParams
  const connected = await isFreeeConnected()

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">設定</h1>

      {freee === "connected" && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-800">
          Freeeとの連携が完了しました
        </div>
      )}
      {freee === "error" && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          Freee連携に失敗しました。もう一度お試しください。
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Freee連携</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm">連携状態:</span>
            {connected ? (
              <Badge variant="outline" className="text-green-700 border-green-300">連携済</Badge>
            ) : (
              <Badge variant="outline" className="text-gray-500 border-gray-300">未連携</Badge>
            )}
          </div>
          <FreeeConnectButton connected={connected} />
          {connected && (
            <p className="text-xs text-muted-foreground">
              再連携する場合は上のボタンを押してください。トークンが更新されます。
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
