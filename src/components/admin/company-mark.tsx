// 会社名の頭文字のマーク（「株式会社」などは飛ばして1文字目を出す）
function initialOf(name: string) {
  const trimmed = name.replace(/^(株式会社|有限会社|合同会社|合資会社|合名会社|一般社団法人|\(株\)|（株）)\s*/, "")
  return (trimmed || name).trim().charAt(0)
}

export function CompanyMark({ name, className = "size-10 text-sm" }: { name: string; className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-lg bg-neutral-100 font-semibold text-neutral-600 ${className}`}
      aria-hidden="true"
    >
      {initialOf(name)}
    </span>
  )
}
