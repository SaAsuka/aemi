export const GENDER_LABELS: Record<string, string> = {
  MALE: "男性",
  FEMALE: "女性",
  OTHER: "その他",
}

export const TALENT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "アクティブ",
  INACTIVE: "非アクティブ",
  WITHDRAWN: "退会",
}

export const JOB_STATUS_LABELS: Record<string, string> = {
  DRAFT: "下書き",
  OPEN: "募集中",
  CLOSED: "募集終了",
  CANCELLED: "キャンセル",
}

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  APPLIED: "応募済み",
  RESUME_SENT: "書類送付済",
  ACCEPTED: "合格",
  REJECTED: "不合格",
  AUTO_REJECTED: "自動不合格",
  CANCELLED: "キャンセル",
}

export const SCHEDULE_STATUS_LABELS: Record<string, string> = {
  CONFIRMED: "確定",
  COMPLETED: "完了",
  NO_SHOW: "無断欠席",
  CANCELLED: "キャンセル",
}

export const JOB_DATE_TYPE_LABELS: Record<string, string> = {
  AUDITION: "オーディション",
  SHOOTING: "撮影",
  OTHER: "その他",
}

export const SUBMISSION_CATEGORY_LABELS: Record<string, string> = {
  ACTING_VIDEO: "課題演技動画",
  VOICE_SAMPLE: "ボイスサンプル",
  PAST_WORK_VIDEO: "過去出演動画",
  PROFILE_PHOTO: "宣材写真",
}

export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  NONE: "未契約",
  ACTIVE: "契約中",
  PAST_DUE: "支払遅延",
  CANCELED: "解約済",
  UNPAID: "未払い",
}

export const OPTION_STATUS_LABELS: Record<string, string> = {
  DRAFT: "下書き",
  ACTIVE: "公開中",
  CLOSED: "終了",
}

export const OPTION_CATEGORY_LABELS: Record<string, string> = {
  PHOTOGRAPHY: "撮影",
  STYLING: "スタイリング",
  LESSON: "レッスン",
  OTHER: "その他",
}

export const OPTION_PURCHASE_STATUS_LABELS: Record<string, string> = {
  PENDING: "未払い",
  PAID: "支払済",
  FAILED: "失敗",
  REFUNDED: "返金済",
}

export const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-gray-100 text-gray-800",
  WITHDRAWN: "bg-red-100 text-red-800",
  DRAFT: "bg-gray-100 text-gray-800",
  OPEN: "bg-blue-100 text-blue-800",
  CLOSED: "bg-yellow-100 text-yellow-800",
  CANCELLED: "bg-red-100 text-red-800",
  APPLIED: "bg-blue-100 text-blue-800",
  RESUME_SENT: "bg-purple-100 text-purple-800",
  ACCEPTED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  AUTO_REJECTED: "bg-orange-100 text-orange-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  NO_SHOW: "bg-red-100 text-red-800",
  SUB_NONE: "bg-gray-100 text-gray-800",
  SUB_ACTIVE: "bg-green-100 text-green-800",
  SUB_PAST_DUE: "bg-orange-100 text-orange-800",
  SUB_CANCELED: "bg-yellow-100 text-yellow-800",
  SUB_UNPAID: "bg-red-100 text-red-800",
  MALE: "bg-blue-100 text-blue-800",
  FEMALE: "bg-pink-100 text-pink-800",
  OTHER: "bg-gray-100 text-gray-800",
  PAID: "bg-green-100 text-green-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  FAILED: "bg-red-100 text-red-800",
  REFUNDED: "bg-orange-100 text-orange-800",
  PHOTOGRAPHY: "bg-purple-100 text-purple-800",
  STYLING: "bg-pink-100 text-pink-800",
  LESSON: "bg-blue-100 text-blue-800",
}
