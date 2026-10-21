"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// 決済完了を見せてから、3秒後に使い方の案内（/welcome）へ移る
export function RedirectToWelcome() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => router.push("/welcome"), 3000)
    return () => clearTimeout(timer)
  }, [router])

  return null
}
