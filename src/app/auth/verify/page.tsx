"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { verifyToken } from "@/lib/actions/auth"

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token) {
      setError("トークンがありません")
      return
    }

    verifyToken(token).then((result) => {
      if (result.error) {
        setError(result.error)
      } else if (result.redirect) {
        if (result.redirect.startsWith("http")) {
          window.location.href = result.redirect
        } else {
          router.push(result.redirect)
        }
      }
    })
  }, [token, router])

  if (error) {
    return (
      <div className="w-full max-w-sm space-y-4 p-6 text-center">
        <h1 className="text-xl font-bold text-red-600">エラー</h1>
        <p className="text-sm text-muted-foreground">{error}</p>
        <a href="/auth/login" className="text-sm text-primary hover:underline">
          ログインページに戻る
        </a>
      </div>
    )
  }

  return (
    <div className="text-center space-y-2">
      <p className="text-sm text-muted-foreground">認証中...</p>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Suspense fallback={<p className="text-sm text-muted-foreground">読み込み中...</p>}>
        <VerifyContent />
      </Suspense>
    </div>
  )
}
