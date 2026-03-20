import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClientForm } from "@/components/admin/client-form"

export default function NewClientPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">クライアント新規登録</h1>
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientForm />
        </CardContent>
      </Card>
    </div>
  )
}
