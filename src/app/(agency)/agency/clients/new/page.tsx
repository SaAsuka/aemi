import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AgencyClientForm } from "@/components/agency/agency-client-form"

export default function AgencyClientNewPage() {
  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/agency/clients" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">クライアント新規登録</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>クライアント情報</CardTitle>
        </CardHeader>
        <CardContent>
          <AgencyClientForm />
        </CardContent>
      </Card>
    </div>
  )
}
