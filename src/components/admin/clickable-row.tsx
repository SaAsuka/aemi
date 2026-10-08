"use client"

import { useRouter } from "next/navigation"
import { TableRow } from "@/components/ui/table"

// 行（カード）のどこを押しても詳細へ移る。中のリンク・ボタンを押したときはそちらを優先する
function useRowNavigate(href: string) {
  const router = useRouter()
  return (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest("a, button")) return
    // 文字を選択しているとき（コピーしたいとき）は移動しない
    if (window.getSelection()?.toString()) return
    router.push(href)
  }
}

export function ClickableRow({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: React.ReactNode
}) {
  const onClick = useRowNavigate(href)

  return (
    <TableRow className={`cursor-pointer ${className ?? ""}`} onClick={onClick}>
      {children}
    </TableRow>
  )
}

export function ClickableCard({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: React.ReactNode
}) {
  const onClick = useRowNavigate(href)

  return (
    <div className={`cursor-pointer ${className ?? ""}`} onClick={onClick}>
      {children}
    </div>
  )
}
