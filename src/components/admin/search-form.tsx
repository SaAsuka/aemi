"use client"

import { useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function SearchForm({
  placeholder,
  defaultValue,
  className,
  id,
}: {
  placeholder: string
  defaultValue?: string
  // id を固定すると、ラベルと結び付き、自動で振られる id のずれ（ハイドレーション警告）も防げる
  id?: string
  // 見た目を画面ごとに変えたいとき用（未指定なら従来どおり）
  className?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  function handleSearch(value: string) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set("q", value)
      } else {
        params.delete("q")
      }
      startTransition(() => {
        router.push(`?${params.toString()}`)
      })
    }, 300)
  }

  return (
    <Input
      id={id}
      placeholder={placeholder}
      defaultValue={defaultValue}
      onChange={(e) => handleSearch(e.target.value)}
      aria-busy={isPending}
      className={cn("max-w-sm", isPending && "opacity-50", className)}
    />
  )
}
