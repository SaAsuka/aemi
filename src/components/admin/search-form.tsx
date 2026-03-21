"use client"

import { useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import { Input } from "@/components/ui/input"

export function SearchForm({
  placeholder,
  defaultValue,
}: {
  placeholder: string
  defaultValue?: string
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
      placeholder={placeholder}
      defaultValue={defaultValue}
      onChange={(e) => handleSearch(e.target.value)}
      className={`max-w-sm ${isPending ? "opacity-50" : ""}`}
    />
  )
}
