import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TalentRegisterForm } from "@/components/talent-register-form"

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-primary text-primary-foreground py-4 px-6">
        <h1 className="text-lg font-bold tracking-wider">VOZEL</h1>
      </header>
      <main className="max-w-2xl mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">タレント登録フォーム</CardTitle>
            <p className="text-sm text-muted-foreground">以下の情報をご入力ください。* は必須項目です。</p>
          </CardHeader>
          <CardContent>
            <TalentRegisterForm />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
