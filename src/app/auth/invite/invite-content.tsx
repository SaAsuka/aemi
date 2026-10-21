"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, Loader2 } from "lucide-react"
import { verifyToken } from "@/lib/actions/auth"
import { AuthHeading } from "@/components/auth/auth-form"

export function InviteContent() {
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
            <span className="inline-block">招待メールに記載されたリンクを</span>
            <span className="inline-block">もう一度開いてください。</span>
          </>
        }
      />
    )
  }

  if (error) {
    return <ErrorView title="登録できませんでした" description={error} />
  }

  return <RegisteringView />
}

export function RegisteringView() {
  return (
    <div role="status" aria-live="polite">
      <div className="flex size-12 items-center justify-center rounded-full bg-neutral-100">
        <Loader2
          className="size-6 animate-spin text-neutral-950 motion-reduce:animate-none"
          aria-hidden="true"
        />
      </div>
      <AuthHeading
        title="登録しています"
        description={
          <>
            <span className="inline-block">登録の手続きをしています。</span>
            <span className="inline-block">このままお待ちください。</span>
          </>
        }
        className="mt-6"
      />
    </div>
  )
}

// 招待された方はまだログインできないので、ログイン画面へは案内せず問い合わせ先を示す
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
      <p className="mt-8 border-t border-neutral-200 pt-6 text-xs leading-relaxed text-neutral-500">
        解決しない場合は、
        <span className="inline-block">招待メールの送り主にお問い合わせください。</span>
      </p>
    </div>
  )
}
