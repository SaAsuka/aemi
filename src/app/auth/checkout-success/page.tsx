"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function CheckoutSuccessPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => router.push("/jobs"), 3000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-4 p-6 text-center">
        <h1 className="text-2xl font-bold">登録完了</h1>
        <p className="text-sm text-muted-foreground">
          サブスクリプションの登録が完了しました。<br />案件一覧に移動します...
        </p>
      </div>
    </div>
  )
}
