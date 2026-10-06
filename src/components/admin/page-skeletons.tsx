import { PANEL } from "@/components/admin/styles"

// 読み込み中の仮表示（loading.tsx）で使う部品

export function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-neutral-100 ${className}`} />
}

// 見出し＋枠がいくつか並ぶ、どのページにも合う仮表示
export function GenericPageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Bone className="h-8 w-40" />
        <Bone className="mt-2 h-4 w-72 max-w-full" />
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className={`${PANEL} space-y-3 p-5 sm:p-6`}>
          <Bone className="h-5 w-32" />
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  )
}

// 「新規作成」ページ（戻るリンク・見出し・入力欄の枠）の仮表示
export function FormPageSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Bone className="h-4 w-24" />
        <Bone className="mt-3 h-8 w-56" />
        <Bone className="mt-2 h-4 w-80 max-w-full" />
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className={`${PANEL} space-y-5 p-5 sm:p-6`}>
          <div>
            <Bone className="h-5 w-36" />
            <Bone className="mt-2 h-4 w-64 max-w-full" />
          </div>
          {Array.from({ length: 3 }).map((_, j) => (
            <div key={j}>
              <Bone className="h-4 w-24" />
              <Bone className="mt-2 h-9 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
