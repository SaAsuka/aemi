"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { verifyAgencyEmail } from "@/lib/actions/agency-auth"
import { Loader2 } from "lucide-react"

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token) {
      setError("確認トークンがありません")
      return
    }

    verifyAgencyEmail(token).then((result) => {
      if (result.error) {
        setError(result.error)
      } else if (result.redirect) {
        router.push(result.redirect)
      }
    })
  }, [token, router])

  if (error) {
    return (
      <div className="w-full max-w-sm space-y-4 p-6 text-center">
        <h1 className="text-xl font-bold text-red-600">エラー</h1>
        <p className="text-sm text-muted-foreground">{error}</p>
        <a href="/agency/login" className="text-sm text-primary hover:underline">
          ログインページへ
        </a>
      </div>
    )
  }

  return (
    <div className="text-center space-y-3">
      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
      <p className="text-sm text-muted-foreground">メールアドレスを確認中...</p>
    </div>
  )
}

export default function AgencyVerifyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Suspense fallback={
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        </div>
      }>
        <VerifyContent />
      </Suspense>
    </div>
  )
}
