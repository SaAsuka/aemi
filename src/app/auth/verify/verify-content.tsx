"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, Loader2 } from "lucide-react"
import { verifyToken } from "@/lib/actions/auth"
import { AuthHeading, SECONDARY_BUTTON } from "@/components/auth/auth-form"

export function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token) return

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

  if (!token) {
    return (
      <ErrorView
        title="リンクが正しくありません"
        description={
          <>
            <span className="inline-block">メールに記載されたリンクを</span>
            <span className="inline-block">もう一度開いてください。</span>
          </>
        }
      />
    )
  }

  if (error) {
    return <ErrorView title="確認できませんでした" description={error} />
  }

  return <VerifyingView />
}

export function VerifyingView() {
  return (
    <div role="status" aria-live="polite">
      <div className="flex size-12 items-center justify-center rounded-full bg-neutral-100">
        <Loader2
          className="size-6 animate-spin text-neutral-950 motion-reduce:animate-none"
          aria-hidden="true"
        />
      </div>
      <AuthHeading
        title="確認しています"
        description="メールアドレスを確認しています。このままお待ちください。"
        className="mt-6"
      />
    </div>
  )
}

function ErrorView({
  title,
  description,
}: {
  title: string
  description: React.ReactNode
}) {
  return (
    <div>
      <div className="flex size-12 items-center justify-center rounded-full bg-red-50">
        <AlertCircle className="size-6 text-red-600" aria-hidden="true" />
      </div>
      <AuthHeading title={title} description={description} className="mt-6" />
      <a href="/auth/login" className={`${SECONDARY_BUTTON} mt-8`}>
        ログインページに戻る
      </a>
    </div>
  )
}
