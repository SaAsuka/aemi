"use client"

import { useState } from "react"
import { blobProxyUrl } from "@/lib/utils/blob"

// タレントの顔写真。写真が無い・読み込めないときは名前の1文字目を出す
export function TalentAvatar({
  url,
  name,
  className = "size-10",
}: {
  url: string | null | undefined
  name: string
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const initial = name.trim().charAt(0)

  if (!url || failed) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-sm font-medium text-neutral-500 ${className}`}
        aria-hidden="true"
      >
        {initial}
      </span>
    )
  }

  return (
    // 一覧で何十枚も並ぶので、画面に入ったものから読み込む
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={blobProxyUrl(url)}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`shrink-0 rounded-lg bg-neutral-100 object-cover object-top ${className}`}
    />
  )
}
