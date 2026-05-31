import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProductionCompanyForm } from "@/components/admin/production-company-form"

export default function NewProductionCompanyPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">制作会社 新規登録</h1>
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductionCompanyForm />
        </CardContent>
      </Card>
    </div>
  )
}
