import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TalentForm } from "@/components/admin/talent-form"

export default function NewTalentPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">タレント新規登録</h1>
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent>
          <TalentForm />
        </CardContent>
      </Card>
    </div>
  )
}
