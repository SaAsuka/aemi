import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OptionForm } from "@/components/admin/option-form"

export default async function NewOptionPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">オプション新規作成</h1>
      <Card>
        <CardHeader>
          <CardTitle>オプション情報</CardTitle>
        </CardHeader>
        <CardContent>
          <OptionForm />
        </CardContent>
      </Card>
    </div>
  )
}
