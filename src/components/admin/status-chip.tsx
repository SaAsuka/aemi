// 状態を塗りのチップ＋白文字で表す。白文字が読める濃さ（コントラスト4.5以上）の色を選んでいる
export type ChipTone = "green" | "red" | "yellow" | "blue" | "gray"

const CHIP: Record<ChipTone, string> = {
  green: "bg-green-700",
  red: "bg-red-600",
  yellow: "bg-yellow-700",
  blue: "bg-blue-600",
  gray: "bg-neutral-500",
}

export const TALENT_STATUS_TONE: Record<string, ChipTone> = { ACTIVE: "green", INACTIVE: "gray", WITHDRAWN: "red" }
export const SUBSCRIPTION_TONE: Record<string, ChipTone> = {
  ACTIVE: "green",
  NONE: "gray",
  PAST_DUE: "yellow",
  CANCELED: "gray",
  UNPAID: "red",
}
// 案件の状態（下書き＝まだ公開していないので黄）
export const JOB_STATUS_TONE: Record<string, ChipTone> = {
  DRAFT: "yellow",
  OPEN: "green",
  CLOSED: "gray",
  CANCELLED: "red",
}
// 応募の状況（ダッシュボードのグラフと同じ色：応募中＝青・書類送付済＝黄・合格＝緑・不合格＝赤）
export const APPLICATION_TONE: Record<string, ChipTone> = {
  APPLIED: "blue",
  RESUME_SENT: "yellow",
  ACCEPTED: "green",
  REJECTED: "red",
  AUTO_REJECTED: "red",
  CANCELLED: "gray",
}

// 請求書の状態（請求書管理と同じ：下書き＝グレー・発行済＝青・送付済＝黄・入金済＝緑・取消＝赤）
export const INVOICE_TONE: Record<string, ChipTone> = { DRAFT: "gray", ISSUED: "blue", SENT: "yellow", PAID: "green", CANCELLED: "red" }
export const INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "下書き",
  ISSUED: "発行済",
  SENT: "送付済",
  PAID: "入金済",
  CANCELLED: "取消",
}

export function StatusChip({ tone, label }: { tone: ChipTone; label: string }) {
  return (
    <span
      className={`inline-flex h-6 items-center whitespace-nowrap rounded-full px-2.5 text-xs font-medium text-white ${CHIP[tone]}`}
    >
      {label}
    </span>
  )
}
