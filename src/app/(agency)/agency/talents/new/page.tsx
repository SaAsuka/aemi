import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AgencyTalentForm } from "@/components/agency/agency-talent-form"

export default function AgencyNewTalentPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/agency/talents" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">タレント新規登録</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent>
          <AgencyTalentForm />
        </CardContent>
      </Card>
    </div>
  )
}
